"use client";

import React from "react";
import {
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  CalendarIcon,
  UserPlusIcon,
  LockOpenIcon,
  LockClosedIcon
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import type { GroupApi } from "@/app/types/group";
import SubscribeToggleButton from "@/components/groups/SubscribeToggleButton";

type Props = {
  group: GroupApi;
  subscriberCount: number;
  onShowMembers: () => void;
  onNewPost: () => void;
  onEditGroup: () => void;
  onDeleteGroup: () => void;
  formatDate: (timestamp: string, showTime?: boolean) => string;
  canManageGroup: boolean;
  canShowCreateFab: boolean;
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
  onBulkDeleteSelected,
  canManageGroup = false,
  canShowCreateFab = false,
}: Props) {

  return (
    <>
      <section className="mb-4 md:mb-6 bg-page-header-bg p-4 md:p-6 mt-0 md:mt-1">
        <div className="container mx-auto">
          {/* 顶部：左信息 + 右操作 */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            {/* 左侧：名字 + Public/Private + Owner（作为一个整体可换行） */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 className="text-white md:text-lg font-semibold break-words whitespace-normal">
                  {group.name}
                </h2>

                {group.isPrivate ? (
                  <span className="inline-flex items-center gap-1 text-white">
                    <LockClosedIcon className="h-4 w-4 text-red" />
                    <span className="text-[11px]">Private</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-white">
                    <LockOpenIcon className="h-4 w-4 text-green" />
                    <span className="text-[11px]">Public</span>
                  </span>
                )}

                {canManageGroup && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-yellow text-yellow">
                    Owner
                  </span>
                )}
              </div>

              {group.description && (
                <p className="mt-2 md:mr-10 text-sm text-white whitespace-pre-line">
                  {group.description}
                </p>
              )}
            </div>

            {/* 右侧：操作按钮（小屏隐藏，大屏单行显示并贴右） */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              {canManageGroup && (
                <>
                  <IconButton
                    className="text-white"
                    title="Edit group"
                    aria-label="Edit group"
                    variant="ghost"
                    size="md"
                    onClick={onEditGroup}
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                  </IconButton>

                  <IconButton
                    title="Delete group"
                    aria-label="Delete group"
                    variant="ghost"
                    className="text-white"
                    size="md"
                    onClick={onDeleteGroup}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </IconButton>
                </>
              )}
              {!canManageGroup && (
                <SubscribeToggleButton
                  groupId={group.id}
                  mode="follow"   // 或 "join" 按你的语义
                  confirmOnLeave
                  className="w-fit"
                  size="md"
                />
              )}

            </div>
          </div>

          {/* 下方“元信息 + 批量操作”保持不变 */}
          <div className="flex justify-between mt-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white">
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow/40 text-white text-xs font-semibold">
                  {(group.creator_name?.[0] || "?").toUpperCase()}
                </span>
                <span>{group.creator_name}</span>
              </span>

              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon className="h-5 w-5" />
                <time dateTime={group.time} className="font-medium">
                  {group.time ? formatDate(group.time) : "—"}
                </time>
              </span>

              {canManageGroup ? (
                <Button
                  onClick={onShowMembers}
                  className="border-white text-white"
                  variant="outline"
                  size="sm"
                  leftIcon={<UserPlusIcon className="h-4 w-4 text-white" />}
                  title="View members"
                >
                  <span className="text-[11px] uppercase tracking-wide">Members</span>
                  <span className="ml-1 font-semibold">{subscriberCount}</span>
                </Button>
              ) : (
                <span>
                  <span className="tracking-wide">Members:</span>
                  <span className="ml-1">{subscriberCount}</span>
                </span>
              )}
            </div>

            <section className="hidden md:flex justify-end gap-2 px-4">
              {selectMode && canManageGroup && (
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
            </section>
          </div>
        </div>
      </section>

    </>
  );
}
