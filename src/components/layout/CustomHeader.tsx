"use client";
import React, { useState } from "react";
import { TrashIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import ConfirmModal from "../ConfirmModal";
import { ellipsize } from "@/app/ultility";
import Logo from "@/components/Logo";

interface CustomHeaderProps {
  item?: any;
  showEdit?: boolean;
  showDelete?: boolean;
  showAdd?: boolean;
  pageTitle?: string;
  // 改成无参数：让父组件决定要不要确认、确认文案是什么、以及删除逻辑
  onDelete?: () => void;
  onEdit?: () => void;
  onAdd?: () => void;
  showLogo?: boolean;

  /** 是否在 Header 内部弹确认；默认 false（推荐交给父级处理） */
  confirmDeleteInHeader?: boolean;
  /** 当 confirmDeleteInHeader=true 时使用的确认文案 */
  deleteConfirmMessage?: string;
}

export default function CustomHeader({
  item,
  showEdit = false,
  showDelete = true,
  pageTitle,
  onDelete,
  onEdit,
  onAdd,
  showLogo = false,
  confirmDeleteInHeader = false,
  deleteConfirmMessage = "Are you sure you want to delete this item?",
}: CustomHeaderProps) {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const handleDeleteClick = () => {
    if (!onDelete) return;
    if (confirmDeleteInHeader) {
      setIsDeleteConfirmOpen(true);
    } else {
      // 直接交给父级（父级会根据是否本人/组长，弹出不同的确认框）
      onDelete();
    }
  };

  const confirmDelete = () => {
    onDelete?.();
    setIsDeleteConfirmOpen(false);
  };

  const cancelDelete = () => setIsDeleteConfirmOpen(false);

  return (
    <>
      {/* 注意：md:hidden => 这个 Header 只在移动端显示 */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-bg border-b border-border px-3 py-2 md:hidden">
        <div className="flex items-center space-x-2">
          {showLogo && <Logo isScrolled={false} />}
          {item?.author && (
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-dark-green/10 text-dark-green text-xs font-semibold">
                {(item.author?.[0] || "?").toUpperCase()}
              </span>
            </span>
          )}
        </div>

        <div>{ellipsize(pageTitle, 20)}</div>

        <div className="flex items-center space-x-4">
          {showDelete && onDelete && (
            <button
              onClick={handleDeleteClick}
              className="text-dark-gray cursor-pointer hover:text-red focus:outline-none"
              aria-label="Delete"
              title="Delete"
            >
              <TrashIcon className="h-6 w-6" />
            </button>
          )}

          {showEdit && onEdit && (
            <button
              onClick={onEdit}
              className="text-dark-gray cursor-pointer hover:text-dark-green focus:outline-none"
              aria-label="Edit"
              title="Edit"
            >
              <PencilSquareIcon className="h-6 w-6" />
            </button>
          )}
        </div>
      </header>

      {confirmDeleteInHeader && (
        <ConfirmModal
          isOpen={isDeleteConfirmOpen}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          message={deleteConfirmMessage}
        />
      )}
    </>
  );
}
