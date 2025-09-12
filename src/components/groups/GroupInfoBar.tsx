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
      <section className="mb-4 md:mb-6 bg-page-header-bg p-4 md:p-6 mt-0 md:mt-1 ">
        <div className="container mx-auto">

          <div className="flex items-start justify-between gap-3">
            <div>
              {/* 标题 + Owner 徽标（如果可管理） */}
              <div className="flex items-center gap-4">
                <h2 className="text-white md:text-lg font-semibold">
                  {group.name}
                </h2>
                {canManageGroup && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-yellow text-yellow">
                    Owner
                  </span>
                )}
                {group.isPrivate ? (
                  <div className="flex items-center gap-1 text-white">
                    <LockClosedIcon className="h-4 w-4 text-red" />
                    <span className="text-[11px]">Private</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-white">
                    <LockOpenIcon className="h-4 w-4 text-green" />
                    <span className="text-[11px]">Public</span>
                  </div>

                )}
              </div>

              {group.description && (
                <p className="my-2 md:mr-10  text-sm text-white whitespace-pre-line">{group.description}</p>
              )}
            </div>

            {/* 桌面端右上角操作，仅创建者可见 */}
            {canManageGroup && (
              <div className="hidden md:flex items-center gap-2">
                <IconButton
                  className="text-white"
                  title="Edit group"
                  aria-label="Edit group"
                  variant="ghost"
                  // tone="brand"
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
                  // tone="brand"
                  size="md"
                  onClick={onDeleteGroup}
                >
                  <TrashIcon className="h-5 w-5" />
                </IconButton>
              </div>
            )}
          </div>

          {/* 元信息 */}
          <div className="flex justify-between mt-3">

            <div className=" flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white">
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
                  <span className="text-[11px] uppercase tracking-wide">
                    Members
                  </span>
                  <span className="ml-1 font-semibold">{subscriberCount}</span>
                </Button>
              ) : (
                <span>
                  <span className="tracking-wide">
                    Members:
                  </span>
                  <span className="ml-1 ">{subscriberCount}</span>
                </span>
              )}

            </div>
            <section className="hidden md:flex justify-end gap-2 px-4">
              {/* <Button
            onClick={onToggleSelectMode}
            variant={selectMode ? "warning" : "outline"}
            size="sm"
            leftIcon={<CheckCircleIcon className="h-5 w-5" />}
            active={selectMode}
          >
            {selectMode ? "Cancel" : "Select Posts"}
          </Button> */}

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

              {canShowCreateFab && (
                <Button
                  onClick={onNewPost}
                  variant="primary"
                  leftIcon={<PlusIcon className="h-5 w-5" />}
                >
                  New Post
                </Button>
              )}
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
