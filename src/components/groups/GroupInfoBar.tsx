"use client";

import React from "react";
import {
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  CalendarIcon,
  UserPlusIcon,
  MegaphoneIcon,
  ChatBubbleLeftIcon
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import type { GroupApi } from "@/app/types/group";
import { joinPolicyOf } from "@/app/types/group";
import JoinPolicyBadge from "@/components/groups/JoinPolicyBadge";
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
  canDeleteGroup?: boolean;
  canShowCreateFab: boolean;
  selectMode: boolean;
  selectedCount: number;
  onToggleSelectMode: () => void;
  onBulkDeleteSelected: () => void;
  /** 管理者：打开加入申请列表（request 组，或还有待处理申请时显示按钮） */
  onShowJoinRequests?: () => void;
  /** 申请状态过时（例如撤回时发现已经被处理）→ 重新拉小组 */
  onGroupStale?: () => void;
};

export default function GroupInfoBar({
  group,
  subscriberCount,
  onShowMembers,
  onEditGroup,
  onDeleteGroup,
  formatDate,
  selectMode,
  selectedCount,
  onBulkDeleteSelected,
  canManageGroup = false,
  canDeleteGroup = false,
  canShowCreateFab = false,
  onShowJoinRequests,
  onGroupStale,
}: Props) {
  const pendingRequests = group.pending_request_count ?? 0;
  const showJoinRequests =
    canManageGroup && !!onShowJoinRequests && (joinPolicyOf(group) === "request" || pendingRequests > 0);

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

                <JoinPolicyBadge policy={joinPolicyOf(group)} onDark />

                {/* 发帖权限：仅 leaders_only 时提示，members 为默认不显示 */}
                {group.post_policy === "leaders_only" && (
                  <span
                    className="inline-flex items-center gap-1 text-white"
                    title="Only group leaders can create posts in this group"
                  >
                    <MegaphoneIcon className="h-4 w-4 text-yellow" />
                    <span className="text-[11px]">Leaders post only</span>
                  </span>
                )}

                {/* 评论权限：仅小组默认为 leaders_only 时提示 */}
                {group.comment_policy === "leaders_only" && (
                  <span
                    className="inline-flex items-center gap-1 text-white"
                    title="By default, only group leaders can comment on posts in this group"
                  >
                    <ChatBubbleLeftIcon className="h-4 w-4 text-yellow" />
                    <span className="text-[11px]">Leaders comment only</span>
                  </span>
                )}

                {group.is_creator ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-yellow text-yellow">
                    Owner
                  </span>
                ) : group.is_leader ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-yellow text-yellow">
                    Leader
                  </span>
                ) : null}
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
              )}
              {/* 删除小组：仅 admin / 创建者，组长不行 */}
              {canDeleteGroup && (
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
              )}
              {/* 创建者不能退出；组长和普通成员保留订阅/退出按钮 */}
              {!group.is_creator && (
                <SubscribeToggleButton
                  groupId={group.id}
                  mode="follow"
                  isMemberHint={group.is_member}
                  confirmOnLeave
                  className="w-fit"
                  size="md"
                  joinPolicy={joinPolicyOf(group)}
                  myJoinRequest={group.my_join_request}
                  groupName={group.name}
                  onStale={onGroupStale}
                  onDark
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

              {showJoinRequests && (
                <Button
                  onClick={onShowJoinRequests}
                  className="border-white text-white"
                  variant="outline"
                  size="sm"
                  title="Review join requests"
                >
                  <span className="text-[11px] uppercase tracking-wide">Join requests</span>
                  <span className="ml-1 font-semibold">{pendingRequests}</span>
                  {pendingRequests > 0 && <span className="ml-1 h-2 w-2 rounded-full bg-red" aria-hidden />}
                </Button>
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
