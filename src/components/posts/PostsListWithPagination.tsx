"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import CardSkeleton from "@/components/feedback/CardSkeleton";
import type { PostListItemApi } from "@/app/types";
import PostCardSimple from "./PostCardSimple";
import InfiniteSentinel from "@/components/ui/InfiniteSentinel";
import { useRouter } from "next/navigation";

type Props = {
  // 数据 & 加载
  rows: PostListItemApi[];
  listLoading: boolean;

  // 选择模式（通用：某些页面会用）
  selectMode: boolean;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;

  // 权限/操作（可选）
  canEdit?: (p: PostListItemApi) => boolean;
  canDelete?: (p: PostListItemApi) => boolean;
  onDeleteSingle?: (id: number) => void;
  onEditSingle?: (id: number) => void;
  deleting?: boolean;

  // 工具
  formatDate: (timestamp: string, showTime?: boolean) => string;

  // 无限滚动：滚到底自动加载下一页
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;

  // 空态文案（可选）
  emptyText?: string;

  // 布局微调（可选）
  className?: string;
};

export default function PostsListWithPagination({
  rows,
  listLoading,
  selectMode,
  selectedIds,
  onToggleSelect,
  canEdit,
  canDelete,
  onDeleteSingle,
  onEditSingle,
  deleting = false,
  formatDate,
  hasMore,
  loadingMore,
  onLoadMore,
  emptyText = "No posts yet.",
  className = "",
}: Props) {
  const showSkeleton = listLoading && rows.length === 0;
  const router = useRouter();

  const grid = useMemo(() => {
    if (showSkeleton) return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );

    if (!showSkeleton && rows.length === 0) {
      return <p className="text-sm text-dark-gray">{emptyText}</p>;
    }

    return (
      <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-[3px]">
        {rows.map((post) => {
          const canManageEdit = !!canEdit?.(post);
          const canManageDelete = !!canDelete?.(post);
          const isSelected = selectedIds.has(post.id);
          const showDelete =
            !selectMode &&
            canManageDelete &&
            typeof onDeleteSingle === "function" &&
            typeof onEditSingle === "function";

          return (
            <div key={post.id} className="relative rounded-sm overflow-hidden mb-1 break-inside-avoid">
              <PostCardSimple
                post={post}
                formatDate={formatDate}
                canEdit={canManageEdit}
                canDelete={canManageDelete}
                selectMode={selectMode}
                isSelected={isSelected}
                onToggleSelect={onToggleSelect}
                showDelete={showDelete}
                onEditSingle={onEditSingle}
                onDeleteSingle={onDeleteSingle}
                onOpenPost={() => router.push(`/posts/${post.id}`)}

              />
            </div>

          );
        })}
      </div>
    );
  }, [
    rows,
    showSkeleton,
    selectMode,
    selectedIds,
    canEdit,
    canDelete,
    onDeleteSingle,
    onEditSingle,
    onToggleSelect,
    formatDate,
    emptyText,
  ]);

  return (
    <div className={className}>
      {/* 列表 */}
      {grid}

      {/* 无限滚动 */}
      {rows.length > 0 && (
        <InfiniteSentinel hasMore={hasMore} loading={loadingMore} onLoadMore={onLoadMore} endText="No more posts" />
      )}
    </div>
  );
}
