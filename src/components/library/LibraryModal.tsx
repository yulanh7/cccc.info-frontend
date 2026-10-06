"use client";

import React, { useEffect, useId } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

/** 图书馆管理用的弹窗外壳（样式同 ConfirmModal） */
export default function LibraryModal({
  title,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className={`relative flex max-h-[90vh] w-full flex-col rounded-sm bg-white shadow-lg mx-3 ${wide ? "max-w-xl" : "max-w-md"}`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 id={titleId} className="text-base font-medium text-dark">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-black/5">
            <XMarkIcon className="h-5 w-5 text-dark-gray" />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-3">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-border px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}
