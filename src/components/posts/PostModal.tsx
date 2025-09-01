// components/posts/PostModal.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { XMarkIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import type { CreatePostFormModel } from "@/app/types/post";



type PostModalProps = {
  item?: Partial<CreatePostFormModel>;
  isNew: boolean;
  onSave: (form: CreatePostFormModel) => void | Promise<void>; // ✅ 允许 Promise
  onClose: () => void;
  saving?: boolean;
};

// —— 文本长度限制（可按需调整）
const MAX_TITLE = 70;
const MAX_DESC = 300;

export default function PostModal({
  item,
  isNew,
  onSave,
  onClose,
  saving = false,
}: PostModalProps) {
  // —— 初始表单
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [contentText, setContentHtml] = useState(item?.contentText ?? "");
  const [videos, setVideos] = useState<string[]>(item?.videos ?? []);
  const [fileIds, setFileIds] = useState<number[]>(item?.fileIds ?? []);
  const [localFiles, setLocalFiles] = useState<File[]>([]);

  // —— 临时输入的视频 URL
  const [videoInput, setVideoInput] = useState("");

  // —— 简易校验错误
  const [errors, setErrors] = useState<{ title?: string; contentText?: string }>(
    {}
  );

  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // —— 统计
  const titleLen = title.trim().length;
  const descLen = description.length;

  // —— 补：从父层变更（如再次打开编辑）
  useEffect(() => {
    if (!item) return;
    setTitle(item.title ?? "");
    setDescription(item.description ?? "");
    setContentHtml(item.contentText ?? "");
    setVideos(item.videos ?? []);
    setFileIds(item.fileIds ?? []);
    setLocalFiles([]); // 每次打开弹窗都清空本地新选文件
  }, [item]);

  const validate = (): boolean => {
    const next: { title?: string; contentText?: string } = {};
    if (!title.trim()) next.title = "Title is required";
    if (titleLen > MAX_TITLE) next.title = `Title cannot exceed ${MAX_TITLE} characters.`;

    // 如果你要求正文必填，打开下面一行
    // if (!contentText.trim()) next.contentText = "Content is required";

    setErrors(next);

    if (next.title && titleRef.current) titleRef.current.focus();
    else if (next.contentText && contentRef.current) contentRef.current.focus();

    return Object.keys(next).length === 0;
  };

  const handlePickFiles: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = e.target.files;
    if (!files || !files.length) return;

    const picked = Array.from(files);
    const existing = new Map(localFiles.map((f) => [`${f.name}-${f.size}`, true]));
    const deduped = picked.filter((f) => !existing.has(`${f.name}-${f.size}`));

    setLocalFiles((prev) => [...prev, ...deduped]);

    e.currentTarget.value = "";
  };

  const removeLocalFile = (index: number) => {
    setLocalFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeFileId = (id: number) => {
    setFileIds((prev) => prev.filter((x) => x !== id));
  };

  const addVideo = () => {
    const v = videoInput.trim();
    if (!v) return;
    // 简单校验：以 http(s) 开头
    if (!/^https?:\/\//i.test(v)) {
      alert("Please input a valid URL (must start with http/https).");
      return;
    }
    setVideos((prev) => [...prev, v]);
    setVideoInput("");
  };

  const removeVideo = (idx: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!validate()) return;
    const cleaned: CreatePostFormModel = {
      title: title.trim(),
      description: description.replace(/\s+$/, ""),
      contentText,
      videos,
      fileIds,
      localFiles
    };
    onSave(cleaned);
  };

  const hasAny = useMemo(
    () => title || description || contentText || videos.length || fileIds.length || localFiles.length,
    [title, description, contentText, videos, fileIds, localFiles]
  );

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

        <h2 className="text-xl font-medium mb-4">
          {isNew ? "Create Post" : "Edit Post"}
        </h2>

        <label htmlFor="post-title" className="block text-sm font-medium mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="post-title"
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`w-full p-2 mb-1 border rounded-sm ${errors.title ? "border-red-500" : "border-border"
            }`}
          placeholder="Enter a short, descriptive title"
          maxLength={MAX_TITLE + 100}
        />
        <div
          className={`text-xs mb-2 ${titleLen > MAX_TITLE ? "text-red-600" : "text-dark-gray"
            }`}
        >
          {titleLen}/{MAX_TITLE}
          {titleLen > MAX_TITLE ? " — over limit" : ""}
        </div>
        {errors.title && (
          <p className="text-red-600 text-sm mb-3">{errors.title}</p>
        )}

        <label
          htmlFor="post-desc"
          className="block text-sm font-medium mb-1"
        >
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
        <div
          className={`text-xs mb-2 ${descLen > MAX_DESC ? "text-red-600" : "text-dark-gray"
            }`}
        >
          {descLen}/{MAX_DESC}
          {descLen > MAX_DESC ? " — over limit" : ""}
        </div>

        {/* Content (HTML) */}
        <label
          htmlFor="post-content"
          className="block text-sm font-medium mb-1"
        >
          Content (HTML)
        </label>
        <textarea
          id="post-content"
          ref={contentRef}
          value={contentText}
          onChange={(e) => setContentHtml(e.target.value)}
          className={`w-full p-2 mb-1 border rounded-sm ${errors.contentText ? "border-red-500" : "border-border"
            }`}
          rows={8}
          placeholder='<p>Support HTML here, e.g. <strong>bold</strong> text.</p>'
        />
        {errors.contentText && (
          <p className="text-red-600 text-sm mb-3">{errors.contentText}</p>
        )}

        {/* Video URLs */}
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
            <Button
              variant="primary"
              size="sm"
              onClick={addVideo}
              disabled={!videoInput.trim()}
            >
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
                  <button
                    className="text-red-600 hover:underline text-xs"
                    onClick={() => removeVideo(i)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Files: existing fileIds + new localFiles */}
        <div className="mt-5">
          <label className="block text-sm font-medium mb-1">Attachments</label>

          {/* 已存在的附件（编辑态） */}
          {fileIds.length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-dark-gray mb-1">Existing files (IDs):</div>
              <ul className="space-y-1">
                {fileIds.map((id) => (
                  <li
                    key={id}
                    className="text-sm flex items-center justify-between bg-gray-50 border border-border rounded px-2 py-1"
                  >
                    <span>#{id}</span>
                    <button
                      className="text-red-600 hover:underline text-xs"
                      onClick={() => removeFileId(id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="file"
              multiple
              onChange={handlePickFiles}
              className="block w-full text-sm text-dark-gray file:mr-3 file:py-2 file:px-3 file:rounded-sm file:border-0 file:text-sm file:font-medium file:bg-gray-100 hover:file:bg-gray-200"
              accept=".doc,.docx,.pdf,.png,.jpg,.jpeg,.gif,.bmp,.webp"
            />
          </div>

          {localFiles.length > 0 && (
            <ul className="mt-2 divide-y divide-gray-200 border border-border rounded">
              {localFiles.map((f, i) => (
                <li key={`${f.name}-${f.size}-${i}`} className="flex items-center justify-between px-2 py-1 text-sm">
                  <div className="min-w-0">
                    <div className="truncate">{f.name}</div>
                    <div className="text-xs text-dark-gray">
                      {(f.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <button
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    onClick={() => removeLocalFile(i)}
                    aria-label="Remove file"
                    title="Remove file"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : isNew ? "Create" : "Save"}
          </Button>
        </div>

        {/* 离开确认（可选）：如果你有通用 ConfirmModal，这里可以接入；当前简化由外层处理 */}
      </div>
    </div>
  );
}
