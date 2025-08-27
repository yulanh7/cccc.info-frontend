"use client";

import React from "react";
import Link from "next/link";
import { CheckIcon, TrashIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import CardSkeleton from "@/components/feedback/CardSkeleton";
import Spinner from "@/components/feedback/Spinner";
import type { PostProps } from "@/app/types/post";
import PostCardSimple from "./PostCardSimple";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";

type Props = {
  rows: PostProps[];
  listLoading: boolean;
  selectMode: boolean;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;

  // 单删（选择模式关闭时才出现）
  canEdit?: (p: PostProps) => boolean;      // ← 外部传入：当前用户是否为作者
  onDeleteSingle?: (id: number) => void;
  onEditSingle?: (p: PostProps) => void;
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
  onEditSingle,
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
        <div className="columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-4">
          {rows.map((post) => {
            const canManage = !!canEdit?.(post);
            const isSelected = selectedIds.has(post.id);
            const showDelete =
              !selectMode && canManage && typeof onDeleteSingle === "function" && typeof onEditSingle === "function";

            return (
              <div key={post.id} className="relative rounded-sm overflow-hidden mb-2">
                {/* 顶部工具栏（覆盖在图片上方） */}
                {canManage && (selectMode || showDelete) && (
                  <div className="absolute left-0 top-[20px] z-10 pointer-events-none">
                    <div
                      className="flex items-center gap-1 bg-yellow border-t border-border rounded-xs shadow-sm  pointer-events-auto"
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
                        <div className="flex flex-col items-center gap-2">
                          <IconButton
                            title="Edit group"
                            aria-label="Edit group"
                            rounded="full"
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditSingle(post)}
                          // tone="brand"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </IconButton>

                          <IconButton
                            title="Delete group"
                            aria-label="Delete group"
                            rounded="full"
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteSingle(post.id)}
                          // tone="brand"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </IconButton>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* 内容：给出与工具栏同等的顶部内边距，避免被遮挡。大约 40px，可按实际按钮高度微调 */}
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
            <Button
              onClick={loadMore}
              disabled={loadingMore || deleting}
              variant="outline"
              size="md"
              leftIcon={loadingMore ? <Spinner className="h-4 w-4" /> : undefined}
            >
              {loadingMore ? "Loading…" : "Load more"}
            </Button>
          ) : (
            <span className="text-sm text-gray">No more results</span>
          )}
        </div>
      )}
    </div>
  );
}
