"use client";

import { useEffect, useRef } from "react";
import { XMarkIcon, UsersIcon } from "@heroicons/react/24/outline";

export interface Subscriber {
  id: number;
  firstName: string;
  email: string;
}

interface SubscribersModalProps {
  open: boolean;
  onClose: () => void;
  subscribers: Subscriber[];
  title?: string;
  onClickUser?: (id: number) => void;
}

export default function SubscribersModal({
  open,
  onClose,
  subscribers,
  title = "Subscribers",
  onClickUser,
}: SubscribersModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    setTimeout(() => closeBtnRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscribers-modal-title"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div
        className="relative z-10 w-full max-w-md rounded-xl bg-white  p-4 shadow-lg"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            <h3 id="subscribers-modal-title" className="text-lg font-semibold">
              {title}{" "}
              <span className="text-dark-gray font-normal">
                ({subscribers.length})
              </span>
            </h3>
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="text-dark-gray hover:text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-border"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* List */}
        <div className="space-y-2 max-h-[60vh] overflow-auto">
          {subscribers.length === 0 ? (
            <p className="text-sm text-dark-gray">No subscribers.</p>
          ) : (
            subscribers.map((u) => (
              <div className="mb-2">
                <div className="font-medium">{u.firstName || "—"}</div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 text-right">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border border-border hover:bg-bg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
