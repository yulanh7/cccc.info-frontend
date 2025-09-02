"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { XMarkIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import type { CreatePostFormModel, UiFile } from "@/app/types/post";
import { splitFiles } from "@/app/types/post";
import SaveConfirmModal from "../SaveConfirmModal";

const IMAGE_ACCEPT = ".png,.jpg,.jpeg,.gif,.bmp,.webp";
const DOC_ACCEPT = ".doc,.docx,.pdf";

type PostModalProps = {
  item?: Partial<CreatePostFormModel>;
  isNew: boolean;
  onSave: (form: CreatePostFormModel & { localFiles?: File[] }) => void | Promise<void>;
  onClose: () => void;
  saving?: boolean;
  existingFiles?: UiFile[];
};

const MAX_TITLE = 70;
const MAX_DESC = 300;

export default function PostModal({
  item,
  isNew,
  onSave,
  onClose,
  saving = false,
  existingFiles = [],
}: PostModalProps) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [contentText, setContentText] = useState(item?.contentText ?? "");
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

  const [errors, setErrors] = useState<{ title?: string; contentText?: string }>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const titleLen = title.trim().length;
  const descLen = description.length;

  useEffect(() => {
    if (!item) return;
    setTitle(item.title ?? "");
    setDescription(item.description ?? "");
    setContentText(item.contentText ?? "");
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
    const next: { title?: string; contentText?: string } = {};
    if (!title.trim()) next.title = "Title is required";
    if (titleLen > MAX_TITLE) next.title = `Title cannot exceed ${MAX_TITLE} characters.`;
    setErrors(next);
    if (next.title && titleRef.current) titleRef.current.focus();
    else if (next.contentText && contentRef.current) contentRef.current.focus();
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

  const MAX_FILE_SIZE = 40 * 1024 * 1024;

  const formatMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1) + " MB";


  const onPickImages: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = e.target.files;
    if (!files || !files.length) return;

    const picked = Array.from(files);
    const tooBig = picked.filter(f => f.size > MAX_FILE_SIZE);
    const ok = picked.filter(f => f.size <= MAX_FILE_SIZE);

    if (tooBig.length) {
      alert(`These images exceed 40MB and were skipped:\n` +
        tooBig.map(f => `• ${f.name} (${formatMB(f.size)})`).join("\n"));
    }

    const existing = new Map(localImages.map((f) => [`${f.name}-${f.size}`, true]));
    const deduped = ok.filter((f) => !existing.has(`${f.name}-${f.size}`));
    setLocalImages((prev) => [...prev, ...deduped]);
    e.currentTarget.value = "";
  };

  const onPickDocs: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = e.target.files;
    if (!files || !files.length) return;

    const picked = Array.from(files);
    const tooBig = picked.filter(f => f.size > MAX_FILE_SIZE);
    const ok = picked.filter(f => f.size <= MAX_FILE_SIZE);

    if (tooBig.length) {
      alert(`These documents exceed 40MB and were skipped:\n` +
        tooBig.map(f => `• ${f.name} (${formatMB(f.size)})`).join("\n"));
    }

    const existing = new Map(localDocs.map((f) => [`${f.name}-${f.size}`, true]));
    const deduped = ok.filter((f) => !existing.has(`${f.name}-${f.size}`));
    setLocalDocs((prev) => [...prev, ...deduped]);
    e.currentTarget.value = "";
  };

  const removeLocalImage = (idx: number) =>
    setLocalImages((prev) => prev.filter((_, i) => i !== idx));

  const removeLocalDoc = (idx: number) => setLocalDocs((prev) => prev.filter((_, i) => i !== idx));

  /* ------------------------------
   * 变化检测核心：serialize + 初始快照
   * ------------------------------ */

  // 把文件列表投影成稳定签名，避免引用变化
  const projectFiles = (files: File[]) =>
    files.map((f) => `${f.name}::${f.size}::${f.lastModified}`).sort();

  // 把表单状态稳定序列化
  const serializeState = () =>
    JSON.stringify({
      title: title.trim(),
      description: description.replace(/\s+$/, ""),
      contentText, // 保留换行即可
      videos: [...videos].map((v) => v.trim()).sort(),
      // 排序，避免顺序导致误报
      fileIds: [...fileIds].sort((a, b) => a - b),
      // 本地新文件：用签名比较
      localImages: projectFiles(localImages),
      localDocs: projectFiles(localDocs),
    });

  // 保存初始快照
  const initialStateRef = useRef<string>("");
  useEffect(() => {
    // 当 modal 打开/数据刷新时重置初始状态
    initialStateRef.current = serializeState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, existingFiles]);

  // 实时是否有变化
  const hasChanges = useMemo(() => {
    try {
      return serializeState() !== initialStateRef.current;
    } catch {
      return true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, contentText, videos, fileIds, localImages, localDocs]);

  // 离开页面提醒（可选）
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!hasChanges) return;
      e.preventDefault();
      e.returnValue = ""; // 某些浏览器需要
      return "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  // 修正确认弹窗的位置：靠近右上角关闭按钮
  const getConfirmPosition = () => {
    const el = anchorEl ?? closeButtonRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      return {
        top: rect.bottom + 8,
        right: Math.max(8, window.innerWidth - rect.right),
      };
    }
    // 兜底：居右上
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
    // 保存成功后，把当前状态设为“基线”，避免跳回又提示
    if (!validate()) return;
    const cleaned: CreatePostFormModel & { localFiles?: File[] } = {
      title: title.trim(),
      description: description.replace(/\s+$/, ""),
      contentText,
      videos,
      fileIds,
      localFiles: [...localImages, ...localDocs],
    };
    await onSave(cleaned);
    initialStateRef.current = serializeState(); // 更新基线
    setIsConfirmOpen(false);
    onClose();
  };

  const confirmCloseWithoutSaving = () => {
    setIsConfirmOpen(false);
    onClose();
  };

  const confirmCancel = () => setIsConfirmOpen(false);

  const handleSave = async () => {
    if (!validate()) return;
    const cleaned: CreatePostFormModel & { localFiles?: File[] } = {
      title: title.trim(),
      description: description.replace(/\s+$/, ""),
      contentText,
      videos,
      fileIds,
      localFiles: [...localImages, ...localDocs],
    };
    await onSave(cleaned);
    // 如果不关闭，也把当前状态设为基线，防止再次点 X 误报
    initialStateRef.current = serializeState();
  };



  return (
    <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center">
      {/* 点击遮罩也触发关闭确认 */}
      <div
        className="absolute inset-0"
        onClick={handleCloseClick}
        aria-hidden
      />
      <div
        className="bg-white max-h-[90vh] w-full md:max-w-3xl overflow-y-auto rounded-md shadow-lg p-4 md:p-6 relative"
        // 阻止内部点击冒泡到遮罩
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleCloseClick}
          ref={closeButtonRef}
          className="absolute right-4 top-4 text-dark-gray hover:text-dark-green"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-xl font-medium mb-4">{isNew ? "Create Post" : "Edit Post"}</h2>

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
          value={contentText}
          onChange={(e) => setContentText(e.target.value)}
          className={`w-full p-2 mb-1 border text-gray-600 rounded-sm ${errors.contentText ? "border-red-500" : "border-border"}`}
          rows={10}
          placeholder="Write your content here. Line breaks will be preserved."
        />
        {errors.contentText && <p className="text-red-600 text-sm mb-3">{errors.contentText}</p>}

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
                    <img src={f.url} alt={f.name} className="w-full object-cover rounded mb-2 aspect-square" />
                    <div className="text-[10px] truncate">{f.name}</div>
                    {/* {typeof f.size === "number" && (
                    <div className="text-[11px] text-dark-gray">{(f.size / 1024 / 1024).toFixed(2)} MB</div>
                  )} */}
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
                    <img src={URL.createObjectURL(f)} alt={f.name} className="w-full object-cover rounded mb-2 aspect-square" />
                    <div className="text-xs truncate">{f.name}</div>
                    <div className="text-[11px] text-dark-gray">{(f.size / 1024 / 1024).toFixed(2)} MB</div>
                    <button
                      className="mt-1 p-1 text-red-600 hover:bg-red-50 rounded text-xs"
                      onClick={() => removeLocalImage(i)}
                      title="Remove file"
                    >
                      <TrashIcon className="h-4 w-4" />
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
                    <a href={f.url} target="_blank" rel="noreferrer" className="truncate hover:underline" title={f.name}>
                      {f.name}
                    </a>
                    <div className="flex items-center gap-2">
                      {typeof f.size === "number" && (
                        <span className="text-xs text-dark-gray">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
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
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>


        {/* ===== Actions ===== */}
        <div className="mt-6 flex justify-end gap-3">
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
            {saving ? "Saving…" : isNew ? "Create" : "Save"}
          </Button>
        </div>
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
