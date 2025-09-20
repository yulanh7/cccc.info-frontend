"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilSquareIcon, TrashIcon, CalendarIcon, LockClosedIcon, LockOpenIcon, PlusIcon } from "@heroicons/react/24/outline";
import CardSkeleton from "@/components/feedback/CardSkeleton";
import type { GroupApi } from "@/app/types";
import Pagination from "@/components/ui/Pagination";
import { ellipsize } from "@/app/ultility";
import IconButton from "@/components/ui/IconButton";
import SubscribeToggleButton from "@/components/groups/SubscribeToggleButton";
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
  const cancelAndEnter = () => {
    const g = pendingSubscribeGroup;
    if (!g) {
      setPendingSubscribeGroup(null);
      return;
    }
    router.push(`/groups/${g.id}`);
    setPendingSubscribeGroup(null);
  };

  return (
    <div className="space-y-4 mt-4">
      {/* <div className="hidden md:flex justify-between my-6 ">
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
      </div> */}

      {/* 移动端悬浮新增 */}
      {canCreate && onAdd && (
        <button
          onClick={onAdd}
          className="fixed bottom-20 z-10 right-10 bg-yellow p-2 rounded-[50%]"
        >
          <PlusIcon className="h-5 w-5 md:h-7 md:w-7 text-white" />
        </button>
      )}

      {listLoading && rows.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-[3px]">
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
                    card relative p-2 cursor-pointer hover:shadow-sm
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dark-green
                  "
                  aria-label={`Open group ${group.name}`}
                >

                  <div className="flex justify-between align-middle space-x-2 border-b-1 border-border mb-2 pb-1">

                    {group.isPrivate ? (
                      <div className="flex items-center gap-1 text-dark-gray/80">
                        <LockClosedIcon className="h-4 w-4 text-red" />
                        <span className="text-[11px]">Private</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-dark-gray/80">
                        <LockOpenIcon className="h-4 w-4 text-dark-green" />
                        <span className="text-[11px]">Public</span>
                      </div>

                    )}

                    {/* 顶部右侧操作（阻止冒泡） */}
                    {canEdit?.(group) && (
                      <div className="flex justify-end space-x-2">
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
                  </div>
                  {/* 标题 & 时间 */}
                  <h2 className="text-base font-semibold text-dark-gray mb-1">
                    {group.name}
                    {/* {group.is_creator && (
                      <span className="ml-2 align-middle text-[10px] px-1.5 py-0.5 rounded border border-dark-green text-dark-green">
                        Owner
                      </span>
                    )} */}
                  </h2>
                  <p className="text-xs text-dark-gray mb-1">
                    <span className="inline-flex items-center gap-1.5 italic">
                      <CalendarIcon className="h-4 w-4 " />
                      <time dateTime={group.time} className="font-medium">
                        {group.time ? formatDate(group.time) : "—"}
                      </time>
                    </span>
                  </p>

                  {/* 描述 */}
                  {/* <p className="text-gray text-sm whitespace-pre-line" title={group.description || ""}>
                    {ellipsize(group.description || "", 160)}
                  </p> */}

                  {/* 底部：作者 + 订阅按钮（阻止冒泡） */}
                  <div className="mt-2 flex justify-between items-center">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-dark-green/10 text-dark-green text-xs font-semibold">
                        {(group.creator_name?.[0] || "?").toUpperCase()}
                      </span>
                      <span className="text-[10px]">
                        {ellipsize(group.creator_name, 10)}
                      </span>
                    </span>

                    <div onClick={(e) => e.stopPropagation()}>
                      <SubscribeToggleButton groupId={group.id} isMemberHint={group.is_member} mode="follow" />
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
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}

      {/* 订阅确认弹窗（未订阅时点击卡片触发） */}

      <ConfirmModal
        isOpen={Boolean(pendingSubscribeGroup)}
        title="Follow this group?"
        message={"We’ll show new posts on your Home feed.\nYou can unfollow anytime."}
        // 主按钮：关注并进入
        onConfirm={confirmSubscribeAndEnter}
        confirmLabel="Follow"
        confirmVariant="primary"
        // 次要按钮：不关注但进入
        onCancel={cancelAndEnter}
        cancelLabel="Continue without following"
        cancelVariant="ghost"
        // 纯关闭（✕ / 遮罩 / Esc）：仅关闭，不导航
        onClose={() => setPendingSubscribeGroup(null)}
        showCloseButton
        closeOnBackdrop
        closeOnEsc
      />


    </div>
  );
}
