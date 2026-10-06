"use client";
import { Suspense } from "react";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import CustomHeader from "@/components/layout/CustomHeader";
import LoadingOverlay from "@/components/feedback/LoadingOverLay";
import PostModal from "@/components/posts/PostModal";
import GroupModal from "@/components/groups/GroupModal";
import SubscribersModal from "@/components/groups/SubscribersModal";
import type { Subscriber } from "@/components/groups/SubscribersModal";
import TransferOwnershipModal from "@/components/groups/TransferOwnershipModal";
import ConfirmModal from "@/components/ConfirmModal";
import GroupInfoBar from "@/components/groups/GroupInfoBar";
import PostListSection from "@/components/posts/PostListSection";
import { usePostListController } from "@/components/posts/usePostListController";
import type { GroupApi } from "@/app/types";
import { formatDate, mapApiErrorToFields } from "@/app/ultility";
import {
  fetchGroupDetail,
  fetchGroupMembers,
  addGroupMember,
  kickGroupMember,
  addGroupLeader,
  removeGroupLeader,
  fetchGroupLeaders,
  transferGroupOwnership,
} from "@/app/features/groups/detailSlice";
import { fetchGroupPostsList, createPost, deletePost as deletePostThunk } from "@/app/features/posts/slice";
import { updateGroup, deleteGroup } from "@/app/features/groups/slice";
import type { CreateOrUpdateGroupBody } from "@/app/types/group";
import { isPostAuthor, canEditPost, canDeletePost, canWritePosts, canEditGroup, canDeleteGroup, canTransferOwnership } from "@/app/types";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useConfirm } from "@/hooks/useConfirm";
import { POSTS_PER_PAGE, MEMBERS_PER_PAGE } from "@/app/constants";
import SubscribeToggleButton from "@/components/groups/SubscribeToggleButton";

export default function GroupDetailPage() {
  return (
    <Suspense fallback={<LoadingOverlay show text="Loading groups…" />}>
      <GroupDetailPageInner />
    </Suspense>
  );
}

function GroupDetailPageInner() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Memoized values
  const groupId = useMemo(() => Number(id), [id]);
  const currentPage = useMemo(() => {
    const p = Number(searchParams.get("page"));
    return Number.isFinite(p) && p > 0 ? p : 1;
  }, [searchParams]);

  // Mount state
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Redux state
  const user = useAppSelector((s) => s.auth.user);
  const { group, subscriberCount, subscribers, posts, postsPagination, status, membersPagination } = useAppSelector((s) => s.groupDetail);

  // UI state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubsModal, setShowSubsModal] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalErrors, setModalErrors] = useState<{ title?: string; description?: string } | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferCandidates, setTransferCandidates] = useState<Subscriber[]>([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Confirm modals
  const confirmGroupDelete = useConfirm("Are you sure you want to delete this group?");
  const confirmBulkDelete = useConfirm<number[]>("Delete selected posts?");
  const confirmTransfer = useConfirm<Subscriber>("Transfer group ownership?");
  const confirmOwnDelete = useConfirm<number>("Delete this post?");
  const confirmOtherDelete = useConfirm<number>("This post was created by someone else. You are a group owner or leader and have permission to delete it. Delete anyway?");

  // Computed values
  const groupMatchesRoute = group?.id === groupId;
  const safeGroup: GroupApi | null = groupMatchesRoute ? group : null;
  const safePosts = groupMatchesRoute ? posts : [];
  const safePagination = groupMatchesRoute ? postsPagination : null;
  const pageLoading = !groupMatchesRoute || status.group === "loading" || !mounted;
  const canManageGroup = safeGroup ? canEditGroup(safeGroup, user) : false;
  const canRemoveGroup = safeGroup ? canDeleteGroup(safeGroup, user) : false;
  const canPost = canWritePosts(safeGroup, user);
  const canTransfer = safeGroup ? canTransferOwnership(safeGroup, user) : false;
  const membersLoading = status.members === 'loading';
  const headerItem = safeGroup ? { id: safeGroup.id, author: safeGroup.creator_name } : undefined;
  const totalPages = safePagination?.total_pages ?? 1;

  // Load group detail
  useEffect(() => {
    if (Number.isFinite(groupId)) {
      dispatch(fetchGroupDetail(groupId));
    }
  }, [dispatch, groupId]);

  // Post list controller
  const ctrl = usePostListController({
    dispatch,
    perPage: POSTS_PER_PAGE,
    currentPage,
    fetchPosts: fetchGroupPostsList,
    buildFetchArgs: (page) => ({
      groupId,
      page,
      per_page: POSTS_PER_PAGE,
      append: false,
    }),
    createPost: createPost,
    buildCreateArgs: (body) => ({
      groupId,
      body,
      authorNameHint: safeGroup?.creator_name || "",
    }),
    deletePost: deletePostThunk,
    canEdit: (p) => canEditPost(p, user),
    canDelete: (p) => canDeletePost(p, user),
    postsStatus: status.posts as any,
  });

  // Event handlers
  const handleDeleteGroup = useCallback(async () => {
    if (!safeGroup) return;
    try {
      await dispatch(deleteGroup(safeGroup.id)).unwrap();
      router.push("/groups");
    } catch (e: any) {
      alert(typeof e === "string" ? e : e?.message || "Delete group failed");
    }
  }, [safeGroup, dispatch, router]);

  const handleCreatePostClick = useCallback(() => {
    if (!safeGroup || !canPost) return;
    setIsPostModalOpen(true);
  }, [safeGroup, canPost]);

  const handleEditGroup = useCallback(() => setShowEditModal(true), []);

  const askDeleteWithContext = useCallback((postId: number) => {
    const post = safePosts.find((x) => Number(x.id) === Number(postId));
    if (!post) return;

    if (isPostAuthor(post, user)) {
      confirmOwnDelete.ask(postId);
    } else if (canDeletePost(post, user)) {
      confirmOtherDelete.ask(postId);
    }
  }, [safePosts, user, confirmOwnDelete, confirmOtherDelete]);

  const toggleSelectMode = useCallback(() => {
    if (selectMode) setSelectedIds(new Set());
    setSelectMode((v) => !v);
    ctrl.toggleSelectMode();
  }, [selectMode, ctrl]);

  const toggleSelect = useCallback((postId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
    ctrl.toggleSelect(postId);
  }, [ctrl]);

  const onBulkDelete = useCallback(async (ids: number[] | null) => {
    if (!ids || ids.length === 0) return;
    await ctrl.onBulkDelete?.(ids);
    setSelectMode(false);
    setSelectedIds(new Set());
  }, [ctrl]);

  const onCreatePost = useCallback(async (item: any) => {
    await ctrl.onCreatePost?.(item);
  }, [ctrl]);

  const onDeleteSingle = useCallback(async (postId: number | null) => {
    if (!postId) return;
    await ctrl.onDeleteSingle?.(postId);
  }, [ctrl]);

  const submitEditGroup = useCallback(async (updatedGroup: GroupApi) => {
    if (!safeGroup) return;

    setModalErrors(null);
    setModalSaving(true);

    const body: CreateOrUpdateGroupBody = {
      name: updatedGroup.name.trim(),
      description: (updatedGroup.description ?? "").replace(/\r\n/g, "\n"),
      isPrivate: updatedGroup.isPrivate,
      ...(updatedGroup.post_policy ? { post_policy: updatedGroup.post_policy } : {}),
      ...(updatedGroup.comment_policy ? { comment_policy: updatedGroup.comment_policy } : {}),
    };

    try {
      const updated = await dispatch(updateGroup({ groupId: safeGroup.id, body })).unwrap();
      await dispatch(fetchGroupDetail(updated.id));
      setShowEditModal(false);
    } catch (e: any) {
      const fieldErrors = mapApiErrorToFields(typeof e === "string" ? e : e?.message);
      if (fieldErrors.title || fieldErrors.description) {
        setModalErrors(fieldErrors);
      } else {
        alert(typeof e === "string" ? e : e?.message || "Update group failed");
      }
    } finally {
      setModalSaving(false);
    }
  }, [safeGroup, dispatch]);

  const onShowMembers = useCallback(() => {
    if (!safeGroup) return;
    dispatch(fetchGroupMembers({ groupId: safeGroup.id, page: 1, per_page: MEMBERS_PER_PAGE }));
    setShowSubsModal(true);
  }, [safeGroup, dispatch]);

  const onMembersPageChange = useCallback((page: number) => {
    if (!safeGroup) return;
    dispatch(fetchGroupMembers({ groupId: safeGroup.id, page, per_page: MEMBERS_PER_PAGE }));
  }, [safeGroup, dispatch]);

  const handleAddMember = useCallback(async (input: string) => {
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
      alert(typeof e === "string" ? e : e?.message || "Add member failed");
    }
  }, [safeGroup, dispatch]);

  const handleKickMember = useCallback(async (userId: number) => {
    if (!safeGroup) return;
    try {
      await dispatch(kickGroupMember({ groupId: safeGroup.id, userId })).unwrap();
      const page = membersPagination?.page ?? 1;
      dispatch(fetchGroupMembers({ groupId: safeGroup.id, page, per_page: MEMBERS_PER_PAGE }));
    } catch (e: any) {
      alert(typeof e === "string" ? e : e?.message || "Kick member failed");
    }
  }, [safeGroup, dispatch, membersPagination?.page]);

  const handleToggleLeader = useCallback(async (userId: number, makeLeader: boolean) => {
    if (!safeGroup) return;
    try {
      const thunk = makeLeader ? addGroupLeader : removeGroupLeader;
      await dispatch(thunk({ groupId: safeGroup.id, userId })).unwrap();
    } catch (e: any) {
      alert(typeof e === "string" ? e : e?.message || (makeLeader ? "Set leader failed" : "Remove leader failed"));
    }
  }, [safeGroup, dispatch]);

  // 转让创建者：关闭成员弹窗 → 拉组长名单（排除当前创建者）→ 选人
  const openTransfer = useCallback(async () => {
    if (!safeGroup) return;
    setShowSubsModal(false);
    setTransferCandidates([]);
    setShowTransferModal(true);
    setTransferLoading(true);
    try {
      const leaders = await dispatch(fetchGroupLeaders({ groupId: safeGroup.id })).unwrap();
      setTransferCandidates(leaders.filter((u) => !u.is_creator));
    } catch (e: any) {
      alert(typeof e === "string" ? e : e?.message || "Fetch leaders failed");
    } finally {
      setTransferLoading(false);
    }
  }, [safeGroup, dispatch]);

  const handleTransfer = useCallback(async (target: Subscriber | null) => {
    if (!safeGroup || !target) return;
    const wasCreator = safeGroup.is_creator;
    setTransferring(true);
    try {
      await dispatch(transferGroupOwnership({ groupId: safeGroup.id, userId: target.id })).unwrap();
      setShowTransferModal(false);
      alert(wasCreator
        ? "You are no longer the group owner, but you are still a leader."
        : `Group ownership transferred to ${target.firstName}.`);
    } catch (e: any) {
      alert(typeof e === "string" ? e : e?.message || "Transfer ownership failed");
    } finally {
      setTransferring(false);
    }
  }, [safeGroup, dispatch]);

  const buildHref = useCallback((p: number) => `/groups/${groupId}?page=${p}`, [groupId]);

  if (pageLoading) {
    return <LoadingOverlay show text="Loading group…" />;
  }

  return (
    <>
      <CustomHeader
        item={headerItem}
        pageTitle={safeGroup?.name || "Group"}
        showAdd={false}
        showEdit={canManageGroup}
        showDelete={canRemoveGroup}
        onEdit={handleEditGroup}
        onDelete={() => confirmGroupDelete.ask()}
        rightSlot={
          safeGroup && !safeGroup.is_creator ? (
            <SubscribeToggleButton
              groupId={safeGroup.id}
              mode="follow"
              confirmOnLeave
              className="w-fit"
              isMemberHint={safeGroup.is_member}
            />
          ) : null
        }
      />

      {safeGroup && (
        <GroupInfoBar
          group={safeGroup}
          subscriberCount={subscriberCount ?? 0}
          onShowMembers={onShowMembers}
          onNewPost={handleCreatePostClick}
          onEditGroup={handleEditGroup}
          canManageGroup={canManageGroup}
          canDeleteGroup={canRemoveGroup}
          canShowCreateFab={canPost}
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
      )}

      <div className="container mx-auto md:p-6 p-1">
        <PostListSection
          rows={safePosts}
          totalPages={totalPages}
          currentPage={currentPage}
          formatDate={formatDate}
          initialPostsLoading={ctrl.initialPostsLoading}
          showUpdatingTip={ctrl.showUpdatingTip}
          uploadingPercent={ctrl.uploadingPercent}
          listLoading={status.posts === "loading"}
          deleting={status.posts === "loading" && safePosts.length > 0}
          selectMode={selectMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          canEdit={ctrl.canEdit}
          canDelete={ctrl.canDelete}
          onEditSingle={(id) => ctrl.goEdit(id)}
          onDeleteSingle={askDeleteWithContext}
          buildHref={buildHref}
          emptyText={canPost ? "No posts here yet. Be the first to post." : "No posts yet"}
        />
      </div>

      {/* Modals */}
      <SubscribersModal
        open={showSubsModal}
        onClose={() => setShowSubsModal(false)}
        members={subscribers}
        pagination={membersPagination}
        loading={membersLoading}
        canManage={canManageGroup}
        onPageChange={onMembersPageChange}
        onAdd={canManageGroup ? handleAddMember : undefined}
        onKick={canManageGroup ? handleKickMember : undefined}
        onToggleLeader={canManageGroup ? handleToggleLeader : undefined}
        currentUserId={user?.id}
        onTransferOwnership={canTransfer ? openTransfer : undefined}
        title="Subscribers"
      />

      <TransferOwnershipModal
        open={showTransferModal}
        onClose={() => { if (!transferring) setShowTransferModal(false); }}
        leaders={transferCandidates}
        loading={transferLoading}
        transferring={transferring}
        onTransfer={(leader) => confirmTransfer.ask(
          leader,
          safeGroup?.is_creator
            ? `Transfer ownership of this group to ${leader.firstName}? You will remain a leader, but you will no longer be able to delete the group or transfer ownership.`
            : `Transfer ownership of this group to ${leader.firstName}?`
        )}
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

      {isPostModalOpen && (
        <PostModal
          item={undefined}
          isNew={true}
          saving={creating}
          groupCommentPolicy={safeGroup?.comment_policy}
          onSave={async (form) => {
            setCreating(true);
            try {
              await onCreatePost(form);
              setIsPostModalOpen(false);
            } catch (e: any) {
              alert(typeof e === "string" ? e : e?.message || "Create post failed");
            } finally {
              setCreating(false);
            }
          }}
          onClose={() => {
            if (!creating) setIsPostModalOpen(false);
          }}
        />
      )}

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={confirmGroupDelete.open}
        message={confirmGroupDelete.message}
        onCancel={confirmGroupDelete.cancel}
        onConfirm={confirmGroupDelete.confirm(handleDeleteGroup)}
      />

      <ConfirmModal
        isOpen={confirmBulkDelete.open}
        message={confirmBulkDelete.message}
        onCancel={confirmBulkDelete.cancel}
        onConfirm={confirmBulkDelete.confirm(onBulkDelete)}
      />

      <ConfirmModal
        isOpen={confirmTransfer.open}
        message={confirmTransfer.message}
        onCancel={confirmTransfer.cancel}
        onConfirm={confirmTransfer.confirm(handleTransfer)}
        confirmLabel="Transfer"
        title="Transfer ownership"
      />

      <ConfirmModal
        isOpen={confirmOwnDelete.open}
        message={confirmOwnDelete.message}
        onCancel={confirmOwnDelete.cancel}
        onConfirm={confirmOwnDelete.confirm(onDeleteSingle)}
      />

      <ConfirmModal
        isOpen={confirmOtherDelete.open}
        message={confirmOtherDelete.message}
        onCancel={confirmOtherDelete.cancel}
        onConfirm={confirmOtherDelete.confirm(onDeleteSingle)}
      />

      {/* FAB：按 post_policy 判断能否发帖 */}
      {safeGroup && canPost && (
        <button
          onClick={handleCreatePostClick}
          className="fixed bottom-20 z-10 right-10 bg-yellow p-2 rounded-[50%]"
        >
          <PlusIcon className="h-5 w-5 md:w-7 md:h-7 text-white" />
        </button>
      )}
    </>
  );
}