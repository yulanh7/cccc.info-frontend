"use client";
import { Suspense } from "react";
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
import { fetchSubscribedPosts, deletePost as deletePostThunk } from "@/app/features/posts/slice";
import type { PostListItemApi } from "@/app/types";
import { canEditPostList } from "@/app/types";
import { POSTS_PER_PAGE } from "@/app/constants";


export default function HomePage() {
  return (
    <Suspense fallback={<LoadingOverlay show text="Loading groups…" />}>
      <HomePageInner />
    </Suspense>
  );
}

function useSourceListState(sourceKey: string) {
  const feed = useAppSelector((s) => (s as any).posts?.lists?.[sourceKey]);
  const rows: PostListItemApi[] = feed?.items ?? [];
  const postsStatus: "idle" | "loading" | "succeeded" | "failed" =
    feed?.status ?? "idle";
  const rawTotalPages =
    feed?.total_pages ?? feed?.pages ?? feed?.totalPages ?? null;
  const totalCount =
    feed?.total_posts ?? feed?.total ?? feed?.totalCount ?? null;
  const perPageGuess = rows.length > 0 ? rows.length : null;
  const totalPages =
    rawTotalPages ??
    (totalCount && perPageGuess
      ? Math.max(1, Math.ceil(Number(totalCount) / Number(perPageGuess)))
      : 1);

  return { rows, totalPages, postsStatus };
}


function HomePageInner() {
  const searchParams = useSearchParams();
  const currentPage = useMemo(() => {
    const p = Number(searchParams.get("page"));
    return Number.isFinite(p) && p > 0 ? p : 1;
  }, [searchParams]);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const SRC = "subscribed";
  const { rows, totalPages, postsStatus } = useSourceListState(SRC);

  const confirmSingleDelete = useConfirm<number>("Delete this post?");
  const buildHref = (p: number) => `/?page=${p}`;

  const ctrl = usePostListController({
    dispatch,
    perPage: POSTS_PER_PAGE,
    currentPage,
    fetchPosts: fetchSubscribedPosts,
    buildFetchArgs: (page) => ({
      page,
      per_page: POSTS_PER_PAGE,
      append: false,
    }),
    deletePost: deletePostThunk,
    canEdit: (p) => canEditPostList(p, user),
    postsStatus,
  });

  const pageLoading = !mounted;

  return (
    <>
      <LoadingOverlay show={pageLoading} text="Loading home…" />
      <CustomHeader
        pageTitle="Home"
        showLogo={true}
      />
      <PageTitle title="Home" showPageTitle={true} />

      <div className="container mx-auto md:p-6 p-2 mt-16">
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


      {/* 单个删帖确认 */}
      {/* @ts-ignore: ConfirmModal 的 props 由你的实现决定 */}
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
