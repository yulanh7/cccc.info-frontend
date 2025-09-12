"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeftIcon, TrashIcon, PencilSquareIcon, PlusIcon, UserCircleIcon
} from '@heroicons/react/24/outline';
import ConfirmModal from '../ConfirmModal';
import { ellipsize } from '@/app/ultility';
import Logo from '@/components/Logo';

interface CustomHeaderProps {
  item?: any;
  showEdit?: boolean;
  showDelete?: boolean;
  showAdd?: boolean;
  pageTitle?: string;
  onDelete?: (id: number) => void;
  onEdit?: () => void;
  onAdd?: () => void;
  showLogo?: boolean
}

export default function CustomHeader({
  item,
  showEdit = false,
  showDelete = true,
  pageTitle,
  onDelete,
  onEdit,
  onAdd,
  showLogo = false
}: CustomHeaderProps) {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const handleBack = () => {
    window.history.back();
  };

  const handleDeleteClick = () => {
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (onDelete && item) {
      onDelete(item.id);
    }
    setIsDeleteConfirmOpen(false);
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
  };

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
              {/* <span className="text-[9px]">{item.author}</span> */}
            </span>
          )}
        </div>
        <div> {ellipsize(pageTitle, 20, { byWords: true })} </div>
        <div className="flex items-center space-x-4">
          {showDelete && onDelete && item && (
            <button
              onClick={handleDeleteClick}
              className="text-dark-gray cursor-pointer hover:text-red focus:outline-none"
            >
              <TrashIcon className="h-6 w-6" />
            </button>
          )}
          {showEdit && onEdit && item && (
            <button
              onClick={onEdit}
              className="text-dark-gray cursor-pointer hover:text-dark-green focus:outline-none"
            >
              <PencilSquareIcon className="h-6 w-6" />
            </button>
          )}
        </div>
      </header>

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        message="Are you sure you want to delete this item?"
      />
    </>
  );
}