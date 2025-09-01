"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import CustomHeader from "@/components/layout/CustomHeader";
import LoadingOverlay from "@/components/feedback/LoadingOverLay";
import PostModal from "@/components/posts/PostModal";
import GroupModal from "@/components/groups/GroupModal";
import SubscribersModal from "@/components/groups/SubscribersModal";
import ConfirmModal from "@/components/ConfirmModal";
import GroupInfoBar from "@/components/groups/GroupInfoBar";
import PostsListWithSelect from "@/components/posts/PostsListWithSelect";
import type { GroupProps } from "@/app/types";
import { canEditPost } from "@/app/types/post";
import { formatDate, mapApiErrorToFields } from "@/app/ultility";
import {
  fetchGroupDetail,
  fetchGroupPosts,
  fetchGroupMembers,
  addGroupMember,
  kickGroupMember,
} from "@/app/features/groups/detailSlice";

import {
  createPost,
  deletePost as deletePostThunk,
} from "@/app/features/posts/slice";
import { updateGroup, deleteGroup } from "@/app/features/groups/slice";
import type { CreateOrUpdateGroupBody } from "@/app/types/group";
import { toCreateRequest, type CreatePostFormModel } from "@/app/types/post";

import { PlusIcon } from "@heroicons/react/24/outline";
import { useConfirm } from "@/hooks/useConfirm";

const POST_PER_PAGE = 9;
const MEMBERS_PER_PAGE = 9;


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
  const [modalSaving, setModalSaving] = useState(false);
  const [modalErrors, setModalErrors] = useState<{ title?: string; description?: string } | null>(null);


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
    dispatch(fetchGroupPosts({ groupId, page: 1, per_page: POST_PER_PAGE, append: false }));
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

  const toMsg = (err: unknown) =>
    typeof err === 'string' ? err : (err as any)?.message || '';


  // 保存 PostModal 返回的数据时，先统一标准化，再调用 create/update
  const handlePostModalSave = async (form: CreatePostFormModel) => {
    setIsPostModalOpen(false);
    if (!safeGroup) return;
    try {
      const body = toCreateRequest({
        title: form.title?.trim() ?? "",
        contentHtml: form.contentHtml ?? "",
        description: form.description ?? "",
        videos: form.videos ?? [],
        fileIds: form.fileIds ?? [],
      });
      await dispatch(
        createPost({
          groupId: safeGroup.id,
          body,
          authorNameHint: safeGroup.creator?.firstName || "",
        })
      ).unwrap();
      // 新建成功后刷新列表
      dispatch(fetchGroupPosts({ groupId: safeGroup.id, page: 1, per_page: POST_PER_PAGE, append: false }));
    } catch (e: any) {
      alert(toMsg(e) || "Create post failed");
    }
  };

  // ====== 新建 / 编辑 / 删除（单个） / 批量删除 ======
  const onCreatePost = async (item: CreatePostFormModel) => {
    if (!safeGroup) return;
    try {
      await dispatch(
        createPost({
          groupId: safeGroup.id,
          body: toCreateRequest(item),
          authorNameHint: safeGroup.creator?.firstName || "",
        })
      ).unwrap();
      dispatch(fetchGroupPosts({ groupId: safeGroup.id, page: 1, per_page: POST_PER_PAGE, append: false }));
    } catch (e: any) {
      alert(toMsg(e) || "Create post failed");
    }
  };



  const onDeleteSingle = async (postId: number) => {
    try {
      await dispatch(deletePostThunk(postId)).unwrap();
      if (safeGroup) {
        dispatch(fetchGroupPosts({ groupId: safeGroup.id, page: 1, per_page: POST_PER_PAGE, append: false }));
      }
    } catch (e: any) {
      alert(toMsg(e) || "Delete post failed");
    }
  };

  const onBulkDelete = async (ids: number[]) => {
    if (!safeGroup || ids.length === 0) return;
    await Promise.allSettled(ids.map((id) => dispatch(deletePostThunk(id)).unwrap()));
    setSelectMode(false);
    setSelectedIds(new Set());
    dispatch(fetchGroupPosts({ groupId: safeGroup.id, page: 1, per_page: POST_PER_PAGE, append: false }));
  };



  const handleEditGroup = () => setShowEditModal(true);

  const submitEditGroup = async (updatedGroup: GroupProps) => {
    if (!safeGroup) return;

    setModalErrors(null);
    setModalSaving(true);

    const body: CreateOrUpdateGroupBody = {
      name: updatedGroup.title.trim(),
      description: (updatedGroup.description ?? "").replace(/\r\n/g, "\n"),
      isPrivate: updatedGroup.isPrivate,
    };

    try {
      const updated = await dispatch(updateGroup({ groupId: safeGroup.id, body })).unwrap();
      await dispatch(fetchGroupDetail(updated.id));
      setShowEditModal(false);
    } catch (e: any) {
      const msg = e?.message as string | undefined;
      const fieldErrors = mapApiErrorToFields(msg);
      if (fieldErrors.title || fieldErrors.description) {
        setModalErrors(fieldErrors);
      } else {
        alert(msg || "Update group failed");
      }
    } finally {
      setModalSaving(false);
    }
  };


  const handleDeleteGroup = async () => {
    if (!safeGroup) return;
    try {
      await dispatch(deleteGroup(safeGroup.id)).unwrap();
      router.push("/groups");
    } catch (e: any) {
      alert(toMsg(e) || "Delete group failed");
    }
  };

  const loadMore = () => {
    if (!safePagination || !safeGroup) return;
    const next = safePagination.current_page + 1;
    if (next <= safePagination.total_pages) {
      dispatch(fetchGroupPosts({ groupId: safeGroup.id, page: next, per_page: POST_PER_PAGE, append: true }));
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

  // 打开成员弹窗
  const onShowMembers = () => {
    if (!safeGroup) return;
    // 初次打开拉第一页
    dispatch(fetchGroupMembers({ groupId: safeGroup.id, page: 1, per_page: MEMBERS_PER_PAGE }));
    setShowSubsModal(true);
  };

  const onMembersPageChange = (page: number) => {
    if (!safeGroup) return;
    dispatch(fetchGroupMembers({ groupId: safeGroup.id, page, per_page: MEMBERS_PER_PAGE }));
  };

  // 仅群主/管理员可管理（你项目里已有 safeGroup.editable 判定）
  const canManageMembers = !!safeGroup?.editable || !!user?.admin;

  const membersPagination = useAppSelector((s) => s.groupDetail.membersPagination);
  const membersLoading = useAppSelector(s => s.groupDetail.status.members) === 'loading';

  const onAddMember = async (input: string) => {
    if (!safeGroup) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    const payload: { groupId: number; user_id?: number; email?: string } = { groupId: safeGroup.id };
    const maybeId = Number(trimmed);
    if (Number.isFinite(maybeId) && String(maybeId) === trimmed) {
      payload.user_id = maybeId;
    } else {
      payload.email = trimmed;
    }
    try {
      await dispatch(addGroupMember(payload)).unwrap();
      dispatch(fetchGroupMembers({ groupId: safeGroup.id, page: 1, per_page: MEMBERS_PER_PAGE }));
    } catch (e: any) {
      alert(toMsg(e) || "Add member failed");
    }
  };

  const onKickMember = async (userId: number) => {
    if (!safeGroup) return;
    try {
      await dispatch(kickGroupMember({ groupId: safeGroup.id, userId })).unwrap();
      // 刷新当前页保持数据一致
      const p = membersPagination?.page ?? 1;
      dispatch(fetchGroupMembers({ groupId: safeGroup.id, page: p, per_page: MEMBERS_PER_PAGE }));
    } catch (e: any) {
      alert(toMsg(e) || "Kick member failed");
    }
  };


  const headerItem = safeGroup
    ? { id: safeGroup.id, author: safeGroup.creator?.firstName }
    : undefined;

  const initialPostsLoading = postsLoading && !postsEverLoaded && postsFetchStarted;

  return (
    <>
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
          onShowMembers={onShowMembers}
          onNewPost={() => setIsPostModalOpen(true)}
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
      <div className="container mx-auto md:p-6 p-2">
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
                onEditSingle={(id) => router.push(`/posts/${id}?edit=1`)}
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

      <SubscribersModal
        open={showSubsModal}
        onClose={() => setShowSubsModal(false)}
        members={subscribers}
        pagination={membersPagination}
        loading={membersLoading}
        canManage={canManageMembers}
        onPageChange={onMembersPageChange}
        onAdd={canManageMembers ? onAddMember : undefined}
        onKick={canManageMembers ? onKickMember : undefined}
        title="Subscribers"
      />


      {showEditModal && (
        <GroupModal
          group={safeGroup ?? undefined}
          isNew={false}
          onSave={submitEditGroup}
          onClose={() => setShowEditModal(false)}
          saving={modalSaving}
          externalErrors={modalErrors}
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
          item={undefined}
          isNew={true}
          onSave={handlePostModalSave}
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
