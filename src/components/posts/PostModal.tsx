// components/posts/PostModal.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { XMarkIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import type { CreatePostFormModel } from "@/app/types/post";

type PostModalProps = {
  item?: Partial<CreatePostFormModel>;
  isNew: boolean;
  onSave: (form: CreatePostFormModel & { localFiles?: File[] }) => void | Promise<void>;
  onClose: () => void;
  saving?: boolean;
};

const MAX_TITLE = 70;
const MAX_DESC = 300;

// 允许的扩展名
const IMAGE_EXT = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"];
const DOC_EXT = [".doc", ".docx", ".pdf"];

// 小工具：判断扩展名是否在允许列表
const hasAllowedExt = (filename: string, allowlist: string[]) => {
  const lower = filename.toLowerCase();
  return allowlist.some((ext) => lower.endsWith(ext));
};

// 小工具：去重（按 name+size）
const dedupeByNameSize = (files: File[], existing: File[]) => {
  if (!files.length) return [];
  const existKey = new Set(existing.map((f) => `${f.name}-${f.size}`));
  return files.filter((f) => !existKey.has(`${f.name}-${f.size}`));
};

export default function PostModal({
  item,
  isNew,
  onSave,
  onClose,
  saving = false,
}: PostModalProps) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [contentText, setContentText] = useState(item?.contentText ?? "");
  const [videos, setVideos] = useState<string[]>(item?.videos ?? []);
  const [fileIds, setFileIds] = useState<number[]>(item?.fileIds ?? []);

  // 分开收集
  const [localImageFiles, setLocalImageFiles] = useState<File[]>([]);
  const [localDocFiles, setLocalDocFiles] = useState<File[]>([]);

  const [videoInput, setVideoInput] = useState("");
  const [errors, setErrors] = useState<{ title?: string; contentText?: string }>({});

  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const titleLen = title.trim().length;
  const descLen = description.length;

  // 父层变化时同步
  useEffect(() => {
    if (!item) return;
    setTitle(item.title ?? "");
    setDescription(item.description ?? "");
    setContentText(item.contentText ?? "");
    setVideos(item.videos ?? []);
    setFileIds(item.fileIds ?? []);
    setLocalImageFiles([]);
    setLocalDocFiles([]);
  }, [item]);

  const validate = (): boolean => {
    const next: { title?: string; contentText?: string } = {};
    if (!title.trim()) next.title = "Title is required";
    if (titleLen > MAX_TITLE) next.title = `Title cannot exceed ${MAX_TITLE} characters.`;
    // 如果正文必填，取消注释
    // if (!contentText.trim()) next.contentText = "Content is required";

    setErrors(next);
    if (next.title && titleRef.current) titleRef.current.focus();
    else if (next.contentText && contentRef.current) contentRef.current.focus();
    return Object.keys(next).length === 0;
  };

  // ========= 现有已关联文件（编辑态） =========
  const removeFileId = (id: number) => setFileIds((prev) => prev.filter((x) => x !== id));

  // ========= 图片上传 =========
  const onPickImages: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const filtered = files.filter((f) => {
      if (!hasAllowedExt(f.name, IMAGE_EXT)) {
        alert(`"${f.name}" is not a supported image type. Allowed: ${IMAGE_EXT.join(", ")}`);
        return false;
      }
      return true;
    });
    const deduped = dedupeByNameSize(filtered, localImageFiles);
    setLocalImageFiles((prev) => [...prev, ...deduped]);
    e.currentTarget.value = "";
  };
  const removeLocalImage = (idx: number) =>
    setLocalImageFiles((prev) => prev.filter((_, i) => i !== idx));

  // ========= 文档上传 =========
  const onPickDocs: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const filtered = files.filter((f) => {
      if (!hasAllowedExt(f.name, DOC_EXT)) {
        alert(`"${f.name}" is not a supported document type. Allowed: ${DOC_EXT.join(", ")}`);
        return false;
      }
      return true;
    });
    const deduped = dedupeByNameSize(filtered, localDocFiles);
    setLocalDocFiles((prev) => [...prev, ...deduped]);
    e.currentTarget.value = "";
  };
  const removeLocalDoc = (idx: number) =>
    setLocalDocFiles((prev) => prev.filter((_, i) => i !== idx));

  // ========= 视频 URL =========
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

  const handleSave = () => {
    if (!validate()) return;

    // 不改你的 CreatePostFormModel：在 onSave 时合并为 localFiles（保持兼容）
    const localFiles = [...localImageFiles, ...localDocFiles];

    const cleaned: CreatePostFormModel & { localFiles?: File[] } = {
      title: title.trim(),
      description: description.replace(/\s+$/, ""),
      contentText,
      videos,
      fileIds,
      ...(localFiles.length ? { localFiles } : {}),
    };

    onSave(cleaned);
  };

  const hasAny = useMemo(
    () =>
      title ||
      description ||
      contentText ||
      videos.length ||
      fileIds.length ||
      localImageFiles.length ||
      localDocFiles.length,
    [title, description, contentText, videos, fileIds, localImageFiles, localDocFiles]
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

        {/* Title */}
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
        <div className={`text-xs mb-2 ${titleLen > MAX_TITLE ? "text-red-600" : "text-dark-gray"}`}>
          {titleLen}/{MAX_TITLE}
          {titleLen > MAX_TITLE ? " — over limit" : ""}
        </div>
        {errors.title && <p className="text-red-600 text-sm mb-3">{errors.title}</p>}

        {/* Description */}
        {/* <label htmlFor="post-desc" className="block text-sm font-medium mb-1">
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
        </div> */}

        {/* Content（纯文本，保留换行） */}
        <label htmlFor="post-content" className="block text-sm font-medium mb-1">
          Content
        </label>
        <textarea
          id="post-content"
          ref={contentRef}
          value={contentText}
          onChange={(e) => setContentText(e.target.value)}
          className={`w-full p-2 mb-1 border rounded-sm ${errors.contentText ? "border-red-500" : "border-border"
            }`}
          rows={8}
          placeholder="Write your content here (plain text, newlines will be preserved)"
        />
        {errors.contentText && <p className="text-red-600 text-sm mb-3">{errors.contentText}</p>}

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

        {/* 已存在的附件（编辑态） */}
        {fileIds.length > 0 && (
          <div className="mt-5">
            <div className="text-sm font-medium mb-1">Existing Attachments</div>
            <div className="text-xs text-dark-gray mb-2">IDs below are already linked to this post</div>
            <ul className="space-y-1">
              {fileIds.map((id) => (
                <li
                  key={id}
                  className="text-sm flex items-center justify-between bg-gray-50 border border-border rounded px-2 py-1"
                >
                  <span>#{id}</span>
                  <button className="text-red-600 hover:underline text-xs" onClick={() => removeFileId(id)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 图片上传 */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium mb-1">Images</label>
            <span className="text-xs text-dark-gray">Allowed: {IMAGE_EXT.join(", ")}</span>
          </div>
          <input
            type="file"
            multiple
            onChange={onPickImages}
            className="block w-full text-sm text-dark-gray file:mr-3 file:py-2 file:px-3 file:rounded-sm file:border-0 file:text-sm file:font-medium file:bg-gray-100 hover:file:bg-gray-200"
            accept=".png,.jpg,.jpeg,.gif,.bmp,.webp,image/*"
          />

          {localImageFiles.length > 0 && (
            <ul className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
              {localImageFiles.map((f, i) => (
                <li key={`${f.name}-${f.size}-${i}`} className="border border-border rounded p-2">
                  {/* 简易预览（可选） */}
                  {f.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(f)}
                      alt={f.name}
                      className="w-full h-28 object-cover rounded mb-2"
                    />
                  ) : null}
                  <div className="text-xs truncate">{f.name}</div>
                  <div className="text-[11px] text-dark-gray">
                    {(f.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <button
                    className="mt-1 p-1 text-red-600 hover:bg-red-50 rounded text-xs"
                    onClick={() => removeLocalImage(i)}
                    aria-label="Remove image"
                    title="Remove image"
                  >
                    <TrashIcon className="h-4 w-4 inline" /> Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 文档上传 */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium mb-1">Documents</label>
            <span className="text-xs text-dark-gray">Allowed: {DOC_EXT.join(", ")}</span>
          </div>
          <input
            type="file"
            multiple
            onChange={onPickDocs}
            className="block w-full text-sm text-dark-gray file:mr-3 file:py-2 file:px-3 file:rounded-sm file:border-0 file:text-sm file:font-medium file:bg-gray-100 hover:file:bg-gray-200"
            accept=".doc,.docx,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />

          {localDocFiles.length > 0 && (
            <ul className="mt-2 divide-y divide-gray-200 border border-border rounded">
              {localDocFiles.map((f, i) => (
                <li key={`${f.name}-${f.size}-${i}`} className="flex items-center justify-between px-2 py-1 text-sm">
                  <div className="min-w-0">
                    <div className="truncate">{f.name}</div>
                    <div className="text-xs text-dark-gray">
                      {(f.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <button
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    onClick={() => removeLocalDoc(i)}
                    aria-label="Remove doc"
                    title="Remove doc"
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
      </div>
    </div>
  );
}
