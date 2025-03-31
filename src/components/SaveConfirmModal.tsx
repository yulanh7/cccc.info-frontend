"use client";

import React, { useEffect, useRef } from 'react';
import { TrashIcon, CheckIcon } from '@heroicons/react/24/outline';

interface ConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  onOutsideClick: () => void;
  isOpen: boolean;
  position?: { top: number; right: number };
}

export default function ConfirmModal({
  onConfirm,
  onCancel,
  onOutsideClick,
  isOpen,
  position = { top: 0, right: 0 },
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onOutsideClick();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onOutsideClick]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="absolute bg-white p-2 rounded-sm shadow-lg z-30"
      style={{ top: `${position.top}px`, right: `${position.right}px` }}
    >
      <div className="flex flex-col space-y-2">
        <button
          onClick={onCancel}
          className="flex items-center px-2 py-1 text-dark-gray text-sm"
        >
          <TrashIcon className="h-5 w-5 mr-2" />
          Discard
        </button>
        <button
          onClick={onConfirm}
          className="flex items-center px-2 py-1 text-dark-gray text-sm"
        >
          <CheckIcon className="h-5 w-5 mr-2" />
          Save & Close
        </button>
      </div>
    </div>
  );
}