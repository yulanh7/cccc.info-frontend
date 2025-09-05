"use client";
import { Suspense } from "react";
import React, { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
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
import Button from "@/components/ui/Button";

const POST_PER_PAGE = 11;

function useSourceListState(sourceKey: string) {
  const feed = useAppSelector((s) => (s as any).posts?.lists?.[sourceKey]);
  const rows: PostListItemApi[] = feed?.items ?? [];

  // 统一兼容各种命名 & 兜底推导
  const currentPage =
    feed?.current_page ?? feed?.currentPage ?? null;

  const rawTotalPages =
    feed?.total_pages ?? feed?.pages ?? feed?.totalPages ?? null;

  const totalCount =
    feed?.total_posts ?? feed?.total ?? feed?.totalCount ?? null;

  const perPageGuess =
    rows.length > 0 ? rows.length : null;

  const totalPages =
    rawTotalPages ??
    (totalCount && perPageGuess
      ? Math.max(1, Math.ceil(Number(totalCount) / Number(perPageGuess)))
      : 1);

  const postsStatus: "idle" | "loading" | "succeeded" | "failed" =
    feed?.status ?? "idle";

  return { rows, totalPages, currentPage, postsStatus };
}


export default function MyPostsPage() {
  return (
    <Suspense fallback={<LoadingOverlay show text="Loading groups…" />}>
      <MyPostsPageInner />
    </Suspense>
  );
}

function MyPostsPageInner() {
  const searchParams = useSearchParams();
  const currentPage = useMemo(() => {
    const p = Number(searchParams.get("page"));
    return Number.isFinite(p) && p > 0 ? p : 1;
  }, [searchParams]);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const SRC = "mine";
  const { rows, totalPages, postsStatus } = useSourceListState(SRC);



  const confirmSingleDelete = useConfirm<number>("Delete this post?");
  const confirmBulkDelete = useConfirm<number[]>("Delete selected posts?");
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

  const pageLoading = !mounted;

  return (
    <Suspense fallback={<LoadingOverlay show text="Loading posts…" />}>
      <PageTitle title="Home" showPageTitle={true} />
      <div className="container mx-auto md:p-6 p-2 mt-5 md:mt-16">
        <div className="flex items-center justify-end gap-2 mb-2 ">
          <div className="text-sm text-dark-gray">
            {ctrl.selectMode ? `${ctrl.selectedIds.size} selected` : " "}
          </div>
          <Button
            variant="primary"
            onClick={ctrl.toggleSelectMode}
            active={ctrl.selectMode}
            aria-pressed={ctrl.selectMode}
            title={ctrl.selectMode ? "Exit select mode" : "Enter select mode"}
          >
            {ctrl.selectMode ? "Exit Select" : "Select Posts"}
          </Button>
          {ctrl.selectMode && ctrl.selectedIds.size > 0 && (
            <Button
              variant="danger"
              // variant="outline" tone="danger"
              onClick={() => {
                const ids = Array.from(ctrl.selectedIds);
                confirmBulkDelete.ask(
                  ids,
                  `Delete ${ids.length} selected post${ids.length > 1 ? "s" : ""}?`
                );
              }}
              disabled={ctrl.selectedIds.size === 0}
              title={ctrl.selectedIds.size === 0 ? "Select posts to enable" : "Delete selected posts"}
            >
              Delete Selected
            </Button>

          )}
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
    </Suspense>
  );
}
