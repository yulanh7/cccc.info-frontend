"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import SaveConfirmModal from "../SaveConfirmModal";
import type { PostFileApi } from "@/app/types";
import { compressImageFile } from "@/app/ultility/imageCompression";

const IMAGE_ACCEPT = ".png,.jpg,.jpeg,.gif,.bmp,.webp";
const DOC_ACCEPT = ".doc,.docx,.pdf";

type FormModel = {
  title: string;
  description: string;
  content: string;
  videos: string[];
  fileIds: number[];
  localFiles?: File[];
};

type PostModalProps = {
  item?: Partial<FormModel>;
  isNew: boolean;
  onSave: (form: FormModel) => void | Promise<void>;
  onClose: () => void;
  saving?: boolean;
  existingFiles?: PostFileApi[];
  uploadingPercent?: number;
};

const MAX_TITLE = 100;

// —— 简单的 MIME 判断（与文件 API 对齐）
const isImageMime = (mime?: string) => !!mime && /^image\//i.test(mime);
const isDocMime = (mime?: string) =>
  !!mime &&
  /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/i.test(
    mime
  );

function splitFiles(files: PostFileApi[]) {
  const images = files.filter((f) => isImageMime(f.file_type));
  const documents = files.filter((f) => isDocMime(f.file_type));
  const others = files.filter((f) => !isImageMime(f.file_type) && !isDocMime(f.file_type));
  return { images, documents, others };
}

export default function PostModal({
  item,
  isNew,
  onSave,
  onClose,
  saving = false,
  existingFiles = [],
  uploadingPercent = 0,
}: PostModalProps) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [content, setContent] = useState(item?.content ?? ""); // ← content
  const [videos, setVideos] = useState<string[]>(item?.videos ?? []);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [placement, setPlacement] = useState<"above" | "below">("below");

  const [fileIds, setFileIds] = useState<number[]>(
    item?.fileIds ??
    (existingFiles?.map((f) => f.id).filter((v): v is number => typeof v === "number") ?? [])
  );

  const [localImages, setLocalImages] = useState<File[]>([]);
  const [localDocs, setLocalDocs] = useState<File[]>([]);
  const [videoInput, setVideoInput] = useState("");

  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const titleLen = title.trim().length;
  const descLen = description.length;

  useEffect(() => {
    if (!item) return;
    setTitle(item.title ?? "");
    setDescription(item.description ?? "");
    setContent(item.content ?? "");
    setVideos(item.videos ?? []);
    setFileIds(
      item.fileIds ??
      (existingFiles?.map((f) => f.id).filter((v): v is number => typeof v === "number") ?? [])
    );
    setLocalImages([]);
    setLocalDocs([]);
  }, [item, existingFiles]);

  const { images: existingImagesAll, documents: existingDocsAll } = useMemo(
    () => splitFiles(existingFiles || []),
    [existingFiles]
  );

  const linkedIdSet = useMemo(() => new Set<number>(fileIds), [fileIds]);

  const existingImages = useMemo(
    () => existingImagesAll.filter((f) => !f.id || linkedIdSet.has(f.id)),
    [existingImagesAll, linkedIdSet]
  );
  const existingDocs = useMemo(
    () => existingDocsAll.filter((f) => !f.id || linkedIdSet.has(f.id)),
    [existingDocsAll, linkedIdSet]
  );

  const validate = (): boolean => {
    const next: { title?: string; content?: string } = {};
    if (!title.trim()) next.title = "Title is required";
    if (titleLen > MAX_TITLE) next.title = `Title cannot exceed ${MAX_TITLE} characters.`;
    setErrors(next);
    if (next.title && titleRef.current) titleRef.current.focus();
    else if (next.content && contentRef.current) contentRef.current.focus();
    return Object.keys(next).length === 0;
  };

  const addVideo = () => {
    const v = videoInput.trim();
    if (!v) return;
    if (!/^https?:\/\//i.test(v)) {
      alert("Please input a valid URL (must start with http/https).");
      return;
    }
    setVideos((prev) => [...prev, v]);
    setVideoInput("");
  };
  const removeVideo = (idx: number) => setVideos((prev) => prev.filter((_, i) => i !== idx));

  const removeFileId = (id?: number) => {
    if (typeof id !== "number") return;
    setFileIds((prev) => prev.filter((x) => x !== id));
  };

  const TARGET_IMAGE_BYTES = 700 * 1024; // 目标：单图 ≤ 700KB
  const MAX_INPUT_IMAGE_BYTES = 25 * 1024 * 1024; // 拦截极端大图
  const MAX_LONG_EDGE = 1920; // 最长边 1920px 足够用在“帖子详情”
  const MAX_DOC_MB = 40;
  const MAX_DOC_FILE_SIZE = MAX_DOC_MB * 1024 * 1024;
  const formatMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1) + " MB";


  const onPickImages: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const files = e.target.files;
    if (!files || !files.length) return;

    const picked = Array.from(files);

    // (1) 极端大图直接拒绝，避免内存/卡顿
    const tooHuge = picked.filter((f) => f.size > MAX_INPUT_IMAGE_BYTES);
    if (tooHuge.length) {
      alert(
        `These images are too large (>${formatMB(MAX_INPUT_IMAGE_BYTES)} each) and were skipped:\n` +
        tooHuge.map((f) => `• ${f.name} (${formatMB(f.size)})`).join("\n")
      );
    }
    const candidates = picked.filter((f) => f.size <= MAX_INPUT_IMAGE_BYTES);

    // (2) 顺序压缩（避免并发占内存）
    const processed: File[] = [];
    for (const f of candidates) {
      try {
        // 动图 GIF 直接原样；其他类型统一压缩到目标体积/尺寸
        const out = await compressImageFile(f, {
          targetBytes: TARGET_IMAGE_BYTES,
          maxLongEdge: MAX_LONG_EDGE,
          // 可选：强制 webp 输出（已在函数里兜底）
          mime: "image/webp",
        });
        processed.push(out);
      } catch (err) {
        console.error("Compress failed:", err);
        // 压缩失败就用原图，但最好提示
        processed.push(f);
      }
    }

    // (3) 去重（按 name+size 简单去重）
    const existing = new Map(localImages.map((f) => [`${f.name}-${f.size}`, true]));
    const deduped = processed.filter((f) => !existing.has(`${f.name}-${f.size}`));
    setLocalImages((prev) => [...prev, ...deduped]);

    e.currentTarget.value = "";
  };


  const onPickDocs: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = e.target.files;
    if (!files || !files.length) return;

    const picked = Array.from(files);
    const tooBig = picked.filter((f) => f.size > MAX_DOC_FILE_SIZE);
    const ok = picked.filter((f) => f.size <= MAX_DOC_FILE_SIZE);

    if (tooBig.length) {
      alert(
        `These documents exceed ${MAX_DOC_MB}MB and were skipped:\n` +
        tooBig.map((f) => `• ${f.name} (${formatMB(f.size)})`).join("\n")
      );
    }

    const existing = new Map(localDocs.map((f) => [`${f.name}-${f.size}`, true]));
    const deduped = ok.filter((f) => !existing.has(`${f.name}-${f.size}`));
    setLocalDocs((prev) => [...prev, ...deduped]);
    e.currentTarget.value = "";
  };


  const removeLocalImage = (idx: number) => setLocalImages((prev) => prev.filter((_, i) => i !== idx));
  const removeLocalDoc = (idx: number) => setLocalDocs((prev) => prev.filter((_, i) => i !== idx));

  // ------------------------------
  // 变化检测：serialize + 初始快照
  // ------------------------------
  const projectFiles = (files: File[]) => files.map((f) => `${f.name}::${f.size}::${f.lastModified}`).sort();

  const serializeState = () =>
    JSON.stringify({
      title: title.trim(),
      description: description.replace(/\s+$/, ""),
      content, // ← content
      videos: [...videos].map((v) => v.trim()).sort(),
      fileIds: [...fileIds].sort((a, b) => a - b),
      localImages: projectFiles(localImages),
      localDocs: projectFiles(localDocs),
    });

  const initialStateRef = useRef<string>("");
  useEffect(() => {
    initialStateRef.current = serializeState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, existingFiles]);

  const hasChanges = useMemo(() => {
    try {
      return serializeState() !== initialStateRef.current;
    } catch {
      return true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, content, videos, fileIds, localImages, localDocs]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!hasChanges) return;
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  const getConfirmPosition = () => {
    const el = anchorEl ?? closeButtonRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      return { top: rect.bottom + 8, right: Math.max(8, window.innerWidth - rect.right) };
    }
    return { top: 16, right: 16 };
  };

  const handleCloseClick = () => {
    if (hasChanges) {
      setAnchorEl(closeButtonRef.current);
      setPlacement("below");
      setIsConfirmOpen(true);
    } else {
      onClose();
    }
  };

  const handleCancelClick = () => {
    if (hasChanges) {
      setAnchorEl(cancelButtonRef.current);
      setPlacement("above");
      setIsConfirmOpen(true);
    } else {
      onClose();
    }
  };

  const confirmSaveAndClose = async () => {
    if (!validate()) return;
    const cleaned: FormModel = {
      title: title.trim(),
      description: description.replace(/\s+$/, ""),
      content,  // ← content
      videos,
      fileIds,
      localFiles: [...localImages, ...localDocs],
    };
    await onSave(cleaned);
    initialStateRef.current = serializeState();
    setIsConfirmOpen(false);
    onClose();
  };

  const confirmCloseWithoutSaving = () => {
    setIsConfirmOpen(false);
    onClose();
  };


  const handleSave = async () => {
    if (!validate()) return;

    // 兜底再压（可选）
    const processedImages: File[] = [];
    for (const f of localImages) {
      processedImages.push(
        await compressImageFile(f, { targetBytes: TARGET_IMAGE_BYTES, maxLongEdge: MAX_LONG_EDGE })
      );
    }

    const cleaned: FormModel = {
      title: title.trim(),
      description: description.replace(/\s+$/, ""),
      content,
      videos,
      fileIds,
      localFiles: [...processedImages, ...localDocs], // 用压后的
    };

    await onSave(cleaned);
    initialStateRef.current = serializeState();
  };

  return (
    <div className="fixed inset-0 z-30 bg-gray bg-opacity-50 flex items-center justify-center">
      {/* 点击遮罩也触发关闭确认 */}
      <div className="absolute inset-0" onClick={handleCloseClick} aria-hidden />
      <div
        className="bg-white w-[95vw] md:max-w-3xl rounded-md shadow-lg relative
             flex flex-col max-h-[min(90vh,800px)]"   // 关键：限制整体高度
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-4 md:px-6 pt-4 pb-2 mb-4 border-b border-border/70 sticky top-0 bg-white z-10">

          <button
            onClick={handleCloseClick}
            ref={closeButtonRef}
            className="absolute right-4 top-4 text-dark-gray hover:text-dark-green"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          <h2 className="text-xl font-medium text-center">
            {isNew ? "Create Post" : "Edit Post"}
            <div className="mt-1 h-0.5 w-12 bg-green mx-auto rounded" />
          </h2>
        </header>
        <section className="px-4 md:px-6 py-4 overflow-y-auto flex-1">
          {/* ===== 标题 ===== */}
          <label htmlFor="post-title" className="block text-sm font-medium mb-1 text-gray-900">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="post-title"
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full p-2 mb-1 border rounded-sm ${errors.title ? "border-red-500" : "border-border"}`}
            placeholder="Enter a short, descriptive title"
            maxLength={MAX_TITLE + 100}
          />
          <div className={`text-xs mb-2 ${titleLen > MAX_TITLE ? "text-red-600" : "text-dark-gray"}`}>
            {titleLen}/{MAX_TITLE}
            {titleLen > MAX_TITLE ? " — over limit" : ""}
          </div>
          {errors.title && <p className="text-red-600 text-sm mb-3">{errors.title}</p>}

          {/* ===== 正文（纯文本，保留换行） ===== */}
          <label htmlFor="post-content" className="block text-gray-900 text-sm font-medium mb-1">
            Content
          </label>
          <textarea
            id="post-content"
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`w-full p-2 mb-1 border text-gray-600 rounded-sm ${errors.content ? "border-red-500" : "border-border"}`}
            rows={10}
            placeholder="Write your content here. Line breaks will be preserved."
          />
          {errors.content && <p className="text-red-600 text-sm mb-3">{errors.content}</p>}

          {/* ===== 视频 URL ===== */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1 text-gray-900">Video URLs</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={videoInput}
                onChange={(e) => setVideoInput(e.target.value)}
                className="flex-1 p-2 border rounded-sm border-border"
                placeholder="https://youtube.com/watch?v=..."
              />
              <Button variant="primary" size="sm" onClick={addVideo} disabled={!videoInput.trim()}>
                <PlusIcon className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {videos.length > 0 && (
              <ul className="mt-2 space-y-1">
                {videos.map((v, i) => (
                  <li
                    key={`${v}-${i}`}
                    className="text-sm flex items-center justify-between bg-gray-50 border border-border rounded px-2 py-1"
                  >
                    <span className="truncate mr-2">{v}</span>
                    <button className="text-red-600 hover:underline text-xs" onClick={() => removeVideo(i)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border border-border p-2 mt-2">
            {/* ===== 已有图片（编辑态） ===== */}
            {existingImages.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-1 text-gray-900">Existing Images</div>
                <ul className="mt-2 grid grid-cols-4 md:grid-cols-8 gap-2">
                  {existingImages.map((f) => (
                    <li key={`${f.id}-${f.url}`} className="border border-border rounded p-1">
                      <img
                        src={f.url}
                        alt={f.filename}
                        className="w-full object-cover rounded mb-2 aspect-square"
                      />
                      <div className="text-[10px] truncate">{f.filename}</div>
                      {typeof f.file_size === "number" && (
                        <div className="text-[11px] text-dark-gray">{(f.file_size / 1024 / 1024).toFixed(2)} MB</div>
                      )}
                      {f.id != null && (
                        <button
                          className="mt-1 p-1 text-red-600 hover:bg-red-50 rounded text-xs"
                          onClick={() => removeFileId(f.id)}
                          title="Unlink this image from the post"
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ===== 新增上传：图片 ===== */}
            <div className="mt-6">
              <label className="block text-sm font-medium mb-1 text-gray-900">Add Images</label>
              <input
                type="file"
                multiple
                accept={IMAGE_ACCEPT}
                onChange={onPickImages}
                className="block w-full text-sm text-dark-gray file:mr-3 file:py-2 file:px-3 file:rounded-sm file:border-0 file:text-sm file:font-medium file:bg-gray-100 hover:file:bg-gray-200"
              />


              {localImages.length > 0 && (
                <ul className="mt-2 grid grid-cols-4 md:grid-cols-8 gap-2">
                  {localImages.map((f, i) => (
                    <li key={`${f.name}-${f.size}-${i}`} className="border border-border rounded p-1">
                      <img
                        src={URL.createObjectURL(f)}
                        alt={f.name}
                        className="w-full object-cover rounded mb-2 aspect-square"
                      />
                      <div className="text-xs truncate">{f.name}</div>
                      <div className="text-[11px] text-dark-gray">{(f.size / 1024 / 1024).toFixed(2)} MB</div>
                      <button
                        className="mt-1 p-1 text-red-600 hover:bg-red-50 rounded text-xs"
                        onClick={() => removeLocalImage(i)}
                        title="Remove file"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="border border-border p-2 mt-2">
            {/* ===== 已有文档（编辑态） ===== */}
            {existingDocs.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-gray-900">
                  <div className="text-sm font-medium mb-1">Existing Documents</div>
                </div>
                <ul className="mt-2 divide-y divide-gray-200 border border-border rounded">
                  {existingDocs.map((f) => (
                    <li key={`${f.id}-${f.url}`} className="flex items-center justify-between px-2 py-1 text-sm">
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate hover:underline"
                        title={f.filename}
                      >
                        {f.filename}
                      </a>
                      <div className="flex items-center gap-2">
                        {typeof f.file_size === "number" && (
                          <span className="text-xs text-dark-gray">{(f.file_size / 1024 / 1024).toFixed(2)} MB</span>
                        )}
                        {f.id != null && (
                          <button
                            className="p-1 text-red-600 hover:bg-red-50 rounded text-xs"
                            onClick={() => removeFileId(f.id)}
                            title="Unlink this document from the post"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ===== 新增上传：文档 ===== */}
            <div className="mt-6">
              <label className="block text-sm font-medium mb-1 text-gray-900">Add Documents</label>
              <input
                type="file"
                multiple
                accept={DOC_ACCEPT}
                onChange={onPickDocs}
                className="block w-full text-sm text-dark-gray file:mr-3 file:py-2 file:px-3 file:rounded-sm file:border-0 file:text-sm file:font-medium file:bg-gray-100 hover:file:bg-gray-200"
              />
              <p id="doc-size-hint" className="mt-1 text-xs text-dark-gray">
                * Each file ≤ {MAX_DOC_MB} MB.
              </p>
              {localDocs.length > 0 && (
                <ul className="mt-2 divide-y divide-gray-200 border border-border rounded">
                  {localDocs.map((f, i) => (
                    <li key={`${f.name}-${f.size}-${i}`} className="flex items-center justify-between px-2 py-1 text-sm">
                      <div className="min-w-0">
                        <div className="truncate">{f.name}</div>
                        <div className="text-xs text-dark-gray">{(f.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                      <button
                        className="p-1 text-red-600 hover:bg-red-50 rounded text-xs"
                        onClick={() => removeLocalDoc(i)}
                        title="Remove file"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* ===== Actions ===== */}
        <footer className="flex justify-end gap-5 px-4 md:px-6 py-3 border-t border-border/70 sticky bottom-0 bg-white z-10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancelClick}
            ref={cancelButtonRef}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving
              ? (uploadingPercent > 0 ? `Uploading… ${uploadingPercent}%` : "Saving…")
              : (isNew ? "Create" : "Save")}
          </Button>
        </footer>
      </div>

      {/* 确认弹窗 */}
      <SaveConfirmModal
        onConfirm={confirmSaveAndClose}
        onCancel={confirmCloseWithoutSaving}
        onOutsideClick={() => setIsConfirmOpen(false)}
        isOpen={isConfirmOpen}
        anchorEl={anchorEl}
        placement={placement}
        align="end"
        offset={8}
      />
    </div>
  );
}
