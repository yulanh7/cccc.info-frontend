"use client";

import React from "react";
import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
  CalendarIcon,
  UserPlusIcon,
  CheckCircleIcon,
  LockClosedIcon
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import type { GroupProps } from "@/app/types/group";
import { canEditGroup } from "@/app/types/group";

type Props = {
  group: GroupProps;
  subscriberCount: number;
  onShowMembers: () => void;
  onNewPost: () => void;
  onEditGroup: () => void;
  onDeleteGroup: () => void;
  formatDate: (timestamp: string, showTime?: boolean) => string;

  /** 选择模式（由父组件控制） */
  selectMode: boolean;
  selectedCount: number;
  onToggleSelectMode: () => void;
  onBulkDeleteSelected: () => void;
};

export default function GroupInfoBar({
  group,
  subscriberCount,
  onShowMembers,
  onNewPost,
  onEditGroup,
  onDeleteGroup,
  formatDate,
  selectMode,
  selectedCount,
  onToggleSelectMode,
  onBulkDeleteSelected,
}: Props) {
  // 统一权限判断：只有创建者可管理（编辑/删除/选择/新建）
  const canManage = canEditGroup(group);

  return (
    <>
      <section className="mb-4 md:mb-6 rounded-xl border border-border bg-bg p-4 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            {/* 标题 + Owner 徽标（如果可管理） */}
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-semibold text-foreground">
                {group.title}
              </h2>
              {canManage && (
                <span className="text-[10px] px-1.5 py-0.5 rounded border border-green text-green">
                  Owner
                </span>
              )}
              {group.isPrivate && (
                <div className="flex items-center gap-1 text-dark-gray/80">
                  <LockClosedIcon className="h-4 w-4" />
                  <span className="text-[11px]">Private</span>
                </div>
              )}
            </div>

            {group.description && (
              <p className="mt-2 text-sm text-dark-gray">{group.description}</p>
            )}
          </div>

          {/* 桌面端右上角操作，仅创建者可见 */}
          {canManage && (
            <div className="hidden md:flex items-center gap-2">
              <IconButton
                title="Edit group"
                aria-label="Edit group"
                variant="ghost"
                tone="brand"
                size="md"
                onClick={onEditGroup}
              >
                <PencilIcon className="h-5 w-5" />
              </IconButton>

              <IconButton
                title="Delete group"
                aria-label="Delete group"
                variant="ghost"
                tone="brand"
                size="md"
                onClick={onDeleteGroup}
              >
                <TrashIcon className="h-5 w-5" />
              </IconButton>
            </div>
          )}
        </div>

        {/* 元信息 */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-dark-gray">
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-dark-green/10 text-dark-green text-xs font-semibold">
              {(group.creator?.firstName?.[0] || "?").toUpperCase()}
            </span>
            <span>{group.creator?.firstName}</span>
          </span>

          <span className="inline-flex items-center gap-1.5">
            <CalendarIcon className="h-5 w-5" />
            <time dateTime={group.createdDate} className="font-medium">
              {group.createdDate ? formatDate(group.createdDate) : "—"}
            </time>
          </span>

          <Button
            onClick={onShowMembers}
            variant="outline"
            size="sm"
            leftIcon={<UserPlusIcon className="h-4 w-4" />}
            title="View members"
          >
            <span className="text-[11px] uppercase tracking-wide text-dark-gray/70">
              Members
            </span>
            <span className="ml-1 font-semibold">{subscriberCount}</span>
          </Button>
        </div>
      </section>

      {/* 移动端/桌面通用：选择模式 & 新建，仅创建者可见 */}
      {canManage && (
        <section className="flex justify-end gap-2 px-4">
          <Button
            onClick={onToggleSelectMode}
            variant={selectMode ? "warning" : "outline"}
            size="sm"
            leftIcon={<CheckCircleIcon className="h-5 w-5" />}
            active={selectMode}
          >
            {selectMode ? "Cancel" : "Select Posts"}
          </Button>

          {selectMode && (
            <Button
              onClick={onBulkDeleteSelected}
              variant="danger"
              size="sm"
              leftIcon={<TrashIcon className="h-5 w-5" />}
              disabled={selectedCount === 0}
            >
              Delete{selectedCount > 0 ? ` (${selectedCount})` : ""}
            </Button>
          )}

          <Button
            onClick={onNewPost}
            variant="primary"
            size="sm"
            leftIcon={<PlusIcon className="h-5 w-5" />}
          >
            New Post
          </Button>
        </section>
      )}
    </>
  );
}
