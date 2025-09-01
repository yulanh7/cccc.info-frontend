// components/posts/PostModal.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { XMarkIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import type { CreatePostFormModel, UiFile } from "@/app/types/post";
import { splitFiles } from "@/app/types/post";

/** 允许的扩展名（仅用于前端选择器提示；真正校验以后端为准） */
const IMAGE_ACCEPT = ".png,.jpg,.jpeg,.gif,.bmp,.webp";
const DOC_ACCEPT = ".doc,.docx,.pdf";

/* ========== Props ========== */
type PostModalProps = {
  item?: Partial<CreatePostFormModel>;
  isNew: boolean;
  onSave: (form: CreatePostFormModel & { localFiles?: File[] }) => void | Promise<void>;
  onClose: () => void;
  saving?: boolean;
  /** 编辑态：已有文件列表（来自帖子详情） */
  existingFiles?: UiFile[];
};

/* ========== 限制 ========== */
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
  // —— 初始表单
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [contentText, setContentText] = useState(item?.contentText ?? "");
  const [videos, setVideos] = useState<string[]>(item?.videos ?? []);
  // fileIds 默认来自 item；若未传且有 existingFiles，则用其 id 初始化
  const [fileIds, setFileIds] = useState<number[]>(
    item?.fileIds ??
    (existingFiles?.map((f) => f.id).filter((v): v is number => typeof v === "number") ?? [])
  );

  // —— 本地新选文件：分为图片 & 文档
  const [localImages, setLocalImages] = useState<File[]>([]);
  const [localDocs, setLocalDocs] = useState<File[]>([]);

  // —— 临时输入的视频 URL
  const [videoInput, setVideoInput] = useState("");

  // —— 简易校验错误
  const [errors, setErrors] = useState<{ title?: string; contentText?: string }>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // —— 统计
  const titleLen = title.trim().length;
  const descLen = description.length;

  // —— 父层变更时（再次打开 modal）同步
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

  /* ========== 分类：已有文件（编辑态） ========== */
  const { images: existingImagesAll, documents: existingDocsAll } = useMemo(
    () => splitFiles(existingFiles || []),
    [existingFiles]
  );

  // 基于 fileIds 过滤出“仍然关联”的已有文件；移除时只改 fileIds，从而让 UI 立即消失
  const linkedIdSet = useMemo(() => new Set<number>(fileIds), [fileIds]);
  const existingImages = useMemo(
    () => existingImagesAll.filter((f) => !f.id || linkedIdSet.has(f.id)),
    [existingImagesAll, linkedIdSet]
  );
  const existingDocs = useMemo(
    () => existingDocsAll.filter((f) => !f.id || linkedIdSet.has(f.id)),
    [existingDocsAll, linkedIdSet]
  );

  /* ========== 校验 ========== */
  const validate = (): boolean => {
    const next: { title?: string; contentText?: string } = {};
    if (!title.trim()) next.title = "Title is required";
    if (titleLen > MAX_TITLE) next.title = `Title cannot exceed ${MAX_TITLE} characters.`;
    // 如果正文必填，解开下面一行
    // if (!contentText.trim()) next.contentText = "Content is required";

    setErrors(next);

    if (next.title && titleRef.current) titleRef.current.focus();
    else if (next.contentText && contentRef.current) contentRef.current.focus();

    return Object.keys(next).length === 0;
  };

  /* ========== 处理视频 ========== */
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

  /* ========== 处理已有文件（仅移除关联） ========== */
  const removeFileId = (id?: number) => {
    if (typeof id !== "number") return;
    setFileIds((prev) => prev.filter((x) => x !== id));
  };

  /* ========== 本地上传：图片 ========== */
  const onPickImages: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const picked = Array.from(files);
    const existing = new Map(localImages.map((f) => [`${f.name}-${f.size}`, true]));
    const deduped = picked.filter((f) => !existing.has(`${f.name}-${f.size}`));
    setLocalImages((prev) => [...prev, ...deduped]);
    e.currentTarget.value = "";
  };
  const removeLocalImage = (idx: number) =>
    setLocalImages((prev) => prev.filter((_, i) => i !== idx));

  /* ========== 本地上传：文档 ========== */
  const onPickDocs: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const picked = Array.from(files);
    const existing = new Map(localDocs.map((f) => [`${f.name}-${f.size}`, true]));
    const deduped = picked.filter((f) => !existing.has(`${f.name}-${f.size}`));
    setLocalDocs((prev) => [...prev, ...deduped]);
    e.currentTarget.value = "";
  };
  const removeLocalDoc = (idx: number) => setLocalDocs((prev) => prev.filter((_, i) => i !== idx));

  /* ========== 提交 ========== */
  const handleSave = () => {
    if (!validate()) return;
    const cleaned: CreatePostFormModel & { localFiles?: File[] } = {
      title: title.trim(),
      description: description.replace(/\s+$/, ""),
      contentText, // 纯文本，后端保存换行
      videos,
      fileIds,
      localFiles: [...localImages, ...localDocs],
    };
    onSave(cleaned);
  };

  const hasAny =
    !!title ||
    !!description ||
    !!contentText ||
    videos.length > 0 ||
    fileIds.length > 0 ||
    localImages.length > 0 ||
    localDocs.length > 0;

  return (
    <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center">
      <div className="bg-white max-h-[90vh] w-full md:max-w-3xl overflow-y-auto rounded-md shadow-lg p-4 md:p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-dark-gray hover:text-dark-green"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-xl font-medium mb-4">{isNew ? "Create Post" : "Edit Post"}</h2>

        {/* ===== 标题 ===== */}
        <label htmlFor="post-title" className="block text-sm font-medium mb-1">
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

        {/* ===== 描述 ===== */}
        <label htmlFor="post-desc" className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          id="post-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 mb-1 border rounded-sm border-border"
          rows={3}
          placeholder="Optional summary shown in lists or previews"
        />
        <div className={`text-xs mb-2 ${descLen > MAX_DESC ? "text-red-600" : "text-dark-gray"}`}>
          {descLen}/{MAX_DESC}
          {descLen > MAX_DESC ? " — over limit" : ""}
        </div>

        {/* ===== 正文（纯文本，保留换行） ===== */}
        <label htmlFor="post-content" className="block text-sm font-medium mb-1">
          Content
        </label>
        <textarea
          id="post-content"
          ref={contentRef}
          value={contentText}
          onChange={(e) => setContentText(e.target.value)}
          className={`w-full p-2 mb-1 border rounded-sm ${errors.contentText ? "border-red-500" : "border-border"}`}
          rows={8}
          placeholder="Write your content here. Line breaks will be preserved."
        />
        {errors.contentText && <p className="text-red-600 text-sm mb-3">{errors.contentText}</p>}

        {/* ===== 视频 URL ===== */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Video URLs</label>
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

        {/* ===== 已有图片（编辑态） ===== */}
        {existingImages.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium mb-1">Existing Images</div>
              <div className="text-xs text-dark-gray">Shown at the top of post detail</div>
            </div>
            <ul className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
              {existingImages.map((f) => (
                <li key={`${f.id}-${f.url}`} className="border border-border rounded p-2">
                  <img src={f.url} alt={f.name} className="w-full h-28 object-cover rounded mb-2" />
                  <div className="text-xs truncate">{f.name}</div>
                  {typeof f.size === "number" && (
                    <div className="text-[11px] text-dark-gray">{(f.size / 1024 / 1024).toFixed(2)} MB</div>
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

        {/* ===== 已有文档（编辑态） ===== */}
        {existingDocs.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium mb-1">Existing Documents</div>
              <div className="text-xs text-dark-gray">Will be listed at the bottom of post detail</div>
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

        {/* ===== 新增上传：图片 ===== */}
        <div className="mt-6">
          <label className="block text-sm font-medium mb-1">Add Images</label>
          <input
            type="file"
            multiple
            accept={IMAGE_ACCEPT}
            onChange={onPickImages}
            className="block w-full text-sm text-dark-gray file:mr-3 file:py-2 file:px-3 file:rounded-sm file:border-0 file:text-sm file:font-medium file:bg-gray-100 hover:file:bg-gray-200"
          />
          {localImages.length > 0 && (
            <ul className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
              {localImages.map((f, i) => (
                <li key={`${f.name}-${f.size}-${i}`} className="border border-border rounded p-2">
                  <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-28 object-cover rounded mb-2" />
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

        {/* ===== 新增上传：文档 ===== */}
        <div className="mt-6">
          <label className="block text-sm font-medium mb-1">Add Documents</label>
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

        {/* ===== Actions ===== */}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : isNew ? "Create" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
