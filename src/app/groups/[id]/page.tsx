"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";

import CustomHeader from "@/components/layout/CustomHeader";
import PageTitle from "@/components/layout/PageTitle";
import LoadingOverlay from "@/components/feedback/LoadingOverLay";
import PostModal from "@/components/PostModal";
import GroupEditModal from "@/components/groups/GroupEditModal";
import SubscribersModal from "@/components/groups/SubscribersModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import GroupInfoBar from "@/components/groups/GroupInfoBar";
import PostsListWithSelect from "@/components/posts/PostsListWithSelect";

import { formatDate } from "@/app/ultility";
import {
  fetchGroupDetail,
  fetchGroupPosts,
} from "@/app/features/groups/detailSlice";

import {
  createPost,
  updatePost as updatePostThunk,
  deletePost as deletePostThunk,
} from "@/app/features/posts/slice";

import { updateGroup, deleteGroup } from "@/app/features/groups/slice";
import type { CreateOrUpdateGroupBody } from "@/app/types/group";
import type { PostProps } from "@/app/types";

import { PlusIcon } from "@heroicons/react/24/outline";

/** 轻量骨架 */
function TitleSkeleton() {
  return (
    <div className="mx-auto lg:container px-4 pt-2">
      <div className="h-7 w-48 md:w-64 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}

export default function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const groupId = useMemo(() => Number(id), [id]);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { group, subscriberCount, subscribers, posts, postsPagination, status } =
    useAppSelector((s) => s.groupDetail);

  // —— 本地 UI 状态
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSubsModal, setShowSubsModal] = useState(false);

  // 选择模式 & 批量删除
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // —— 帖子“首次加载”检测（决定是否显示初次骨架 vs 空态）
  const [postsFetchStarted, setPostsFetchStarted] = useState(false);
  const [postsEverLoaded, setPostsEverLoaded] = useState(false);
  useEffect(() => {
    setPostsFetchStarted(false);
    setPostsEverLoaded(false);
  }, [groupId]);
  useEffect(() => {
    if (postsFetchStarted && status.posts !== "loading") setPostsEverLoaded(true);
  }, [postsFetchStarted, status.posts]);

  // —— 拉取数据
  useEffect(() => {
    if (!Number.isFinite(groupId)) return;
    dispatch(fetchGroupDetail(groupId));
    dispatch(fetchGroupPosts({ groupId, page: 1, per_page: 20, append: false }));
    setPostsFetchStarted(true);
  }, [dispatch, groupId]);

  // —— 防止“旧群数据闪现”：仅在 id 匹配时认为有效
  const groupMatchesRoute = group?.id === groupId;
  const safeGroup = groupMatchesRoute ? group : null;
  const safePosts = groupMatchesRoute ? posts : [];
  const safePagination = groupMatchesRoute ? postsPagination : null;

  // —— 加载态（整页 VS 帖子局部）
  const pageLoading = !groupMatchesRoute || status.group === "loading";
  const postsLoading = status.posts === "loading" && groupMatchesRoute;

  // ====== helper：把 Modal 的 PostProps 构造成 API body ======
  const toApiBody = (item: PostProps) => ({
    title: item.title?.trim() ?? "",
    content: `<p>${(item.description ?? "").trim()}</p>`,
    description: item.description ?? "",
    video_urls: item.videoUrl ? [item.videoUrl] : [],
    file_ids: [], // 之后接入上传后填充
  });

  // ====== 新建 / 编辑 / 删除（单个） / 批量删除 ======
  const onCreatePost = async (item: PostProps) => {
    if (!safeGroup) return;
    try {
      await dispatch(
        createPost({
          groupId: safeGroup.id,
          body: toApiBody(item),
          authorNameHint: safeGroup.creator?.firstName || "",
        })
      ).unwrap();
      dispatch(fetchGroupPosts({ groupId: safeGroup.id, page: 1, per_page: 20, append: false }));
    } catch (e: any) {
      alert(e?.message || "Create post failed");
    }
  };

  const onEditPost = async (item: PostProps) => {
    try {
      await dispatch(
        updatePostThunk({ postId: item.id, body: toApiBody(item), authorNameHint: item.author })
      ).unwrap();
      if (safeGroup) {
        dispatch(fetchGroupPosts({ groupId: safeGroup.id, page: 1, per_page: 20, append: false }));
      }
    } catch (e: any) {
      alert(e?.message || "Update post failed");
    }
  };

  const onDeleteSingle = async (postId: number) => {
    try {
      await dispatch(deletePostThunk(postId)).unwrap();
      if (safeGroup) {
        dispatch(fetchGroupPosts({ groupId: safeGroup.id, page: 1, per_page: 20, append: false }));
      }
    } catch (e: any) {
      alert(e?.message || "Delete post failed");
    }
  };

  const onBulkDelete = async () => {
    if (!safeGroup || selectedIds.size === 0) {
      setShowBulkDeleteConfirm(false);
      return;
    }
    const ids = Array.from(selectedIds);
    try {
      await Promise.allSettled(ids.map((id) => dispatch(deletePostThunk(id)).unwrap()));
      setSelectMode(false);
      setSelectedIds(new Set());
      dispatch(fetchGroupPosts({ groupId: safeGroup.id, page: 1, per_page: 20, append: false }));
    } finally {
      setShowBulkDeleteConfirm(false);
    }
  };

  const handleSavePost = (item: PostProps) => {
    setIsPostModalOpen(false);
    // 需要编辑时，在打开 PostModal 时把要编辑的 item 传进去并在这里分支
    onCreatePost(item);
  };

  const handleEditGroup = () => setShowEditModal(true);

  const submitEditGroup = async (body: CreateOrUpdateGroupBody) => {
    if (!safeGroup) return;
    try {
      const updated = await dispatch(updateGroup({ groupId: safeGroup.id, body })).unwrap();
      await dispatch(fetchGroupDetail(updated.id)); // 方案A：服务端权威刷新
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
    if (!safePagination || !safeGroup) return;
    const next = safePagination.current_page + 1;
    if (next <= safePagination.total_pages) {
      dispatch(fetchGroupPosts({ groupId: safeGroup.id, page: next, per_page: 20, append: true }));
    }
  };

  // 选择模式
  const toggleSelectMode = () => {
    if (selectMode) setSelectedIds(new Set());
    setSelectMode((v) => !v);
  };
  const toggleSelect = (postId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const headerItem = safeGroup
    ? { id: safeGroup.id, author: safeGroup.creator?.firstName }
    : undefined;

  const initialPostsLoading = postsLoading && !postsEverLoaded && postsFetchStarted;

  return (
    <>
      {/* 标题 */}
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
        {/* 群信息条 + 右上角动作（含 Select） */}
        {!pageLoading && safeGroup ? (
          <GroupInfoBar
            group={safeGroup}
            subscriberCount={subscriberCount ?? 0}
            onShowMembers={() => setShowSubsModal(true)}
            onNewPost={() => setIsPostModalOpen(true)}
            onEditGroup={handleEditGroup}
            onDeleteGroup={() => setShowDeleteConfirm(true)}
            // 选择模式控制放到这里
            selectMode={selectMode}
            selectedCount={selectedIds.size}
            onToggleSelectMode={toggleSelectMode}
            onBulkDeleteSelected={() => setShowBulkDeleteConfirm(true)}
            formatDate={formatDate}
          />
        ) : null}

        {/* 帖子列表（仅局部刷新） */}
        <section className="relative mt-4">
          {initialPostsLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="card p-3">
                <div className="h-5 w-36 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="card p-3">
                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          )}

          {!initialPostsLoading && (
            <>
              {/* 二次加载/翻页时的小提示 */}
              {postsLoading && postsEverLoaded && (
                <div className="sticky top-[72px] z-10 mb-2 flex items-center gap-2 text-xs text-dark-gray">
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Updating posts…
                </div>
              )}

              <PostsListWithSelect
                rows={safePosts}
                listLoading={status.posts === "loading" && safePosts.length === 0}
                // 选择模式（受控）
                selectMode={selectMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                // 单删（选择模式关闭时才出现）
                canEdit={() => Boolean(safeGroup?.editable)}
                onDeleteSingle={onDeleteSingle}
                deleting={status.posts === "loading" && safePosts.length > 0}
                // 分页（可选）
                hasMore={Boolean(
                  safePagination &&
                  safePagination.current_page < safePagination.total_pages
                )}
                loadMore={loadMore}
                loadingMore={status.posts === "loading" && safePosts.length > 0}
                formatDate={formatDate}
              />
            </>
          )}
        </section>
      </div>

      {/* —— 整页 Overlay（群详情加载） */}
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

      {/* 批量删除确认 */}
      <DeleteConfirmModal
        isOpen={showBulkDeleteConfirm}
        onConfirm={onBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
        message={`Delete ${selectedIds.size} selected post(s)?`}
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
      {!pageLoading && safeGroup?.editable && (
        <button
          onClick={() => setIsPostModalOpen(true)}
          className="fixed md:hidden bottom-8 z-20 left-1/2 -translate-x-1/2 bg-yellow px-3 py-3 rounded-[50%]"
        >
          <PlusIcon className="h-7 w-7 text-white" />
        </button>
      )}
    </>
  );
}
