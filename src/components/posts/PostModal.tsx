"use client";

import { useState, useRef } from "react";
import { TrashIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import SaveConfirmModal from "@/components/SaveConfirmModal";
import Button from "@/components/ui/Button";
import type { PostProps } from "@/app/types/post";

interface PostModalProps {
  item?: Partial<PostProps>;
  isNew?: boolean;
  onSave: (updatedItem: PostProps) => void | Promise<void>;
  onClose: () => void;
}

export default function PostModal({
  item = {},
  isNew = false,
  onSave,
  onClose,
}: PostModalProps) {
  // —— 安全默认值（只允许 videoUrls: string[]）
  const defaultItem: PostProps = {
    id: isNew ? Date.now() : (item?.id as number) ?? 0,
    title: "",
    description: "",
    videoUrls: [],
    files: [],
    author:
      (item as any)?.author ?? {
        firstName: "",
        id: 1,
      },
    group: (item as any)?.group ?? "",
    date: (item as any)?.date ?? new Date().toISOString().split("T")[0],
  };

  // —— 编辑态：用默认值兜底再覆盖传入，且强制 videoUrls / files 为数组
  const initial: PostProps = {
    ...defaultItem,
    ...(item as any),
    videoUrls: Array.isArray((item as any)?.videoUrls)
      ? [...((item as any).videoUrls as string[])]
      : [],
    files: Array.isArray((item as any)?.files) ? [...(item as any).files] : [],
  };

  const [editedItem, setEditedItem] = useState<PostProps>(initial);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleChange = (field: keyof PostProps, value: any) => {
    setEditedItem((prev) => ({ ...prev, [field]: value }));
  };

  // —— 多个视频链接的输入与解析：每行一个（也兼容 , 或 ;）
  const videoUrlsString = (editedItem.videoUrls ?? []).join("\n");
  const handleVideoUrlsChange = (value: string) => {
    const list = value
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    handleChange("videoUrls", list);
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
      current.filter((_, i) => i !== index)
    );
  };

  const handleSave = async () => {
    // 清洗 videoUrls 与 files，确保类型正确
    const cleanedVideoUrls = Array.isArray(editedItem.videoUrls)
      ? editedItem.videoUrls.map((s) => String(s).trim()).filter(Boolean)
      : [];

    const baseFiles = Array.isArray(editedItem.files) ? editedItem.files : [];
    const cleanedItem: PostProps = {
      ...editedItem,
      videoUrls: cleanedVideoUrls,
      files: baseFiles.map(({ name, url, file }: any) => ({ name, url, file })),
    };

    try {
      await Promise.resolve(onSave(cleanedItem));
      onClose(); // 成功后关闭
    } catch (e: any) {
      alert(e?.message || "Save failed");
    }
  };

  // 关闭按钮：若有改动则二次确认
  const handleCloseClick = () => {
    const hasChanges = JSON.stringify(editedItem) !== JSON.stringify(initial);
    if (hasChanges) setIsConfirmOpen(true);
    else onClose();
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
      return { top: rect.height + 8, right: 8 };
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

        {/* 多个视频 URL：每行一个（也兼容逗号/分号分隔） */}
        <label className="block text-sm text-dark-gray mb-2">Video URLs</label>
        <textarea
          value={videoUrlsString}
          onChange={(e) => handleVideoUrlsChange(e.target.value)}
          className="w-full p-2 mb-4 border border-border rounded-sm min-h-[84px] resize-y overflow-y-auto"
          placeholder={`One URL per line\n(also supports comma or semicolon separated)`}
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
