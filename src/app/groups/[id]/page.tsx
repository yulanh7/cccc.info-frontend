"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";

import CustomHeader from "@/components/layout/CustomHeader";
import PageTitle from "@/components/layout/PageTitle";
import LoadingOverlay from "@/components/feedback/LoadingOverLay";
import Post from "@/components/Post";
import PostModal from "@/components/PostModal";
import GroupEditModal from "@/components/groups/GroupEditModal";
import SubscribersModal from "@/components/groups/SubscribersModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

import { formatDate } from "@/app/ultility";
import {
  fetchGroupDetail,
  fetchGroupPosts,
} from "@/app/features/groups/detailSlice";
import { updateGroup, deleteGroup } from "@/app/features/groups/slice";
import type { CreateOrUpdateGroupBody } from "@/app/types/group";
import type { PostProps } from "@/app/types";

import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

function IconBtn({
  title,
  children,
  onClick,
  disabled = false,
  intent = "default",
}: {
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  intent?: "default" | "danger";
}) {
  const base =
    "inline-flex items-center justify-center rounded-md border px-2.5 py-2 transition-colors";
  const color =
    intent === "danger"
      ? "border-red/50 hover:bg-red/10 text-red"
      : "border-border hover:bg-white/5 text-foreground";
  const state = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";
  return (
    <button
      type="button"
      aria-label={title}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${color} ${state}`}
    >
      {children}
    </button>
  );
}

/** 屏幕是否 >= md */
function useIsMdUp() {
  const [isMd, setIsMd] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const on = () => setIsMd(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return isMd;
}

/** 轻量骨架 & 空态 */
function TitleSkeleton() {
  return (
    <div className="mx-auto lg:container px-4 pt-2">
      <div className="h-7 w-48 md:w-64 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}
function GroupInfoSkeleton() {
  return (
    <section className="mb-4 md:mb-6 rounded-xl border border-border bg-bg p-4 md:p-6">
      <div className="h-4 w-3/4 md:w-2/3 bg-gray-200 rounded animate-pulse mb-3" />
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-6 w-6 rounded-full bg-gray-200 animate-pulse" />
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-28 rounded-md bg-gray-200 animate-pulse" />
      </div>
    </section>
  );
}
function PostCardSkeleton() {
  return (
    <div className="rounded-sm border border-border p-3">
      <div className="h-28 md:h-40 w-full bg-gray-200 rounded animate-pulse mb-3" />
      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
      <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}
function EmptyPostsState({
  canCreate,
  onCreate,
}: {
  canCreate: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="rounded-sm border border-dashed border-border p-6 text-center">
      <p className="text-sm text-dark-gray">No posts yet.</p>
      {canCreate && (
        <button
          onClick={onCreate}
          className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border hover:bg-bg"
        >
          Create first post
        </button>
      )}
    </div>
  );
}

export default function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const groupId = useMemo(() => Number(id), [id]);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isMdUp = useIsMdUp();

  const { group, subscriberCount, subscribers, posts, postsPagination, status } =
    useAppSelector((s) => s.groupDetail);

  // —— 本地 UI 状态
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSubsModal, setShowSubsModal] = useState(false);

  // —— 帖子“首次加载”检测，用于骨架/轻提示策略
  const [postsFetchStarted, setPostsFetchStarted] = useState(false);
  const [postsEverLoaded, setPostsEverLoaded] = useState(false);
  useEffect(() => {
    // 切换群时重置帖子加载标记，避免沿用上一个群的状态
    setPostsFetchStarted(false);
    setPostsEverLoaded(false);
  }, [groupId]);
  useEffect(() => {
    if (postsFetchStarted && status.posts !== "loading") setPostsEverLoaded(true);
  }, [postsFetchStarted, status.posts]);

  // —— 拉取数据（切换群时会触发）
  useEffect(() => {
    if (!Number.isFinite(groupId)) return;
    dispatch(fetchGroupDetail(groupId));
    dispatch(fetchGroupPosts({ groupId, page: 1, per_page: 20, append: false }));
    setPostsFetchStarted(true);
  }, [dispatch, groupId]);

  // —— 防止“旧群数据闪现”：仅在 id 匹配时才认为 group “生效”
  const groupMatchesRoute = group?.id === groupId;
  const safeGroup = groupMatchesRoute ? group : null;
  const safePosts = groupMatchesRoute ? posts : [];
  const safePagination = groupMatchesRoute ? postsPagination : null;

  // —— 加载态：整页 VS 帖子局部
  const pageLoading = !groupMatchesRoute || status.group === "loading";
  const postsLoading = status.posts === "loading" && groupMatchesRoute;

  // —— 事件
  const handleEditGroup = () => setShowEditModal(true);

  const submitEditGroup = async (body: CreateOrUpdateGroupBody) => {
    if (!safeGroup) return;
    try {
      const updated = await dispatch(updateGroup({ groupId: safeGroup.id, body })).unwrap();
      // 采用方案A：更新成功后强制重拉详情（确保服务端权威数据）
      await dispatch(fetchGroupDetail(updated.id));
      setShowEditModal(false);
    } catch (e: any) {
      alert(e?.message || "Update group failed");
    }
  };

  const handleDeleteGroup = async () => {
    if (!safeGroup) return;
    try {
      await dispatch(deleteGroup(safeGroup.id)).unwrap();
      setShowDeleteConfirm(false);
      router.push("/groups");
    } catch (e: any) {
      alert(e?.message || "Delete group failed");
    }
  };

  const loadMore = () => {
    if (!safePagination) return;
    const next = safePagination.current_page + 1;
    if (next <= safePagination.total_pages) {
      dispatch(fetchGroupPosts({ groupId, page: next, per_page: 20, append: true }));
    }
  };

  const handleSavePost = (item: PostProps) => {
    if (!Number.isFinite(groupId)) return;
    setIsPostModalOpen(false);
    // 仅刷新帖子，不动整页
    dispatch(fetchGroupPosts({ groupId, page: 1, per_page: 20, append: false }));
  };

  const headerItem = safeGroup
    ? { id: safeGroup.id, author: safeGroup.creator?.firstName }
    : undefined;

  return (
    <>
      {/* 标题：整页 loading 时用 skeleton（也会被 Overlay 遮住） */}
      {pageLoading ? (
        <TitleSkeleton />
      ) : (
        <PageTitle title={safeGroup?.title} showPageTitle={true} />
      )}

      <CustomHeader
        item={headerItem}
        pageTitle={safeGroup?.title || "Group"}
        showAdd={false}
        showEdit={!!safeGroup?.editable}
        showDelete={!!safeGroup?.editable}
        onEdit={handleEditGroup}
        onDelete={() => setShowDeleteConfirm(true)}
      />

      <div className="container mx-auto md:p-6 p-4 mt-14">
        {/* 群信息卡片 */}
        {pageLoading ? (
          <GroupInfoSkeleton />
        ) : (
          <section className="mb-4 md:mb-6 rounded-xl border border-border bg-bg p-4 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                {safeGroup?.description && (
                  <p className="mt-1 text-sm text-dark-gray">{safeGroup.description}</p>
                )}
              </div>

              <div className="hidden md:flex items-center gap-2">
                {safeGroup?.editable && (
                  <>
                    <IconBtn title="New post" onClick={() => setIsPostModalOpen(true)}>
                      <PlusIcon className="h-5 w-5" />
                    </IconBtn>
                    <IconBtn title="Edit group" onClick={handleEditGroup}>
                      <PencilIcon className="h-5 w-5" />
                    </IconBtn>
                    <IconBtn
                      title="Delete group"
                      onClick={() => setShowDeleteConfirm(true)}
                      intent="danger"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </IconBtn>
                  </>
                )}
              </div>
            </div>

            {/* 元信息 */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-dark-gray">
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-dark-green/10 text-dark-green text-xs font-semibold">
                  {(safeGroup?.creator?.firstName?.[0] || "?").toUpperCase()}
                </span>
                <span className="font-medium">{safeGroup?.creator?.firstName || "—"}</span>
                <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-wide rounded border border-border text-dark-gray/70">
                  Creator
                </span>
              </span>

              <span className="text-border">•</span>

              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon className="h-5 w-5" />
                <time dateTime={safeGroup?.createdDate || ""} className="font-medium">
                  {safeGroup?.createdDate ? formatDate(safeGroup.createdDate) : "—"}
                </time>
              </span>

              <span className="text-border">•</span>

              <button
                onClick={() => setShowSubsModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border hover:bg-white/5"
                aria-label="View members"
                title="View members"
              >
                <UserPlusIcon className="h-4 w-4" />
                <span className="text-[11px] uppercase tracking-wide text-dark-gray/70">Members</span>
                <span className="font-semibold">{subscriberCount ?? 0}</span>
              </button>
            </div>
          </section>
        )}

        {/* 帖子列表（智能加载，且仅局部） */}
        <section className="relative">
          {(() => {
            const isInitialPostsLoading =
              postsLoading && !postsEverLoaded && postsFetchStarted;

            if (isInitialPostsLoading) {
              const skeletonCount = isMdUp ? 2 : 1;
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-8">
                  {Array.from({ length: skeletonCount }).map((_, i) => (
                    <PostCardSkeleton key={i} />
                  ))}
                </div>
              );
            }

            if (!isInitialPostsLoading && safePosts.length === 0) {
              return (
                <EmptyPostsState
                  canCreate={Boolean(safeGroup?.editable)}
                  onCreate={() => setIsPostModalOpen(true)}
                />
              );
            }

            return (
              <>
                {postsLoading && postsEverLoaded && (
                  <div className="sticky top-[72px] z-10 mb-2 flex items-center gap-2 text-xs text-dark-gray">
                    <span className="inline-block h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Updating posts…
                  </div>
                )}

                <div className="columns-2 gap-1 md:columns-2 lg:columns-3 md:gap-8">
                  {safePosts.map((post) => (
                    <div className="break-inside-avoid mb-2 md:mb-8" key={post.id}>
                      <Post post={post} />
                    </div>
                  ))}
                </div>

                {safePagination &&
                  safePagination.current_page < safePagination.total_pages && (
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={loadMore}
                        disabled={postsLoading}
                        className="px-4 py-2 rounded-md border border-border hover:bg-bg disabled:opacity-60"
                      >
                        {postsLoading ? "Loading…" : "Load more"}
                      </button>
                    </div>
                  )}
              </>
            );
          })()}
        </section>
      </div>

      {/* —— 整页 Overlay（群详情 loading 或 id 未匹配时） */}
      <LoadingOverlay show={pageLoading} text="Loading group…" />

      {/* —— 弹窗们 */}
      <SubscribersModal
        open={showSubsModal}
        onClose={() => setShowSubsModal(false)}
        subscribers={subscribers}
        title="Subscribers"
      />

      <GroupEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        group={safeGroup ?? undefined}
        onSubmit={submitEditGroup}
      />

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onConfirm={handleDeleteGroup}
        onCancel={() => setShowDeleteConfirm(false)}
        message="Are you sure you want to delete this group?"
      />

      {isPostModalOpen && (
        <PostModal
          item={undefined}
          isNew={true}
          onSave={handleSavePost}
          onClose={() => setIsPostModalOpen(false)}
        />
      )}

      {/* 移动端新增按钮 */}
      <button
        onClick={() => setIsPostModalOpen(true)}
        className="fixed md:hidden bottom-8 z-20 left-1/2 -translate-x-1/2 bg-yellow px-3 py-3 rounded-[50%]"
      >
        <PlusIcon className="h-7 w-7 text-white" />
      </button>
    </>
  );
}
