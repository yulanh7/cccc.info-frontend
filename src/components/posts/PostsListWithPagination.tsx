"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { CheckIcon, TrashIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import CardSkeleton from "@/components/feedback/CardSkeleton";
import type { PostListUi } from "@/app/types/post";
import PostCardSimple from "./PostCardSimple";
import IconButton from "@/components/ui/IconButton";
import Pagination from "@/components/Pagination";

type Props = {
  // 数据 & 加载
  rows: PostListUi[];
  listLoading: boolean;

  // 选择模式（通用：某些页面会用）
  selectMode: boolean;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;

  // 权限/操作（可选）
  canEdit?: (p: PostListUi) => boolean;
  onDeleteSingle?: (id: number) => void;
  onEditSingle?: (id: number) => void;
  deleting?: boolean;

  // 工具
  formatDate: (timestamp: string, showTime?: boolean) => string;

  // 分页（统一放在内部渲染）
  currentPage: number;
  totalPages: number;
  /** 构造 href 的函数（推荐用它，保证 URL 里有 page，刷新/返回能记住） */
  buildHref?: (page: number) => string;
  /** 或者回调式（不走 URL 的场景可用） */
  onPageChange?: (page: number) => void;
  siblingCount?: number;

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
  onDeleteSingle,
  onEditSingle,
  deleting = false,
  formatDate,
  currentPage,
  totalPages,
  buildHref,
  onPageChange,
  siblingCount = 1,
  emptyText = "No posts yet.",
  className = "",
}: Props) {
  const showSkeleton = listLoading && rows.length === 0;

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
      <div className="columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-4">
        {rows.map((post) => {
          const canManage = !!canEdit?.(post);
          const isSelected = selectedIds.has(post.id);
          const showDelete =
            !selectMode &&
            canManage &&
            typeof onDeleteSingle === "function" &&
            typeof onEditSingle === "function";

          return (
            <div key={post.id} className="relative rounded-sm overflow-hidden mb-2 break-inside-avoid">
              {/* 工具条（覆盖在图片上，注意 pointer-events） */}
              {canManage && (selectMode || showDelete) && (
                <div className="absolute left-0 top-[20px] z-10 pointer-events-none">
                  <div
                    className="flex items-center gap-2 bg-yellow border-t border-border rounded-xs shadow-sm pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {selectMode && (
                      <IconButton
                        title={isSelected ? "Unselect" : "Select"}
                        aria-label="Select post"
                        size="sm"
                        variant={isSelected ? "warning" : "outline"}
                        onClick={() => onToggleSelect(post.id)}
                        active={isSelected}
                      >
                        <CheckIcon className="h-4 w-4" />
                      </IconButton>
                    )}

                    {!selectMode && showDelete && (
                      <div className="flex flex-col items-center gap-3 py-1 px-1">
                        <IconButton
                          title="Edit post"
                          aria-label="Edit post"
                          rounded="full"
                          variant="ghost"
                          size="xs"
                          onClick={() => onEditSingle?.(post.id)}
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </IconButton>

                        <IconButton
                          title="Delete post"
                          aria-label="Delete post"
                          rounded="full"
                          variant="ghost"
                          size="xs"
                          onClick={() => onDeleteSingle?.(post.id)}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </IconButton>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 内容卡片 */}
              <Link href={`/posts/${post.id}`} className="block">
                <PostCardSimple post={post} formatDate={formatDate} />
              </Link>
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

      {/* 分页（统一放这里） */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            siblingCount={siblingCount}
            buildHref={buildHref}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
