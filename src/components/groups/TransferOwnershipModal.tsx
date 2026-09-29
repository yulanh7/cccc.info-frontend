"use client";

import { useEffect, useState } from "react";
import Button from '@/components/ui/Button'
import type { Subscriber } from "@/components/groups/SubscribersModal";

interface TransferOwnershipModalProps {
  open: boolean;
  onClose: () => void;

  /** 候选人：只能是组长（不含当前创建者） */
  leaders: Subscriber[];
  loading?: boolean;
  transferring?: boolean;

  onTransfer: (leader: Subscriber) => void;
}

export default function TransferOwnershipModal({
  open, onClose, leaders, loading = false, transferring = false, onTransfer
}: TransferOwnershipModalProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 每次打开都重新选择
  useEffect(() => {
    if (open) setSelectedId(null);
  }, [open]);

  if (!open) return null;

  const selected = leaders.find((u) => u.id === selectedId) ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Transfer ownership</h3>
          <button onClick={onClose} className="text-3xl text-dark-gray hover:text-foreground -mt-2">×</button>
        </div>

        <p className="text-sm text-dark-gray mb-3">
          Only group leaders can become the owner. You will remain a leader after the transfer.
        </p>

        {/* 组长列表 */}
        <div className="space-y-2 max-h-[50vh] overflow-auto relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
              <span className="inline-block h-5 w-5 rounded-full border-2 border-current border-t-transparent animate-spin" aria-label="Loading" />
            </div>
          )}

          {!loading && leaders.length === 0 ? (
            <p className="text-sm text-dark-gray">No other leaders yet. Make a member a leader first.</p>
          ) : leaders.map((u) => (
            <label key={u.id} className="flex items-center gap-2 border-b-1 border-border rounded p-1 text-sm text-gray cursor-pointer">
              <input
                type="radio"
                name="transfer-owner"
                value={u.id}
                checked={selectedId === u.id}
                onChange={() => setSelectedId(u.id)}
                disabled={transferring}
              />
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-dark-green/10 text-dark-green text-xs font-semibold">
                {(u.firstName?.[0] || "?").toUpperCase()}
              </span>
              <span>{u.firstName}</span>
            </label>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={transferring}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => selected && onTransfer(selected)}
            disabled={!selected}
            loading={transferring}
            loadingText="Transferring…"
          >
            Transfer
          </Button>
        </div>
      </div>
    </div>
  );
}
