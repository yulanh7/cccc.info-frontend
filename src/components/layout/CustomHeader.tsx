"use client";

import { useState } from 'react';
import {
  ChevronLeftIcon, TrashIcon, PencilIcon, PlusIcon, UserCircleIcon
} from '@heroicons/react/24/outline';
import DeleteConfirmModal from '../DeleteConfirmModal';

interface CustomHeaderProps {
  item?: any;
  showEdit?: boolean;
  showDelete?: boolean;
  showAdd?: boolean;
  pageTitle?: string;
  onDelete?: (id: number) => void;
  onEdit?: () => void;
  onAdd?: () => void;
}

export default function CustomHeader({
  item,
  showEdit = false,
  showDelete = true,
  pageTitle,
  onDelete,
  onEdit,
  onAdd,
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
      <header className="fixed md:hidden top-0 left-1/2 -translate-x-1/2 z-10 w-full max-w-[769px] flex items-center justify-between p-4 border-b border-b-border bg-bg">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleBack}
            className="text-dark-gray hover:text-dark-green focus:outline-none"
          >
            <ChevronLeftIcon className="h-6 w-6 mr-1" />
          </button>
          {item?.author && (
            <span className="flex items-center text-dark-gray text-sm">
              <UserCircleIcon className="h-5 w-5 mr-1" />
              {item.author}
            </span>
          )}
        </div>
        <div>{pageTitle}</div>
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
              <PencilIcon className="h-6 w-6" />
            </button>
          )}
        </div>
      </header>

      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        message="Are you sure you want to delete this item?"
      />
    </>
  );
}