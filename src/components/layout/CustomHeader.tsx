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
  onDelete?: () => void;
  onEdit?: () => void;
  onAdd?: () => void;
  showLogo?: boolean;
  confirmDeleteInHeader?: boolean;
  deleteConfirmMessage?: string;
  rightSlot?: React.ReactNode;
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
  rightSlot
}: CustomHeaderProps) {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

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
