"use client";

import React, { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import CustomHeader from "@/components/layout/CustomHeader";
import LoadingOverlay from "@/components/feedback/LoadingOverLay";
import PostListSection from "@/components/posts/PostListSection";
import { usePostListController } from "@/components/posts/usePostListController";
import { formatDate } from "@/app/ultility";
import { useConfirm } from "@/hooks/useConfirm";
import ConfirmModal from "@/components/ConfirmModal";
import PageTitle from '@/components/layout/PageTitle';
import { fetchMyPosts, deletePost as deletePostThunk } from "@/app/features/posts/slice";
import type { PostListItemApi } from "@/app/types";
import { canEditPostList } from "@/app/types";

const POST_PER_PAGE = 11;

function useSourceListState(sourceKey: string) {
  const containers = useAppSelector((s: any) => ({
    v1: s.posts?.lists?.[sourceKey],
    v2: s.posts?.sources?.[sourceKey],
    v3: s.posts?.[sourceKey],
  }));

  const box = containers.v1 ?? containers.v2 ?? containers.v3 ?? null;

  const rows: PostListItemApi[] = box?.rows ?? box?.items ?? [];
  const pagination = box?.pagination ?? box?.pageInfo ?? null;

  const statusMap = useAppSelector((s: any) => s.posts?.status ?? {});
  const postsStatus: "idle" | "loading" | "succeeded" | "failed" =
    statusMap?.[sourceKey] ?? statusMap?.list ?? statusMap ?? "idle";

  return { rows, pagination, postsStatus };
}

export default function MyPostsPage() {
  const searchParams = useSearchParams();
  const currentPage = useMemo(() => {
    const p = Number(searchParams.get("page"));
    return Number.isFinite(p) && p > 0 ? p : 1;
  }, [searchParams]);

  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const SRC = "mine";
  const { rows, pagination, postsStatus } = useSourceListState(SRC);

  const confirmSingleDelete = useConfirm<number>("Delete this post?");
  const confirmBulkDelete = useConfirm<number[]>("Delete selected posts?");
  const totalPages = pagination?.total_pages ?? pagination?.pages ?? 1;
  const buildHref = (p: number) => `/posts/mine?page=${p}`;

  const ctrl = usePostListController({
    dispatch,
    perPage: POST_PER_PAGE,
    currentPage,
    fetchPosts: fetchMyPosts,
    buildFetchArgs: (page) => ({
      page,
      per_page: POST_PER_PAGE,
      append: false,
    }),
    deletePost: deletePostThunk,
    canEdit: (p) => canEditPostList(p, user),
    postsStatus,
  });

  const pageLoading = postsStatus === "loading" && rows.length === 0;

  return (
    <>
      <PageTitle title="Home" showPageTitle={true} />
      <div className="container mx-auto md:p-6 p-2 mt-0 md:mt-16">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-dark-gray">
            {ctrl.selectMode ? `${ctrl.selectedIds.size} selected` : " "}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="text-xs px-3 py-1 rounded border border-border"
              onClick={ctrl.toggleSelectMode}
            >
              {ctrl.selectMode ? "Exit Select" : "Select"}
            </button>
            {ctrl.selectMode && ctrl.selectedIds.size > 0 && (
              <button
                className="text-xs px-3 py-1 rounded bg-red-600 text-white"
                onClick={() => {
                  const ids = Array.from(ctrl.selectedIds);
                  confirmBulkDelete.ask(
                    ids,
                    `Delete ${ids.length} selected post${ids.length > 1 ? "s" : ""}?`
                  );
                }}
              >
                Delete Selected
              </button>
            )}
          </div>
        </div>

        <PostListSection
          rows={rows}
          totalPages={totalPages}
          currentPage={currentPage}
          formatDate={formatDate}
          initialPostsLoading={ctrl.initialPostsLoading}
          showUpdatingTip={ctrl.showUpdatingTip}
          listLoading={postsStatus === "loading"}
          deleting={postsStatus === "loading" && rows.length > 0}
          selectMode={ctrl.selectMode}
          selectedIds={ctrl.selectedIds}
          onToggleSelect={ctrl.toggleSelect}
          canEdit={ctrl.canEdit}
          onEditSingle={(id) => ctrl.goEdit(id)}
          onDeleteSingle={(postId) => confirmSingleDelete.ask(postId)}
          buildHref={buildHref}
        />
      </div>

      <LoadingOverlay show={pageLoading} text="Loading posts…" />

      {/* 批量删帖确认 */}
      {/* @ts-ignore */}
      <ConfirmModal
        isOpen={confirmBulkDelete.open}
        message={confirmBulkDelete.message}
        onCancel={confirmBulkDelete.cancel}
        onConfirm={confirmBulkDelete.confirm(async (ids) => {
          if (!ids || ids.length === 0) return;
          await ctrl.onBulkDelete?.(ids);
        })}
      />

      <ConfirmModal
        isOpen={confirmSingleDelete.open}
        message={confirmSingleDelete.message}
        onCancel={confirmSingleDelete.cancel}
        onConfirm={confirmSingleDelete.confirm(async (postId) => {
          if (!postId) return;
          await ctrl.onDeleteSingle?.(postId);
        })}
      />
    </>
  );
}
