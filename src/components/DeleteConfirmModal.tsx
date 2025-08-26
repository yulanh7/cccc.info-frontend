"use client";

import React from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  message,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-30">
      <div className="bg-white p-4 rounded-sm shadow-lg w-full max-w-sm mx-3">
        <p className="text-dark-gray mb-4">{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-dark-gray hover:text-dark-green"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-sm hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
