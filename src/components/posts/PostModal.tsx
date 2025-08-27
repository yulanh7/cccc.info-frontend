"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { TrashIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import SaveConfirmModal from "@/components/SaveConfirmModal";
import Button from "@/components/ui/Button";
import type { PostProps } from "@/app/types/post";

interface PostModalProps {
  item?: Partial<PostProps> & { videoUrl?: string };
  isNew?: boolean;
  onSave: (updatedItem: any) => void | Promise<void>;
  onClose: () => void;
}

export default function PostModal({
  item = {},
  isNew = false,
  onSave,
  onClose,
}: PostModalProps) {
  // —— 构造“安全”的默认对象，避免 undefined
  const defaultItem: any = {
    id: isNew ? Date.now() : item?.id ?? 0,
    title: "",
    description: "",
    // 既兼容 videoUrl（单个输入），也兼容 videoUrls（数组）
    videoUrl: item?.videoUrl ?? "",
    videoUrls: Array.isArray((item as any)?.videoUrls)
      ? [...(item as any).videoUrls]
      : item?.videoUrl
        ? [item.videoUrl]
        : [],
    files: Array.isArray((item as any)?.files) ? [...(item as any).files] : [],
    author:
      (item as any)?.author ?? {
        firstName: "",
        id: 1,
      },
    group: (item as any)?.group ?? "",
    date: (item as any)?.date ?? new Date().toISOString().split("T")[0],
  };

  // 编辑模式下：用 defaultItem 兜底，再让传入的 item 覆盖
  const initial: any = isNew ? defaultItem : { ...defaultItem, ...item };
  const [editedItem, setEditedItem] = useState<any>(initial);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleChange = (field: string, value: any) => {
    setEditedItem((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFile = {
        name: files[0].name,
        url: "",
        file: files[0],
      };
      const current = Array.isArray(editedItem.files) ? editedItem.files : [];
      handleChange("files", [...current, newFile]);
      e.target.value = "";
    }
  };

  const handleDeleteFile = (index: number) => {
    const current = Array.isArray(editedItem.files) ? editedItem.files : [];
    handleChange(
      "files",
      current.filter((_: any, i: number) => i !== index)
    );
  };

  const handleSave = async () => {
    // files 容错
    const baseFiles = Array.isArray(editedItem.files) ? editedItem.files : [];
    const cleanedItem = {
      ...editedItem,
      // 保留 file 以便上层上传；如果只要 name/url，可按需裁剪
      files: baseFiles.map(({ name, url, file }: any) => ({ name, url, file })),
      // 让上层既能用 videoUrls（数组）也能用 videoUrl（单个）
      videoUrls: Array.isArray(editedItem.videoUrls)
        ? editedItem.videoUrls
        : editedItem.videoUrl
          ? [editedItem.videoUrl]
          : [],
    };

    try {
      await Promise.resolve(onSave(cleanedItem));
      onClose(); // 保存成功再关闭
    } catch (e: any) {
      alert(e?.message || "Save failed");
    }
  };

  const handleCloseClick = () => {
    const baseline = isNew ? defaultItem : initial;
    const hasChanges = JSON.stringify(editedItem) !== JSON.stringify(baseline);
    if (hasChanges) {
      setIsConfirmOpen(true);
    } else {
      onClose();
    }
  };

  const confirmSaveAndClose = async () => {
    await handleSave();
    setIsConfirmOpen(false);
  };

  const confirmCancel = () => setIsConfirmOpen(false);

  const confirmCloseWithoutSaving = () => {
    onClose();
    setIsConfirmOpen(false);
  };

  const getConfirmPosition = () => {
    if (closeButtonRef.current) {
      const rect = closeButtonRef.current.getBoundingClientRect();
      return {
        top: rect.height + 8,
        right: 8,
      };
    }
    return { top: 0, right: 0 };
  };

  return (
    <div className="fixed inset-0 bg-gray-600/50 flex items-center justify-center z-20 overflow-y-auto">
      <div className="bg-white p-6 rounded-sm shadow-lg w-full md:max-w-[80vw] max-h-[90vh] overflow-y-auto relative">
        {/* 关闭按钮 */}
        <button
          ref={closeButtonRef}
          onClick={handleCloseClick}
          className="absolute top-6 right-4 text-dark-gray hover:text-dark-green focus:outline-none"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-xl mb-4">{isNew ? "Add New Item" : "Edit Item"}</h2>

        {/* 标题 */}
        <input
          type="text"
          value={editedItem.title || ""}
          onChange={(e) => handleChange("title", e.target.value)}
          className="w-full p-2 mb-4 border border-border rounded-sm"
          placeholder="Title"
        />

        {/* 描述 */}
        <textarea
          value={editedItem.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
          className="w-full p-2 mb-4 border border-border rounded-sm min-h-[100px] resize-y overflow-y-auto"
          placeholder="Description"
        />

        {/* 单个视频 URL（上层会兼容） */}
        <input
          type="text"
          value={editedItem.videoUrl || ""}
          onChange={(e) => handleChange("videoUrl", e.target.value)}
          className="w-full p-2 mb-4 border border-border rounded-sm"
          placeholder="Video URL"
        />

        {/* 文件列表 */}
        <div className="mb-4">
          <label className="block text-sm text-dark-gray mb-2">Files</label>
          <div className="space-y-2 max-h-[150px] overflow-y-auto">
            {(Array.isArray(editedItem.files) ? editedItem.files : []).map(
              (file: { name: string; url: string }, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-100 rounded-sm"
                >
                  <span>{file.name}</span>
                  <button
                    onClick={() => handleDeleteFile(index)}
                    className="text-red-600 hover:text-red-800 focus:outline-none"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              )
            )}
          </div>

          <div className="mt-2">
            <label className="flex items-center p-2 border border-border rounded-sm cursor-pointer">
              <PlusIcon className="h-5 w-5 mr-2 text-dark-gray" />
              <span className="text-dark-gray">Upload File</span>
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>

        <SaveConfirmModal
          onConfirm={confirmSaveAndClose}
          onCancel={confirmCloseWithoutSaving}
          onOutsideClick={confirmCancel}
          isOpen={isConfirmOpen}
          position={getConfirmPosition()}
        />
      </div>
    </div>
  );
}
