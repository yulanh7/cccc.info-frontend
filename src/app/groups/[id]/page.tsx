"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import CustomHeader from "@/components/layout/CustomHeader";
import LoadingOverlay from "@/components/feedback/LoadingOverLay";
import PostModal from "@/components/posts/PostModal";
import GroupModal from "@/components/groups/GroupModal";
import SubscribersModal from "@/components/groups/SubscribersModal";
import ConfirmModal from "@/components/ConfirmModal";
import GroupInfoBar from "@/components/groups/GroupInfoBar";
import PostListSection from "@/components/posts/PostListSection";
import { usePostListController } from "@/components/posts/usePostListController";

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
import { uploadAllFiles } from "@/app/ultility";

import type { CreateOrUpdateGroupBody } from "@/app/types/group";
import { toCreateRequest, type CreatePostFormModel } from "@/app/types/post";

import { PlusIcon } from "@heroicons/react/24/outline";
import { useConfirm } from "@/hooks/useConfirm";

const POST_PER_PAGE = 11;
const MEMBERS_PER_PAGE = 9;

export default function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const groupId = useMemo(() => Number(id), [id]);
  const currentPage = useMemo(() => {
    const p = Number(searchParams.get("page"));
    return Number.isFinite(p) && p > 0 ? p : 1;
  }, [searchParams]);

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

  // 选择模式 & 批量删除（沿用你的通用确认器）
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // —— 通用确认器（删群 / 批量删帖 / 单个删帖）
  const confirmGroupDelete = useConfirm("Are you sure you want to delete this group?");
  const confirmBulkDelete = useConfirm<number[]>("Delete selected posts?");
  const confirmSingleDelete = useConfirm<number>("Delete this post?");

  // —— 拉取 group 详情（保持你的逻辑）
  useEffect(() => {
    if (!Number.isFinite(groupId)) return;
    dispatch(fetchGroupDetail(groupId));
  }, [dispatch, groupId]);

  // —— 防止“旧群数据闪现”：仅在 id 匹配时认为有效（保持你的逻辑）
  const groupMatchesRoute = group?.id === groupId;
  const safeGroup = groupMatchesRoute ? group : null;
  const safePosts = groupMatchesRoute ? posts : [];
  const safePagination = groupMatchesRoute ? postsPagination : null;

  // —— 加载态（整页 VS 帖子局部）（保持你的变量）
  const pageLoading = !groupMatchesRoute || status.group === "loading";
  const postsLoading = status.posts === "loading" && groupMatchesRoute;

  const toMsg = (err: unknown) =>
    typeof err === 'string' ? err : (err as any)?.message || '';

  const handleDeleteGroup = async () => {
    if (!safeGroup) return;
    try {
      await dispatch(deleteGroup(safeGroup.id)).unwrap();
      router.push("/groups");
    } catch (e: any) {
      const msg = typeof e === "string" ? e : e?.message;
      alert(msg || "Delete group failed");
    }
  };

  // ====== 新建 / 编辑 / 删除（单个） / 批量删除（保持你的逻辑，调用封装的动作） ======

  // —— 把“帖子列表控制逻辑”交给通用钩子（策略：当前为 Group 数据源）
  const ctrl = usePostListController({
    dispatch,
    perPage: POST_PER_PAGE,
    currentPage,

    // 取列表：沿用你的 thunk & 参数
    fetchPosts: fetchGroupPosts,
    buildFetchArgs: (page) => ({
      groupId,
      page,
      per_page: POST_PER_PAGE,
      append: false,
    }),

    // 创建：沿用你的 thunk & 参数
    createPost: createPost,
    buildCreateArgs: (body) => ({
      groupId,
      body,
      authorNameHint: safeGroup?.creator?.firstName || "",
    }),

    // 删除：沿用你的 thunk
    deletePost: deletePostThunk,

    // 权限判断：沿用你的 canEditPost
    canEdit: (p) => canEditPost(p, user),

    // 给“首次加载骨架/更新中提示”判断
    postsStatus: status.posts as any,
  });

  // —— 让顶部工具栏的“选择模式”仍由你控制（与 ctrl 的 selectMode 保持一致）
  const toggleSelectMode = () => {
    // 同步本地
    if (selectMode) setSelectedIds(new Set());
    setSelectMode((v) => !v);
    // 同步到 ctrl
    ctrl.toggleSelectMode();
  };
  const toggleSelect = (postId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
    ctrl.toggleSelect(postId);
  };

  const onBulkDelete = async (ids: number[]) => {
    await ctrl.onBulkDelete?.(ids);
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const onDeleteSingle = async (postId: number) => {
    await ctrl.onDeleteSingle?.(postId);
  };

  const onCreatePost = async (item: any) => {
    // 兼容你原有 onCreatePost 签名，内部委托给 ctrl
    await ctrl.onCreatePost?.(item);
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

  // 打开成员弹窗（保持你的逻辑）
  const canManageMembers = !!safeGroup?.editable || !!user?.admin;
  const membersPagination = useAppSelector((s) => s.groupDetail.membersPagination);
  const membersLoading = useAppSelector(s => s.groupDetail.status.members) === 'loading';

  const onShowMembers = () => {
    if (!safeGroup) return;
    dispatch(fetchGroupMembers({ groupId: safeGroup.id, page: 1, per_page: MEMBERS_PER_PAGE }));
    setShowSubsModal(true);
  };

  const onMembersPageChange = (page: number) => {
    if (!safeGroup) return;
    dispatch(fetchGroupMembers({ groupId: safeGroup.id, page, per_page: MEMBERS_PER_PAGE }));
  };

  const headerItem = safeGroup
    ? { id: safeGroup.id, author: safeGroup.creator?.firstName }
    : undefined;

  const totalPages = safePagination?.total_pages ?? 1;
  const buildHref = (p: number) => `/groups/${groupId}?page=${p}`;

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
          // ✅ 保持你原先的“选择模式”对接
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
        {/* ✅ 用抽出的 PostListSection 渲染列表 & 分页（UI 保持不变） */}
        <PostListSection
          rows={safePosts}
          totalPages={totalPages}
          currentPage={currentPage}
          formatDate={formatDate}

          // 加载态（从 ctrl / 你的状态综合得出）
          initialPostsLoading={ctrl.initialPostsLoading}
          showUpdatingTip={ctrl.showUpdatingTip}
          listLoading={status.posts === "loading"}
          deleting={status.posts === "loading" && safePosts.length > 0}

          // 选择 & 权限
          selectMode={selectMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          canEdit={ctrl.canEdit}
          onEditSingle={(id) => ctrl.goEdit(id)}
          onDeleteSingle={(postId) => confirmSingleDelete.ask(postId)}

          // 分页 URL（保持你的链接方案）
          buildHref={buildHref}
        />
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
        onAdd={canManageMembers ? async (input) => {
          if (!safeGroup) return;
          const trimmed = (input || "").trim();
          if (!trimmed) return;
          const payload: { groupId: number; user_id?: number; email?: string } = { groupId: safeGroup.id };
          const maybeId = Number(trimmed);
          if (Number.isFinite(maybeId) && String(maybeId) === trimmed) payload.user_id = maybeId;
          else payload.email = trimmed;

          try {
            await dispatch(addGroupMember(payload)).unwrap();
            dispatch(fetchGroupMembers({ groupId: safeGroup.id, page: 1, per_page: MEMBERS_PER_PAGE }));
          } catch (e: any) {
            alert(typeof e === "string" ? e : e?.message || "Add member failed");
          }
        } : undefined}
        onKick={canManageMembers ? async (userId) => {
          if (!safeGroup) return;
          try {
            await dispatch(kickGroupMember({ groupId: safeGroup.id, userId })).unwrap();
            const p = membersPagination?.page ?? 1;
            dispatch(fetchGroupMembers({ groupId: safeGroup.id, page: p, per_page: MEMBERS_PER_PAGE }));
          } catch (e: any) {
            alert(typeof e === "string" ? e : e?.message || "Kick member failed");
          }
        } : undefined}
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

      {/* 批量删帖确认（委托 ctrl.onBulkDelete） */}
      <ConfirmModal
        isOpen={confirmBulkDelete.open}
        message={confirmBulkDelete.message}
        onCancel={confirmBulkDelete.cancel}
        onConfirm={confirmBulkDelete.confirm(async (ids) => {
          if (!ids || ids.length === 0) return;
          await onBulkDelete(ids);
        })}
      />

      {/* 单个删帖确认（委托 ctrl.onDeleteSingle） */}
      <ConfirmModal
        isOpen={confirmSingleDelete.open}
        message={confirmSingleDelete.message}
        onCancel={confirmSingleDelete.cancel}
        onConfirm={confirmSingleDelete.confirm(async (postId) => {
          if (!postId) return;
          await onDeleteSingle(postId);
        })}
      />

      {/* 新建 PostModal（委托 ctrl.onCreatePost） */}
      {isPostModalOpen && (
        <PostModal
          item={undefined}
          isNew={true}
          onSave={async (form) => {
            setIsPostModalOpen(false);
            try {
              await onCreatePost(form);
            } catch (e: any) {
              alert(e?.message || "Create post failed");
            }
          }}
          onClose={() => setIsPostModalOpen(false)}
        />
      )}

      {/* 移动端新增按钮（保持你的 UI） */}
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
