"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";

import CustomHeader from "@/components/layout/CustomHeader";
import PageTitle from "@/components/layout/PageTitle";
import LoadingOverlay from "@/components/feedback/LoadingOverLay";
import PostModal from "@/components/posts/PostModal";
import GroupModal from "@/components/groups/GroupModal";
import SubscribersModal from "@/components/groups/SubscribersModal";
import ConfirmModal from "@/components/ConfirmModal";
import GroupInfoBar from "@/components/groups/GroupInfoBar";
import PostsListWithSelect from "@/components/posts/PostsListWithSelect";
import type { GroupProps } from "@/app/types";
import { canEditPost } from "@/app/types/post";
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
import { useConfirm } from "@/hooks/useConfirm";

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
  const user = useAppSelector((s) => s.auth.user);
  const { group, subscriberCount, subscribers, posts, postsPagination, status } =
    useAppSelector((s) => s.groupDetail);

  // —— 本地 UI 状态
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubsModal, setShowSubsModal] = useState(false);
  const [editingPost, setEditingPost] = useState<PostProps | null>(null);


  // 选择模式 & 批量删除
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // —— 通用确认器（删群 / 批量删帖 / 单个删帖）
  const confirmGroupDelete = useConfirm("Are you sure you want to delete this group?");
  const confirmBulkDelete = useConfirm<number[]>("Delete selected posts?");
  const confirmSingleDelete = useConfirm<number>("Delete this post?");

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

  const normalizeVideoUrls = (src: any): string[] => {
    const raw = src?.videoUrls ?? src?.video_urls ?? src?.videoUrl ?? [];
    let list: string[] = [];
    if (Array.isArray(raw)) {
      list = raw;
    } else if (typeof raw === "string") {
      // 允许用户输入用逗号/换行分隔的多个链接
      list = raw.split(/[\n,]+/);
    }
    return list.map(s => String(s).trim()).filter(Boolean);
  };

  const toApiBody = (item: any) => ({
    title: (item.title ?? "").trim(),
    content: `<p>${(item.description ?? "").trim()}</p>`,
    description: item.description ?? "",
    // 只从标准化函数取，确保发送给后端的是 string[]
    video_urls: normalizeVideoUrls(item),
    file_ids: [], // TODO: 上传后替换
  });

  // 保存 PostModal 返回的数据时，先统一标准化，再调用 create/update
  const handlePostModalSave = async (item: PostProps) => {
    setIsPostModalOpen(false);
    const normalized = { ...item, videoUrls: normalizeVideoUrls(item) };
    try {
      if (editingPost) {
        await onEditPost(normalized as PostProps);
      } else {
        await onCreatePost(normalized as PostProps);
      }
    } finally {
      setEditingPost(null);
    }
  };

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
        updatePostThunk({ postId: item.id, body: toApiBody(item), authorNameHint: item.author.firstName })
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

  const onBulkDelete = async (ids: number[]) => {
    if (!safeGroup || ids.length === 0) return;
    await Promise.allSettled(ids.map((id) => dispatch(deletePostThunk(id)).unwrap()));
    setSelectMode(false);
    setSelectedIds(new Set());
    dispatch(fetchGroupPosts({ groupId: safeGroup.id, page: 1, per_page: 20, append: false }));
  };



  const handleEditGroup = () => setShowEditModal(true);

  const submitEditGroup = async (updatedGroup: GroupProps) => {
    const body: CreateOrUpdateGroupBody = {
      name: updatedGroup.title.trim(),
      description: updatedGroup.description.trim(),
      isPrivate: updatedGroup.isPrivate,
    };

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
      {/* {pageLoading ? (
        <TitleSkeleton />
      ) : (
        <PageTitle title={safeGroup?.title} showPageTitle={true} />
      )} */}

      <CustomHeader
        item={headerItem}
        pageTitle={safeGroup?.title || "Group"}
        showAdd={false}
        showEdit={!!safeGroup?.editable}
        showDelete={!!safeGroup?.editable}
        onEdit={handleEditGroup}
        onDelete={() => confirmGroupDelete.ask()}
      />

      {!pageLoading && safeGroup ? (
        <GroupInfoBar
          group={safeGroup}
          subscriberCount={subscriberCount ?? 0}
          onShowMembers={() => setShowSubsModal(true)}
          onNewPost={() => { setEditingPost(null); setIsPostModalOpen(true); }}
          onEditGroup={handleEditGroup}
          onDeleteGroup={() => confirmGroupDelete.ask()}
          selectMode={selectMode}
          selectedCount={selectedIds.size}
          onToggleSelectMode={toggleSelectMode}
          onBulkDeleteSelected={() => {
            const ids = Array.from(selectedIds);
            if (ids.length === 0) return;
            confirmBulkDelete.ask(
              ids,
              `Delete ${ids.length} selected post${ids.length > 1 ? "s" : ""}?`
            );
          }}
          formatDate={formatDate}
        />
      ) : null}
      <div className="container mx-auto md:p-6 p-4 mt-5">
        {/* 群信息条 + 右上角动作（含 Select） */}

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
                selectMode={selectMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                canEdit={(p) => canEditPost(p, user)}
                onDeleteSingle={(postId) => confirmSingleDelete.ask(postId)}
                onEditSingle={(p) => { setEditingPost(p); setIsPostModalOpen(true); }}
                deleting={status.posts === "loading" && safePosts.length > 0}
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

      {showEditModal && (
        <GroupModal
          group={safeGroup ?? undefined}
          onSave={submitEditGroup}
          onClose={() => setShowEditModal(false)}
          isNew={false}
        />
      )}

      {/* 删群确认 */}
      <ConfirmModal
        isOpen={confirmGroupDelete.open}
        message={confirmGroupDelete.message}
        onCancel={confirmGroupDelete.cancel}
        onConfirm={confirmGroupDelete.confirm(async () => {
          await handleDeleteGroup();
        })}
      />

      {/* 批量删帖确认 */}
      <ConfirmModal
        isOpen={confirmBulkDelete.open}
        message={confirmBulkDelete.message}
        onCancel={confirmBulkDelete.cancel}
        onConfirm={confirmBulkDelete.confirm(async (ids) => {
          if (!ids || ids.length === 0) return;
          await onBulkDelete(ids);
        })}
      />

      {/* 单个删帖确认 */}
      <ConfirmModal
        isOpen={confirmSingleDelete.open}
        message={confirmSingleDelete.message}
        onCancel={confirmSingleDelete.cancel}
        onConfirm={confirmSingleDelete.confirm(async (postId) => {
          if (!postId) return;
          await onDeleteSingle(postId);
        })}
      />

      {isPostModalOpen && (
        <PostModal
          item={editingPost ?? undefined}
          isNew={!editingPost}
          onSave={handlePostModalSave}
          onClose={() => { setIsPostModalOpen(false); setEditingPost(null); }}
        />
      )}


      {/* 移动端新增按钮 */}
      {!pageLoading && safeGroup?.editable && (
        <button
          onClick={() => { setEditingPost(null); setIsPostModalOpen(true); }}
          className="fixed md:hidden bottom-8 z-20 left-1/2 -translate-x-1/2 bg-yellow px-3 py-3 rounded-[50%]"
        >
          <PlusIcon className="h-7 w-7 text-white" />
        </button>

      )}
    </>
  );
}
