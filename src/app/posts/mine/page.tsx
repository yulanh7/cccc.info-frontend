"use client";
import { Suspense } from "react";
import React, { useMemo } from "react";
import Link from 'next/link';
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
import { isPostAuthor, isGroupCreatorOfPost } from "@/app/types";
import Button from "@/components/ui/Button";
import { POSTS_PER_PAGE } from "@/app/constants";
import CustomHeader from "@/components/layout/CustomHeader";
import { InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

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
    <Suspense fallback={<LoadingOverlay show text="Loading my posts…" />}>
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
    perPage: POSTS_PER_PAGE,
    currentPage,
    fetchPosts: fetchMyPosts,
    buildFetchArgs: (page) => ({
      page,
      per_page: POSTS_PER_PAGE,
      append: false,
    }),
    deletePost: deletePostThunk,
    canEdit: (p) => isPostAuthor(p, user),
    canDelete: (p) => isPostAuthor(p, user) || isGroupCreatorOfPost(p, user),
    postsStatus,
  });

  const pageLoading = !mounted;

  const [showHint, setShowHint] = React.useState(true);
  const hideHint = () => setShowHint(false);


  return (
    <>
      <LoadingOverlay show={pageLoading} text="Loading my posts…" />
      <CustomHeader
        pageTitle="My Posts"
        showLogo={true}
      />
      <PageTitle title="My Posts" showPageTitle={true} />
      <div className="container mx-auto md:p-6 p-1 mt-1 md:mt-16">
        {rows.length > 0 && showHint && (
          <div
            className="mb-3 flex items-center justify-between gap-3 rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm"
            role="note"
            aria-live="polite"
          >
            <div className="flex items-center gap-2">
              <InformationCircleIcon className="h-4 w-4" aria-hidden="true" />
              <span className="text-dark-gray">
                You can only create posts inside groups. Go to your{" "}
                <Link href="/groups?tab=subscribed" className="underline hover:no-underline">
                  Subscribed
                </Link>{" "}
                tab to start a new post.
              </span>
            </div>
            <button
              type="button"
              onClick={hideHint}
              aria-label="Dismiss reminder"
              className="p-1 -m-1 rounded hover:bg-gray-50"
            >
              <XMarkIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {rows.length > 0 && (
          <div className="flex items-center justify-end gap-2 mb-2 ">
            <div className="text-sm text-dark-gray">
              {ctrl.selectMode ? `${ctrl.selectedIds.size} selected` : " "}
            </div>
            <Button
              variant={ctrl.selectMode ? "secondary" : "primary"}
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
        )}

        {rows.length === 0 && postsStatus !== 'loading' ? (
          <div
            className="rounded-2xl border border-border bg-white p-6 md:p-10 text-center shadow-sm max-w-[600px] mx-auto"
            role="status"
            aria-live="polite"
          >
            <h2 className="text-xl md:text-2xl font-semibold mb-2">
              No posts yet
            </h2>
            <p className="text-dark-gray mb-6">
              To create a post, please go to a group you’ve subscribed to and post there.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link href="/groups?tab=subscribed" className="contents">
                <Button variant="primary" title="Go to Subscribed groups" className="w-40">
                  Go to Subscribed
                </Button>
              </Link>
              <Link href="/groups" className="contents">
                <Button variant="secondary" title="Browse all groups " className="w-40">
                  Browse Groups
                </Button>
              </Link>
            </div>

          </div>
        ) : (

          <PostListSection
            rows={rows}
            totalPages={totalPages}
            currentPage={currentPage}
            formatDate={formatDate}
            initialPostsLoading={ctrl.initialPostsLoading}
            showUpdatingTip={ctrl.showUpdatingTip}
            uploadingPercent={ctrl.uploadingPercent}
            listLoading={postsStatus === "loading"}
            deleting={postsStatus === "loading" && rows.length > 0}
            selectMode={ctrl.selectMode}
            selectedIds={ctrl.selectedIds}
            emptyText={''}
            onToggleSelect={ctrl.toggleSelect}
            canEdit={ctrl.canEdit}
            canDelete={ctrl.canDelete}
            onEditSingle={(id) => ctrl.goEdit(id)}
            onDeleteSingle={(postId) => confirmSingleDelete.ask(postId)}
            buildHref={buildHref}
          />)}
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
    </>
  );
}
