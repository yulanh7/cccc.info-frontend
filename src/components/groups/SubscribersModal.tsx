"use client";

import { useEffect, useRef, useState } from "react";
import { XMarkIcon, UsersIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";

export interface Subscriber {
  id: number;
  firstName: string;
  email: string;
  is_creator?: boolean;
}

interface SubscribersModalProps {
  open: boolean;
  onClose: () => void;

  members: Subscriber[];
  pagination?: { page: number; per_page: number; total: number; pages: number } | null;
  loading?: boolean;

  canManage?: boolean;
  onPageChange?: (page: number) => void;
  onAdd?: (input: string) => void; // user id 或 email
  onKick?: (userId: number) => void;

  title?: string;
}

export default function SubscribersModal({
  open, onClose, members, pagination, loading = false,
  canManage = false, onPageChange, onAdd, onKick, title = 'Subscribers'
}: SubscribersModalProps) {
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [kickingId, setKickingId] = useState<number | null>(null);

  if (!open) return null;

  const handleAdd = async () => {
    if (!onAdd || !input.trim()) return;
    try {
      setAdding(true);
      await onAdd(input.trim());
      setInput('');
    } finally {
      setAdding(false);
    }
  };

  const handleKick = async (id: number) => {
    if (!onKick) return;
    try {
      setKickingId(id);
      await onKick(id);
    } finally {
      setKickingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">
            {title} <span className="text-dark-gray font-normal">({pagination?.total ?? members.length})</span>
          </h3>
          <button onClick={onClose} className="text-dark-gray hover:text-foreground">×</button>
        </div>

        {/* 顶部：添加成员（仅可管理时显示） */}
        {canManage && (
          <div className="mb-4 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="User ID or email"
              className="flex-1 border border-border rounded px-2 py-1"
              disabled={adding}
            />
            <button
              onClick={handleAdd}
              disabled={adding || !input.trim()}
              className="px-3 py-1.5 rounded bg-yellow text-dark-gray disabled:opacity-50"
            >
              {adding ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Adding…
                </span>
              ) : 'Add'}
            </button>
          </div>
        )}

        {/* 列表 */}
        <div className="space-y-2 max-h-[60vh] overflow-auto relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
              <span className="inline-block h-5 w-5 rounded-full border-2 border-current border-t-transparent animate-spin" aria-label="Loading" />
            </div>
          )}

          {members.length === 0 ? (
            <p className="text-sm text-dark-gray">No subscribers.</p>
          ) : members.map((u) => (
            <div key={u.id} className="flex items-center justify-between border-b-1 border-border rounded p-1 text-sm text-gray">
              <div>
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-dark-green/10 text-dark-green text-xs font-semibold">
                    {(u.firstName?.[0] || "?").toUpperCase()}
                  </span>
                  <span>{u.firstName}</span>
                </span>
                {/* <div className="text-xs text-dark-gray">{u.email}</div> */}
              </div>
              {canManage && (
                <button
                  onClick={() => handleKick(u.id)}
                  disabled={kickingId === u.id}
                  className="px-3 py-1 text-xs rounded border border-red-500 text-red-600 disabled:opacity-50"
                >
                  {kickingId === u.id ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      Kicking…
                    </span>
                  ) : 'Kick'}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* 分页 */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={() => onPageChange?.(Math.max(1, (pagination.page ?? 1) - 1))}
              disabled={loading || (pagination.page ?? 1) <= 1}
              className="px-2 py-1 rounded border disabled:opacity-50"
            >Prev</button>
            <span className="text-sm">
              Page {pagination.page ?? 1} / {pagination.pages}
            </span>
            <button
              onClick={() => onPageChange?.(Math.min(pagination.pages, (pagination.page ?? 1) + 1))}
              disabled={loading || (pagination.page ?? 1) >= pagination.pages}
              className="px-2 py-1 rounded border disabled:opacity-50"
            >Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
