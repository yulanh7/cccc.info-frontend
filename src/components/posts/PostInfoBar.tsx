// components/posts/PostInfoBar.tsx
"use client";

import React from "react";
import { PencilSquareIcon, TrashIcon, CalendarIcon, UsersIcon } from "@heroicons/react/24/outline";
import IconButton from "@/components/ui/IconButton";
import type { PostDetailData } from "@/app/types";
import Link from 'next/link';

type Props = {
  post: PostDetailData;
  canManage: boolean;
  onEditPost: () => void;
  onDeletePost: () => void;
  formatDate: (timestamp: string, showTime?: boolean) => string;
};

export default function PostInfoBar({
  post,
  canManage,
  onEditPost,
  onDeletePost,
  formatDate,
}: Props) {
  return (
    <section className="mb-4 md:mb-6 bg-page-header-bg p-4 md:p-6 mt-0 md:mt-1">
      <div className="container mx-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2">

                <h2 className="text-white md:text-lg font-semibold">
                  {post.title}
                </h2>
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow/40 text-white text-xs font-semibold">
                    {(post.author?.firstName?.[0] || "?").toUpperCase()}
                  </span>
                  <span>{post.author?.firstName}</span>
                </span>
              </div>
              {canManage && (
                <span className="text-[10px] px-1.5 py-0.5 rounded border border-yellow text-yellow">
                  Owner
                </span>
              )}
            </div>

            {/* 可选：如果你想把摘要/描述放这里 */}
            {post.description && (
              <p className="my-2 md:mr-10 text-sm text-white whitespace-pre-line">
                {post.description}
              </p>
            )}
          </div>

          {/* 右上角操作（仅可管理者可见） */}
          {canManage && (
            <div className="hidden md:flex items-center gap-2">
              <IconButton
                className="text-white"
                title="Edit post"
                aria-label="Edit post"
                variant="ghost"
                size="md"
                onClick={onEditPost}
              >
                <PencilSquareIcon className="h-5 w-5" />
              </IconButton>

              <IconButton
                title="Delete post"
                aria-label="Delete post"
                variant="ghost"
                className="text-white"
                size="md"
                onClick={onDeletePost}
              >
                <TrashIcon className="h-5 w-5" />
              </IconButton>
            </div>
          )}
        </div>

        {/* 元信息 */}
        <div className="flex justify-between mt-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white">
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow/40 text-white text-xs font-semibold">
                {(post.author?.firstName?.[0] || "?").toUpperCase()}
              </span>
              <span>{post.author?.firstName}</span>
            </span>
            <Link
              href={`/groups/${post.group?.id}`}
            >
              <span className="inline-flex items-center gap-1.5">
                <UsersIcon className="h-5 w-5" />
                {post.group?.name}
              </span>
            </Link>
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon className="h-5 w-5" />
              <time dateTime={post.created_at} className="font-medium">
                {post.created_at ? formatDate(post.created_at) : "—"}
              </time>
            </span>
          </div>

          {/* 移动端也要能操作：可选在这里加按钮；当前保持和 GroupInfoBar 一致（仅桌面显示） */}
        </div>
      </div>
    </section>
  );
}
