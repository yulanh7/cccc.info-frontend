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
import { isPostAuthor, isGroupCreatorOfPost } from "@/app/types";
import { POSTS_PER_PAGE } from "@/app/constants";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import Link from 'next/link';


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
    canEdit: (p) => isPostAuthor(p, user),
    canDelete: (p) => isPostAuthor(p, user) || isGroupCreatorOfPost(p, user),
    postsStatus,
  });

  const pageLoading = !mounted;

  // 1) 增加两个确认框实例
  const confirmOwnDelete = useConfirm<number>("Delete this post?");
  const confirmOtherDelete = useConfirm<number>(
    "This post was created by someone else. You are a group owner and have permission to delete it. Delete anyway?"
  );

  // 2) 点删除时根据身份弹不同提示
  const askDeleteWithContext = (postId: number) => {
    const p = rows.find((x) => Number(x.id) === Number(postId));
    if (!p) return;

    if (isPostAuthor(p, user)) {
      // 自己的帖子
      confirmOwnDelete.ask(postId);
    } else if (isGroupCreatorOfPost(p, user)) {
      // 别人的帖子，但你是该帖所属小组的创建者/组长
      confirmOtherDelete.ask(postId);
    } else {
      // 没权限（理论上按钮不该出现；兜底）
      // 你也可以这里 toast 一下
    }
  };


  return (
    <>
      <LoadingOverlay show={pageLoading} text="Loading home…" />
      <CustomHeader
        pageTitle="Home"
        showLogo={true}
      />
      <PageTitle title="Home" showPageTitle={true} />

      <div className="container mx-auto md:p-6 p-1 mt-0 md:mt-16">
        {rows.length < 1 && (
          <div className="flex items-center justify-center gap-2 text-base">
            <InformationCircleIcon className="h-4 w-4 mt-0.5" aria-hidden="true" />
            <span className="text-dark-gray">
              No posts yet. Follow some groups to see updates on your Home feed. Browse{" "}
              <Link href="/groups?tab=all" className="underline hover:no-underline text-dark-gray">
                Groups (All)
              </Link>{" "}
              to discover .
            </span>
          </div>
        )}

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
          onToggleSelect={ctrl.toggleSelect}
          canEdit={ctrl.canEdit}
          canDelete={ctrl.canDelete}
          onEditSingle={(id) => ctrl.goEdit(id)}
          onDeleteSingle={(postId) => askDeleteWithContext(postId)}
          buildHref={buildHref}
          emptyText={''}
        />
      </div>


      {/* 单个删帖确认 */}
      {/* @ts-ignore: ConfirmModal 的 props 由你的实现决定 */}
      <ConfirmModal
        isOpen={confirmOwnDelete.open}
        message={confirmOwnDelete.message}
        onCancel={confirmOwnDelete.cancel}
        onConfirm={confirmOwnDelete.confirm(async (postId) => {
          if (!postId) return;
          await ctrl.onDeleteSingle?.(postId);
        })}
      />

      <ConfirmModal
        isOpen={confirmOtherDelete.open}
        message={confirmOtherDelete.message}
        onCancel={confirmOtherDelete.cancel}
        onConfirm={confirmOtherDelete.confirm(async (postId) => {
          if (!postId) return;
          await ctrl.onDeleteSingle?.(postId);
        })}
      />
    </>
  );
}
