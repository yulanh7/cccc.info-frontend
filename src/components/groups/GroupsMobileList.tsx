"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilSquareIcon, TrashIcon, CalendarIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import CardSkeleton from "@/components/feedback/CardSkeleton";
import type { GroupApi } from "@/app/types";
import Pagination from "@/components/ui/Pagination";
import { ellipsize } from "@/app/ultility";
import IconButton from "@/components/ui/IconButton";
import SubscribeToggleButton from "@/components/ui/SubscribeToggleButton";
import ConfirmModal from "@/components/ConfirmModal"; // 复用并传自定义按钮

type Props = {
  rows: GroupApi[];
  listLoading: boolean;
  canEdit: (g: GroupApi) => boolean;
  isUserSubscribed: (g: GroupApi) => boolean;
  onEdit: (g: GroupApi) => void;
  onDelete: (id: number) => void;
  onToggleSubscription: (g: GroupApi) => void;
  saving: boolean;
  deleting: boolean;
  toggling: boolean;
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;

  formatDate: (timestamp: string, showTime?: boolean) => string;
};

export default function GroupsMobileList({
  rows,
  listLoading,
  canEdit,
  isUserSubscribed,
  onEdit,
  onDelete,
  onToggleSubscription,
  saving,
  deleting,
  toggling,
  currentPage,
  totalPages,
  buildHref,
  formatDate,
}: Props) {
  const router = useRouter();
  const [pendingSubscribeGroup, setPendingSubscribeGroup] = useState<GroupApi | null>(null);

  const handleCardClick = (group: GroupApi) => {
    if (isUserSubscribed(group)) {
      router.push(`/groups/${group.id}`);
    } else {
      setPendingSubscribeGroup(group);
    }
  };

  const confirmSubscribeAndEnter = async () => {
    const g = pendingSubscribeGroup;
    if (!g) return;
    try {
      await onToggleSubscription(g); // 你传入的订阅/退订逻辑（这里会执行订阅）
      router.push(`/groups/${g.id}`);
    } finally {
      setPendingSubscribeGroup(null);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      {listLoading && rows.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
          {rows.map((group) => {
            const subbed = isUserSubscribed(group);

            return (
              <div key={group.id} className="mb-4" style={{ breakInside: "avoid" }}>
                <div
                  onClick={() => handleCardClick(group)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCardClick(group); }}
                  role="button"
                  tabIndex={0}
                  className="
                    card relative p-4 cursor-pointer hover:shadow-sm
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dark-green
                  "
                  aria-label={`Open group ${group.name}`}
                >
                  {group.isPrivate && (
                    <div className="absolute left-2 top-2 flex items-center gap-1 text-dark-gray/80">
                      <LockClosedIcon className="h-4 w-4" />
                      <span className="text-[11px]">Private</span>
                    </div>
                  )}

                  {/* 顶部右侧操作（阻止冒泡） */}
                  {canEdit(group) && (
                    <div className="flex justify-end space-x-2 border-b-1 border-border mb-4">
                      <div onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          title="Edit group"
                          aria-label="Edit group"
                          rounded="full"
                          variant="ghost"
                          size="sm"
                          disabled={saving || deleting}
                          onClick={() => onEdit(group)}
                          tone="brand"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </IconButton>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          title="Delete group"
                          aria-label="Delete group"
                          rounded="full"
                          variant="ghost"
                          size="sm"
                          disabled={saving || deleting}
                          onClick={() => onDelete(group.id)}
                          tone="brand"

                        >
                          <TrashIcon className="h-5 w-5" />
                        </IconButton>
                      </div>
                    </div>
                  )}

                  {/* 标题 & 时间 */}
                  <h2 className="text-lg font-semibold text-dark-gray mb-1">
                    {group.name}
                    {group.is_creator && (
                      <span className="ml-2 align-middle text-[10px] px-1.5 py-0.5 rounded border border-dark-green text-dark-green">
                        Owner
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-dark-gray mb-1.5">
                    <span className="inline-flex items-center gap-1.5 italic">
                      <CalendarIcon className="h-4 w-4 " />
                      <time dateTime={group.time} className="font-medium">
                        {group.time ? formatDate(group.time) : "—"}
                      </time>
                    </span>
                  </p>

                  {/* 描述 */}
                  <p
                    className="text-gray text-sm whitespace-pre-line"
                    title={group.description || ""}
                  >
                    {ellipsize(group.description || "", 160, { byWords: true })}
                  </p>

                  {/* 底部：作者 + 订阅按钮（阻止冒泡） */}
                  <div className="mt-4 flex justify-between items-center">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-dark-green/10 text-dark-green text-xs font-semibold">
                        {(group.creator_name?.[0] || "?").toUpperCase()}
                      </span>
                      <span>{group.creator_name}</span>
                    </span>

                    <div onClick={(e) => e.stopPropagation()}>
                      <SubscribeToggleButton
                        subbed={subbed}
                        toggling={toggling}
                        disabled={saving || deleting}
                        onClick={() => onToggleSubscription(group)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!listLoading && (
        <div className="mt-6 flex justify-center">
          <Pagination currentPage={currentPage} totalPages={totalPages} buildHref={buildHref} />
        </div>
      )}

      {/* 订阅确认弹窗（未订阅时点击卡片触发） */}
      <ConfirmModal
        isOpen={Boolean(pendingSubscribeGroup)}
        onCancel={() => setPendingSubscribeGroup(null)}
        onConfirm={confirmSubscribeAndEnter}
        message="Subscribe to view this group?"
        confirmLabel="Subscribe"
        cancelLabel="Not now"
        confirmVariant="primary"
      />
    </div>
  );
}
