"use client";
import React, { useState } from "react";
import Link from "next/link";
import { TrashIcon, PencilSquareIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import ConfirmModal from "../ConfirmModal";
import { ellipsize } from "@/app/ultility";
import Logo from "@/components/Logo";
import { useBackNavigation } from "@/hooks/useBackNavigation";

interface CustomHeaderProps {
  item?: { id?: number; author?: string | null };
  showEdit?: boolean;
  showDelete?: boolean;
  showAdd?: boolean;
  pageTitle?: string;
  onDelete?: () => void;
  onEdit?: () => void;
  onAdd?: () => void;
  showLogo?: boolean;
  confirmDeleteInHeader?: boolean;
  deleteConfirmMessage?: string;
  rightSlot?: React.ReactNode;
  /** 可选：左上角显示返回箭头，指向这个地址（不传则不显示，其他页面不受影响） */
  backHref?: string;
  /** 箭头旁边显示的简短目的地，例如 "Library"；backLabel 是给读屏和鼠标提示用的完整说明 */
  backText?: string;
  backLabel?: string;
}

export default function CustomHeader({
  item,
  showEdit = false,
  showDelete = true,
  pageTitle,
  onDelete,
  onEdit,
  showLogo = false,
  confirmDeleteInHeader = false,
  deleteConfirmMessage = "Are you sure you want to delete this item?",
  rightSlot,
  backHref,
  backText,
  backLabel = "Back",
}: CustomHeaderProps) {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  // 回到离开时的列表页（页码、筛选、滚动位置）；直接打开链接进来的才跳到 backHref
  const goBack = useBackNavigation(backHref ?? "/");

  const handleDeleteClick = () => {
    if (!onDelete) return;
    if (confirmDeleteInHeader) {
      setIsDeleteConfirmOpen(true);
    } else {
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
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-bg border-b border-border px-3 py-2 md:hidden">
        <div className="flex items-center space-x-2">
          {backHref && (
            <Link
              href={backHref}
              onClick={goBack}
              aria-label={backLabel}
              title={backLabel}
              className="-ml-1 inline-flex items-center gap-0.5 p-1 text-sm text-dark-gray hover:text-dark-green"
            >
              <ChevronLeftIcon className="h-6 w-6 shrink-0" />
              {backText && <span>{backText}</span>}
            </Link>
          )}
          {showLogo && <Logo isScrolled={false} />}
          {item?.author && (
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-dark-green/10 text-dark-green text-xs font-semibold">
                {(item.author?.[0] || "?").toUpperCase()}
              </span>
            </span>
          )}
        </div>

        {/* 有返回箭头时标题靠右，避免较长的标题在窄屏上和左边的返回文字挤在一起；其他页面保持原样 */}
        <div className={backHref ? "pointer-events-none absolute right-3" : undefined}>
          {ellipsize(pageTitle, 20)}
        </div>

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
          {rightSlot}
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
