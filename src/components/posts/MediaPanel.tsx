"use client";

import React, { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import type { PostFileApi } from "@/app/types";
import { MAX_DOC_MB } from '@/app/constants'

const isImageMime = (mime?: string) => !!mime && /^image\//i.test(mime);
const isPdfOrDoc = (mime?: string) =>
  !!mime &&
  /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/i.test(
    mime
  );

type MediaPanelProps = {
  videos: string[];
  setVideos: (v: string[]) => void;

  localImages: File[];
  setLocalImages: (f: File[]) => void;

  localDocs: File[];
  setLocalDocs: (f: File[]) => void;

  fileIds: number[];
  setFileIds: (ids: number[]) => void;

  onPickImages: React.ChangeEventHandler<HTMLInputElement>;
  onPickDocs: React.ChangeEventHandler<HTMLInputElement>;
  removeLocalImage: (idx: number) => void;
  removeLocalDoc: (idx: number) => void;
  removeFileId: (id?: number) => void;

  existingImages: PostFileApi[];
  existingDocs: PostFileApi[];

  isCompressing: boolean;
  compressDone: number;
  compressTotal: number;

  formatMB: (bytes: number) => string;
  IMAGE_ACCEPT: string;
  DOC_ACCEPT: string;

  saving: boolean;
  uploadingPercent: number;
};

export default function MediaPanel({
  videos,
  setVideos,
  localImages,
  setLocalImages,
  localDocs,
  setLocalDocs,
  fileIds,
  setFileIds,
  onPickImages,
  onPickDocs,
  removeLocalImage,
  removeLocalDoc,
  removeFileId,
  existingImages,
  existingDocs,
  isCompressing,
  compressDone,
  compressTotal,
  formatMB,
  IMAGE_ACCEPT,
  DOC_ACCEPT,
  saving,
  uploadingPercent,
}: MediaPanelProps) {
  const [videoInput, setVideoInput] = useState("");

  const addVideo = () => {
    const v = videoInput.trim();
    if (!v) return;
    if (!/^https?:\/\//i.test(v)) {
      alert("Please input a valid URL (must start with http/https).");
      return;
    }
    setVideos([...videos, v]);
    setVideoInput("");
  };

  return (
    <>
      {/* 视频 URL */}
      <div className="mt-1">
        <label className="block text-sm font-medium mb-1 text-gray-900">
          Video URLs <span className="ml-1 text-xs text-gray-500">(Optional)</span>
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={videoInput}
            onChange={(e) => setVideoInput(e.target.value)}
            className="flex-1 p-2 border rounded-sm border-border"
            placeholder="https://youtube.com/watch?v=..."
            disabled={saving || isCompressing}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={addVideo}
            disabled={!videoInput.trim() || saving || isCompressing}
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
                  className="text-red-600 hover:underline text-xs disabled:opacity-50"
                  onClick={() => setVideos(videos.filter((_, idx) => idx !== i))}
                  disabled={saving || isCompressing}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 已有图片（编辑态） */}
      <div className="border border-border p-2 mt-4">
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
                    <div className="text-[11px] text-dark-gray">
                      {(f.file_size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  )}
                  {f.id != null && (
                    <button
                      className="mt-1 p-1 text-red-600 hover:bg-red-50 rounded text-xs disabled:opacity-50"
                      onClick={() => removeFileId(f.id)}
                      title="Unlink this image from the post"
                      disabled={saving || isCompressing}
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 新增上传：图片 */}
        <div className="mt-6">
          <label className="block text-sm font-medium mb-1 text-gray-900">
            Add Images <span className="ml-1 text-xs text-gray-500">(Optional)</span>
          </label>
          <input
            type="file"
            multiple
            accept={IMAGE_ACCEPT}
            onChange={onPickImages}
            className="block w-full text-sm text-dark-gray file:mr-3 file:py-2 file:px-3 file:rounded-sm file:border-0 file:text-sm file:font-medium file:bg-gray-100 hover:file:bg-gray-200 disabled:opacity-50"
            disabled={saving || isCompressing}
          />

          {isCompressing && (
            <div className="mt-2 text-xs text-dark-gray" role="status" aria-live="polite">
              Compressing… {compressDone}/{compressTotal}
              <div className="mt-1 h-1 w-full bg-gray-200 rounded">
                <div
                  className="h-1 bg-yellow rounded transition-all"
                  style={{
                    width: `${compressTotal ? Math.min(100, Math.round((compressDone / Math.max(1, compressTotal)) * 100)) : 0
                      }%`,
                  }}
                />
              </div>
            </div>
          )}

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
                    className="mt-1 p-1 text-red-600 hover:bg-red-50 rounded text-xs disabled:opacity-50"
                    onClick={() => removeLocalImage(i)}
                    title="Remove file"
                    disabled={saving || isCompressing}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 已有文档 + 新增上传：文档 */}
      <div className="border border-border p-2 mt-4">
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
                      <span className="text-xs text-dark-gray">
                        {(f.file_size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    )}
                    {f.id != null && (
                      <button
                        className="p-1 text-red-600 hover:bg-red-50 rounded text-xs disabled:opacity-50"
                        onClick={() => removeFileId(f.id)}
                        title="Unlink this document from the post"
                        disabled={saving || isCompressing}
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

        <div className="mt-6">
          <label className="block text-sm font-medium mb-1 text-gray-900">
            Add Documents <span className="ml-1 text-xs text-gray-500">(Optional)</span>
          </label>
          <input
            type="file"
            multiple
            accept={DOC_ACCEPT}
            onChange={onPickDocs}
            className="block w-full text-sm text-dark-gray file:mr-3 file:py-2 file:px-3 file:rounded-sm file:border-0 file:text-sm file:font-medium file:bg-gray-100 hover:file:bg-gray-200 disabled:opacity-50"
            disabled={saving || isCompressing}
          />
          <p className="mt-1 text-xs text-dark-gray">* Each file ≤ {MAX_DOC_MB} MB.</p>

          {localDocs.length > 0 && (
            <ul className="mt-2 divide-y divide-gray-200 border border-border rounded">
              {localDocs.map((f, i) => (
                <li key={`${f.name}-${f.size}-${i}`} className="flex items-center justify-between px-2 py-1 text-sm">
                  <div className="min-w-0">
                    <div className="truncate">{f.name}</div>
                    <div className="text-xs text-dark-gray">{(f.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                  <button
                    className="p-1 text-red-600 hover:bg-red-50 rounded text-xs disabled:opacity-50"
                    onClick={() => removeLocalDoc(i)}
                    title="Remove file"
                    disabled={saving || isCompressing}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 上传阶段提示（由上层传入 uploadingPercent） */}
      {uploadingPercent > 0 && (
        <div className="mt-4 text-xs text-dark-gray" role="status" aria-live="polite">
          Uploading… {Math.min(99, uploadingPercent)}%
          <div className="mt-1 h-1 w-full bg-gray-200 rounded">
            <div
              className="h-1 bg-green rounded transition-all"
              style={{ width: `${Math.min(99, uploadingPercent)}%` }}
            />
          </div>
        </div>
      )}
    </>
  );
}
