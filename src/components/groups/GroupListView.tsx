"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilSquareIcon, TrashIcon, CalendarIcon, LockClosedIcon, PlusIcon } from "@heroicons/react/24/outline";
import CardSkeleton from "@/components/feedback/CardSkeleton";
import type { GroupApi } from "@/app/types";
import Pagination from "@/components/ui/Pagination";
import { ellipsize } from "@/app/ultility";
import IconButton from "@/components/ui/IconButton";
import SubscribeToggleButton from "@/components/ui/SubscribeToggleButton";
import ConfirmModal from "@/components/ConfirmModal";
import Button from "@/components/ui/Button";

type Props = {
  title?: string;
  rows: GroupApi[];
  listLoading: boolean;
  pageLoading?: boolean;
  currentPage: number;
  totalPages: number;

  // 行为
  onPageChange: (page: number) => void;
  onAdd?: () => void;
  canCreate?: boolean;
  onEdit?: (g: GroupApi) => void;
  onDelete?: (id: number) => void;
  canEdit?: (g: GroupApi) => boolean;

  isUserSubscribed: (g: GroupApi) => boolean;
  onToggleSubscription?: (g: GroupApi) => Promise<boolean> | boolean;

  // 状态
  saving?: boolean;
  deleting?: boolean;
  toggling?: boolean;

  // 工具
  formatDate: (timestamp: string, showTime?: boolean) => string;
};

export default function GroupListView({
  rows,
  listLoading,
  pageLoading,
  currentPage,
  totalPages,

  onPageChange,
  onAdd,
  canCreate,
  onEdit,
  onDelete,
  canEdit,

  isUserSubscribed,
  onToggleSubscription,

  saving = false,
  deleting = false,
  toggling = false,

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
      const ok = (await onToggleSubscription?.(g)) ?? false;
      if (ok) router.push(`/groups/${g.id}`);
    } finally {
      setPendingSubscribeGroup(null);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      {/* 顶部操作（桌面） */}
      <div className="hidden md:flex justify-between my-6">
        {canCreate && onAdd && (
          <Button
            onClick={onAdd}
            className="ml-auto"
            variant="secondary"
            leftIcon={<PlusIcon className="h-5 w-5" />}
          >
            New Group
          </Button>
        )}
      </div>

      {/* 移动端悬浮新增 */}
      {canCreate && onAdd && (
        <button
          onClick={onAdd}
          className="fixed md:hidden bottom-20 z-10 right-10 bg-yellow p-2 rounded-[50%]"
        >
          <PlusIcon className="h-5 w-5 text-white" />
        </button>
      )}

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
                  {canEdit?.(group) && (
                    <div className="flex justify-end space-x-2 border-b-1 border-border mb-4">
                      {onEdit && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <IconButton
                            title="Edit group"
                            aria-label="Edit group"
                            rounded="full"
                            variant="ghost"
                            size="sm"
                            disabled={saving || deleting}
                            onClick={() => onEdit(group)}
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </IconButton>
                        </div>
                      )}
                      {onDelete && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <IconButton
                            title="Delete group"
                            aria-label="Delete group"
                            rounded="full"
                            variant="ghost"
                            size="sm"
                            disabled={saving || deleting}
                            onClick={() => onDelete(group.id)}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </IconButton>
                        </div>
                      )}
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
                  <p className="text-gray text-sm whitespace-pre-line" title={group.description || ""}>
                    {ellipsize(group.description || "", 160, { byWords: true })}
                  </p>

                  {/* 底部：作者 + 订阅按钮（阻止冒泡） */}
                  <div className="mt-4 flex justify-between items-center">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-dark-green/10 text-dark-green text-xs font-semibold">
                        {(group.creator_name?.[0] || "?").toUpperCase()}
                      </span>
                      <span className="text-[10px]">
                        {ellipsize(group.creator_name, 10, { byWords: true })}
                      </span>
                    </span>

                    {onToggleSubscription && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <SubscribeToggleButton
                          subbed={subbed}
                          toggling={toggling}
                          disabled={saving || deleting}
                          onClick={() => onToggleSubscription(group)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!listLoading && (
        <div className="mt-6 flex justify-center">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
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
