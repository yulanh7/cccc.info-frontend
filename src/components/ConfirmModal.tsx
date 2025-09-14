"use client";

import React, { useEffect, useId } from "react";
import Button from "@/components/ui/Button";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  /** 次要按钮动作（如：继续进入但不关注） */
  onCancel?: () => void;
  /** 纯关闭：用于 ✕ / 遮罩 / Esc；不传则回退到 onCancel（兼容旧用法） */
  onClose?: () => void;

  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "warning" | "outline" | "ghost" | "danger";
  cancelVariant?: "outline" | "ghost" | "primary" | "warning" | "danger";

  title?: string;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  onClose,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  cancelVariant = "outline",
  title,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEsc = true,
}: ConfirmModalProps) {
  const titleId = useId();
  const descId = useId();

  // 统一的“纯关闭”处理：优先 onClose，回退 onCancel（保证兼容）
  const handleClose = () => (onClose ?? onCancel)?.();

  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, closeOnEsc, onClose, onCancel]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={descId}
      onClick={closeOnBackdrop ? handleClose : undefined}  // 点击遮罩 = 纯关闭
    >
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative bg-white p-4 rounded-sm shadow-lg w-full max-w-sm mx-3"
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={handleClose} // ✕ = 纯关闭
            aria-label="Close"
            className="absolute right-2 top-2 p-1 rounded hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border"
          >
            <XMarkIcon className="h-5 w-5 text-dark-gray" />
          </button>
        )}

        {title && (
          <h3 id={titleId} className="text-base font-medium text-dark mb-2 pr-8">
            {title}
          </h3>
        )}

        <p id={descId} className="text-dark-gray mb-4 whitespace-pre-line">
          {message}
        </p>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button variant={cancelVariant} onClick={onCancel} aria-label={cancelLabel}>
              {cancelLabel}
            </Button>
          )}
          <Button variant={confirmVariant} onClick={onConfirm} aria-label={confirmLabel}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
