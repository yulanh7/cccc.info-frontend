"use client";

import { useState } from 'react';
import { ChevronLeftIcon, TrashIcon, PencilIcon, PlusIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface CustomHeaderProps {
  item?: any;
  showEdit?: boolean;
  showDelete?: boolean;
  showAdd?: boolean;
  onDelete?: (id: number) => void;
  onEdit?: () => void; // 改为无参数，触发打开模态框
  onAdd?: () => void; // 改为无参数，触发新增
}

export default function CustomHeader({
  item,
  showEdit = false,
  showDelete = true,
  showAdd = false,
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
      <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between p-4 border-b border-b-border bg-bg">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="flex items-center text-dark-gray hover:text-dark-green focus:outline-none"
          >
            <ChevronLeftIcon className="h-6 w-6 mr-2" />
          </button>
          {item?.author && (
            <span className="flex items-center text-dark-gray text-sm">
              <UserCircleIcon className="h-5 w-5 mr-1" />
              {item.author}
            </span>
          )}
        </div>
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
          {showAdd && onAdd && (
            <button
              onClick={onAdd}
              className="text-dark-gray hover:text-dark-green focus:outline-none"
            >
              <PlusIcon className="h-6 w-6" />
            </button>
          )}
        </div>
      </header>

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white p-4 rounded-sm shadow-lg w-full max-w-sm">
            <p className="text-dark-gray mb-4">
              Are you sure you want to delete this post?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-dark-gray hover:text-dark-green"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-sm hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}