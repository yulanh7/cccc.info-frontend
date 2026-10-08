"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { PencilSquareIcon, TrashIcon, CalendarIcon, PlusIcon } from "@heroicons/react/24/outline";
import CardSkeleton from "@/components/feedback/CardSkeleton";
import type { GroupApi } from "@/app/types";
import type { MyJoinRequest } from "@/app/types/group";
import { joinPolicyOf, isLockedForMe } from "@/app/types/group";
import { useAppSelector } from "@/app/features/hooks";
import JoinRequestModal from "@/components/groups/JoinRequestModal";
import JoinPolicyBadge from "@/components/groups/JoinPolicyBadge";
import InfiniteSentinel from "@/components/ui/InfiniteSentinel";
import { ellipsize } from "@/app/ultility";
import IconButton from "@/components/ui/IconButton";
import SubscribeToggleButton from "@/components/groups/SubscribeToggleButton";
import Button from "@/components/ui/Button";

type Props = {
  title?: string;
  rows: GroupApi[];
  listLoading: boolean;
  pageLoading?: boolean;
  /** 无限滚动 */
  hasMore: boolean;
  loadingMore: boolean;
  loadError?: string | null;
  onLoadMore: () => void;

  // 行为
  onAdd?: () => void;
  canCreate?: boolean;
  onEdit?: (g: GroupApi) => void;
  onDelete?: (id: number) => void;
  canEdit?: (g: GroupApi) => boolean;
  canDelete?: (g: GroupApi) => boolean;

  // 状态
  saving?: boolean;
  deleting?: boolean;

  // 工具
  formatDate: (timestamp: string, showTime?: boolean) => string;
};

export default function GroupListView({
  rows,
  listLoading,
  hasMore,
  loadingMore,
  loadError = null,
  onLoadMore,
  onAdd,
  canCreate,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  saving = false,
  deleting = false,
  formatDate,
}: Props) {
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  // 点了 request 组（我还不是成员）：不进小组，弹出申请框
  const [requestGroupId, setRequestGroupId] = React.useState<number | null>(null);
  // 列表数据是列表页自己存的（不在 store 里）：发出 / 撤回申请后在这里记下，显示时盖上去
  const [requestOverrides, setRequestOverrides] = React.useState<Record<number, MyJoinRequest | null>>({});
  const setMyRequest = (groupId: number, r: MyJoinRequest | null) =>
    setRequestOverrides((prev) => ({ ...prev, [groupId]: r }));
  const withMyRequest = (g: GroupApi): GroupApi =>
    g.id in requestOverrides ? { ...g, my_join_request: requestOverrides[g.id] } : g;
  const requestGroupRow = requestGroupId === null ? null : rows.find((g) => g.id === requestGroupId);
  const requestGroup = requestGroupRow ? withMyRequest(requestGroupRow) : null;

  // 公开小组不需要先关注就能进入；关注用卡片 / 小组页上的 Follow 按钮。
  // request 组的非成员看不到帖子，进去也没用：直接弹出"需要组长批准"和申请按钮
  const handleCardClick = (group: GroupApi) => {
    if (isLockedForMe(group, user)) {
      setRequestGroupId(group.id);
      return;
    }
    router.push(`/groups/${group.id}`);
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
          {rows.map((row) => {
            const group = withMyRequest(row);
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

                    <div className="flex items-center gap-2">
                      <JoinPolicyBadge policy={joinPolicyOf(group)} />
                      {/* 管理者：有待处理的加入申请时提示 */}
                      {(group.pending_request_count ?? 0) > 0 && (
                        <span className="rounded-full bg-red px-1.5 text-[10px] font-semibold text-white" title="Pending join requests">
                          {group.pending_request_count} request{group.pending_request_count === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>

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
                        {onDelete && (canDelete ? canDelete(group) : true) && (
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

                    {/* 创建者不能退出：置灰并提示先转让（title 放外层，禁用按钮在部分浏览器不显示 tooltip）。
                        按钮里的弹窗（申请留言等）也在卡片里：点击和按键都不能冒泡到卡片，否则回车会打开小组页 */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      title={group.is_creator ? "You're the owner. Transfer ownership before leaving." : undefined}
                    >
                      <SubscribeToggleButton
                        groupId={group.id}
                        isMemberHint={group.is_member}
                        mode="follow"
                        disabled={group.is_creator}
                        joinPolicy={joinPolicyOf(group)}
                        myJoinRequest={group.my_join_request}
                        groupName={group.name}
                        onJoinRequestChange={(r) => setMyRequest(group.id, r)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {requestGroup && (
        <JoinRequestModal
          groupId={requestGroup.id}
          groupName={requestGroup.name}
          pending={!!requestGroup.my_join_request}
          onClose={() => setRequestGroupId(null)}
          onSent={(r) => {
            setMyRequest(requestGroup.id, r);
            setRequestGroupId(null);
          }}
          onWithdrawn={() => {
            setMyRequest(requestGroup.id, null);
            setRequestGroupId(null);
          }}
        />
      )}

      {!listLoading && rows.length > 0 && (
        <InfiniteSentinel
          hasMore={hasMore}
          loading={loadingMore}
          error={loadError}
          onLoadMore={onLoadMore}
          endText="No more groups"
        />
      )}




    </div>
  );
}
