"use client";

import React from "react";
import Button from "@/components/ui/Button";

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message: string;

  /** 可选：自定义按钮文案与样式（保持兼容：不传仍是 Delete/红色） */
  confirmLabel?: string;                         // e.g. "Subscribe"
  cancelLabel?: string;                          // e.g. "Not now"
  confirmVariant?: "primary" | "warning" | "outline" | "ghost" | "danger";
  cancelVariant?: "outline" | "ghost" | "primary" | "warning" | "danger";
}

export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  message,
  confirmLabel = "Delete",     // 兼容：默认 Delete
  cancelLabel = "Cancel",
  confirmVariant = "danger",   // 兼容：默认红色
  cancelVariant = "ghost",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-30">
      <div className="bg-white p-4 rounded-sm shadow-lg w-full max-w-sm mx-3">
        <p className="text-dark-gray mb-4">{message}</p>
        <div className="flex justify-end space-x-3">
          <Button
            variant={cancelVariant}
            onClick={onCancel}
            aria-label={cancelLabel}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            aria-label={confirmLabel}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
