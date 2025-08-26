"use client";
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import CustomHeader from "@/components/layout/CustomHeader";
import Post from "@/components/Post";
import PostModal from "@/components/PostModal";
import GroupEditModal from '@/components/groups/GroupEditModal';
import SubscribersModal from "@/components/groups/SubscribersModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { formatDate } from "@/app/ultility";
import PageTitle from '@/components/layout/PageTitle';
import {
  fetchGroupDetail,
  fetchGroupPosts,
} from "@/app/features/groups/detailSlice";
import { updateGroup, deleteGroup } from "@/app/features/groups/slice";
import type { CreateOrUpdateGroupBody } from "@/app/types/group";
import type { PostProps } from "@/app/types";

import {
  UsersIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserCircleIcon,
  CalendarIcon,
  UserPlusIcon
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

export default function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const groupId = useMemo(() => Number(id), [id]);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { group, subscriberCount, subscribers, posts, postsPagination, status } =
    useAppSelector((s) => s.groupDetail);

  const [isPostModalOpen, setIsPostModalOpen] = useState(false); // 新建帖子
  const [showEditModal, setShowEditModal] = useState(false); // 编辑群
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // 删除群确认
  const [showSubsModal, setShowSubsModal] = useState(false); // 订阅者

  useEffect(() => {
    if (!Number.isFinite(groupId)) return;
    dispatch(fetchGroupDetail(groupId));
    dispatch(fetchGroupPosts({ groupId, page: 1, per_page: 20, append: false }));
  }, [dispatch, groupId]);

  const handleEditGroup = () => setShowEditModal(true);

  const submitEditGroup = async (body: CreateOrUpdateGroupBody) => {
    if (!group) return;
    try {
      await dispatch(updateGroup({ groupId: group.id, body })).unwrap();
      setShowEditModal(false);
    } catch (e: any) {
      alert(e?.message || "Update group failed");
    }
  };

  const handleDeleteGroup = async () => {
    if (!group) return;
    try {
      await dispatch(deleteGroup(group.id)).unwrap();
      setShowDeleteConfirm(false);
      router.push("/groups");
    } catch (e: any) {
      alert(e?.message || "Delete group failed");
    }
  };

  const loadMore = () => {
    if (!postsPagination) return;
    const next = postsPagination.current_page + 1;
    if (next <= postsPagination.total_pages) {
      dispatch(fetchGroupPosts({ groupId, page: next, per_page: 20, append: true }));
    }
  };

  const handleSavePost = (item: PostProps) => {
    console.log("Saved post:", { ...item, group: String(groupId) });
    setIsPostModalOpen(false);
    dispatch(fetchGroupPosts({ groupId, page: 1, per_page: 20, append: false }));
  };

  const headerItem = group ? { id: group.id, author: group.creator?.firstName } : undefined;

  return (
    <>
      <PageTitle title={group?.title} showPageTitle={true} />
      <CustomHeader
        item={headerItem}
        pageTitle={group?.title || "Group"}
        showEdit={!!group?.editable}
        showDelete={!!group?.editable}
        onEdit={handleEditGroup}
        onDelete={() => setShowDeleteConfirm(true)}
      />
      <div className="container mx-auto md:p-6 p-4 mt-14">
        <section className="mb-4 md:mb-6 rounded-xl border border-border bg-bg p-4 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              {group?.description && (
                <p className="mt-1 text-sm text-dark-gray">{group.description}</p>
              )}
            </div>

            <div className="hidden md:flex items-center gap-2">

              {group?.editable && (
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

          <div className="mt-3 w-full flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-dark-gray justify-between md:justify-start">
            <span className="md:hidden" />

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="inline-flex items-center gap-2">

                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-dark-green/10 text-dark-green text-xs font-semibold">
                  {(group?.creator?.firstName?.[0] || '?').toUpperCase()}
                </span>
                <span className="text-[11px] uppercase tracking-wide text-dark-gray/70">Creator</span>
                <span className="font-medium">{group?.creator?.firstName || '—'}</span>
              </span>

              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon className="h-5 w-5" />
                <span className="text-[11px] uppercase tracking-wide text-dark-gray/70">Created</span>
                <time dateTime={group?.createdDate || ''} className="font-medium">
                  {group?.createdDate ? formatDate(group.createdDate) : '—'}
                </time>
              </span>

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
          </div>


        </section>

        <section>
          {status.posts === "loading" && posts.length === 0 ? (
            <div className="text-sm text-dark-gray">Loading posts…</div>
          ) : posts.length === 0 ? (
            <div className="text-sm text-dark-gray">No posts yet.</div>
          ) : (
            <div className="columns-2 gap-1 md:columns-2 lg:columns-3 md:gap-8">
              {posts.map((post) => (
                <div className="break-inside-avoid mb-2 md:mb-8" key={post.id}>
                  <Post post={post} />
                </div>
              ))}
            </div>
          )}

          {postsPagination && postsPagination.current_page < postsPagination.total_pages && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={loadMore}
                disabled={status.posts === "loading"}
                className="px-4 py-2 rounded-md border border-border hover:bg-bg disabled:opacity-60"
              >
                {status.posts === "loading" ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </section>
      </div>

      <SubscribersModal
        open={showSubsModal}
        onClose={() => setShowSubsModal(false)}
        subscribers={subscribers}
        title="Subscribers"
      />

      <GroupEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        group={group ?? undefined}
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

      <button
        onClick={() => setIsPostModalOpen(true)}
        className="fixed md:hidden bottom-8 z-20 left-1/2 -translate-x-1/2 bg-yellow px-3 py-3 rounded-[50%]"
      >
        <PlusIcon className="h-7 w-7 text-white" />
      </button>
    </>
  );
}
