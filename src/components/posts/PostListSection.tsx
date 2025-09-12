// components/posts/PostListSection.tsx
"use client";

import React from "react";
import type { PostListItemApi } from "@/app/types";
import PostsListWithPagination from "./PostsListWithPagination";
import CardSkeleton from "@/components/feedback/CardSkeleton";

type Props = {
  // 数据
  rows: PostListItemApi[];
  totalPages: number;
  currentPage: number;
  formatDate: (ts: string, showTime?: boolean) => string;

  // 加载与提示
  initialPostsLoading: boolean;
  showUpdatingTip: boolean;
  uploadingPercent?: number;
  listLoading: boolean;
  deleting?: boolean;

  // 选择 & 权限
  selectMode: boolean;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  canEdit: (p: PostListItemApi) => boolean;
  canDelete: (p: PostListItemApi) => boolean;
  onDeleteSingle?: (id: number) => void;
  onEditSingle?: (id: number) => void;

  // 翻页
  buildHref?: (page: number) => string;
  onPageChange?: (page: number) => void;

  className?: string;
  emptyText?: string;
};

export default function PostListSection({
  rows,
  totalPages,
  currentPage,
  formatDate,
  initialPostsLoading,
  showUpdatingTip,
  uploadingPercent = 0,
  listLoading,
  deleting = false,
  selectMode,
  selectedIds,
  onToggleSelect,
  canEdit,
  canDelete,
  onDeleteSingle,
  onEditSingle,
  buildHref,
  onPageChange,
  className = "",
  emptyText = "No posts yet.",
}: Props) {
  return (
    <section className={`relative ${className}`}>
      {/* 首次骨架 */}
      {initialPostsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {/* 更新提示 */}
      {!initialPostsLoading && showUpdatingTip && (
        <div className="sticky top-[72px] z-10 mb-2 flex items-center gap-2 text-xs text-dark-gray">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
          Updating posts…
          {uploadingPercent > 0 ? ` – uploading ${uploadingPercent}%` : ""}…
        </div>
      )}

      {/* 列表 + 分页（沿用你的组件） */}
      {!initialPostsLoading && (
        <PostsListWithPagination
          rows={rows}
          listLoading={listLoading && rows.length === 0}
          selectMode={selectMode}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          canEdit={canEdit}
          canDelete={canDelete}
          onDeleteSingle={onDeleteSingle}
          onEditSingle={onEditSingle}
          deleting={deleting}
          formatDate={formatDate}
          currentPage={currentPage}
          totalPages={totalPages}
          buildHref={buildHref}
          onPageChange={onPageChange}
          emptyText={emptyText}
        />
      )}
    </section>
  );
}
