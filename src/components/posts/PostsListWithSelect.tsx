"use client";

import React from "react";
import Link from "next/link";
import { CheckIcon, TrashIcon } from "@heroicons/react/24/outline";
import CardSkeleton from "@/components/feedback/CardSkeleton";
import Spinner from "@/components/feedback/Spinner";
import type { PostProps } from "@/app/types/post";
import PostCardSimple from "./PostCardSimple";

type Props = {
  rows: PostProps[];
  listLoading: boolean;

  // 选择模式（受控，独立按钮在 GroupInfoBar）
  selectMode: boolean;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;

  // 单删（选择模式关闭时才出现）
  canEdit?: (p: PostProps) => boolean;
  onDeleteSingle?: (id: number) => void;
  deleting?: boolean;

  // 分页
  hasMore?: boolean;
  loadMore?: () => Promise<void> | void;
  loadingMore?: boolean;

  // 工具
  formatDate: (timestamp: string, showTime?: boolean) => string;
};

export default function PostsListWithSelect({
  rows,
  listLoading,

  selectMode,
  selectedIds,
  onToggleSelect,

  canEdit,
  onDeleteSingle,
  deleting = false,

  hasMore,
  loadMore,
  loadingMore,

  formatDate,
}: Props) {
  return (
    <div className="space-y-4">
      {/* 列表区域 */}
      {listLoading && rows.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-dark-gray">No posts yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((post) => {
            const isSelected = selectedIds.has(post.id);
            const showDelete =
              !selectMode && !!canEdit?.(post) && typeof onDeleteSingle === "function";

            return (
              <div key={post.id} className="relative">
                {/* 右上角：选择模式的勾选按钮 */}
                {selectMode && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleSelect(post.id);
                    }}
                    className={`absolute right-2 top-2 z-10 inline-flex items-center justify-center h-5 w-5 rounded-sm ${isSelected
                      ? "bg-yellow border-yellow text-white"
                      : "bg-white  border border-yellow text-dark-gray"
                      }`}
                    title={isSelected ? "Unselect" : "Select"}
                    aria-label="Select post"
                  >
                    {isSelected && <CheckIcon className="h-4 w-4" />}
                  </button>
                )}

                {/* 右上角：单删（仅在非选择模式） */}
                {showDelete && (
                  <button
                    disabled={deleting}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDeleteSingle!(post.id);
                    }}
                    className="absolute right-2 top-2 z-10 inline-flex items-center justify-center h-7 w-7 rounded-md border border-red/50 text-red hover:bg-red/10 disabled:opacity-50"
                    title="Delete post"
                    aria-label="Delete post"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}

                {/* 卡片内容整体作为链接进入详情 */}
                <Link href={`/posts/${post.id}`} className="block">
                  <PostCardSimple post={post} formatDate={formatDate} />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* 分页 */}
      {typeof hasMore !== "undefined" && (
        <div className="flex justify-center">
          {hasMore ? (
            <button
              onClick={loadMore}
              disabled={loadingMore || deleting}
              className="px-4 py-2 border border-border rounded-sm text-dark-gray flex items-center gap-2"
            >
              {loadingMore ? (
                <>
                  <Spinner className="h-4 w-4" /> Loading…
                </>
              ) : (
                "Load more"
              )}
            </button>
          ) : (
            <span className="text-sm text-gray">No more results</span>
          )}
        </div>
      )}
    </div>
  );
}
