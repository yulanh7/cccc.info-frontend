"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { PencilSquareIcon, TrashIcon, CalendarIcon } from "@heroicons/react/24/outline";
import CardSkeleton from "@/components/feedback/CardSkeleton";
import Spinner from "@/components/feedback/Spinner";
import type { GroupProps } from "@/app/types";
import Pagination from "@/components/Pagination";
import { ellipsize } from "@/app/ultility";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";

type Props = {
  rows: GroupProps[];
  listLoading: boolean;

  canEdit: (g: GroupProps) => boolean;
  isUserSubscribed: (g: GroupProps) => boolean;

  onEdit: (g: GroupProps) => void;
  onDelete: (id: number) => void;
  onToggleSubscription: (g: GroupProps) => void;

  saving: boolean;
  deleting: boolean;
  toggling: boolean;

  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;

  formatDate: (timestamp: string, showTime?: boolean) => string;
};

export default function GroupsMobileList({
  rows,
  listLoading,
  canEdit,
  isUserSubscribed,
  onEdit,
  onDelete,
  onToggleSubscription,
  saving,
  deleting,
  toggling,
  currentPage,
  totalPages,
  buildHref,
  formatDate,
}: Props) {
  const router = useRouter();

  return (
    <div className="space-y-4 mt-4">
      {listLoading && rows.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((group) => {
            const subbed = isUserSubscribed(group);

            return (
              <div
                key={group.id}
                // 整卡片点击进入详情
                onClick={() => router.push(`/groups/${group.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") router.push(`/groups/${group.id}`);
                }}
                role="button"
                tabIndex={0}
                className="
                  card relative p-3 cursor-pointer hover:shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dark-green
                "
                aria-label={`Open group ${group.title}`}
              >
                {/* 顶部右侧操作（外层阻止冒泡） */}
                {canEdit(group) && (
                  <div className="absolute right-2 top-2 z-10 flex space-x-2">
                    <div onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        title="Edit group"
                        aria-label="Edit group"
                        rounded="full"
                        variant="ghost"
                        tone="brand"
                        size="sm"
                        disabled={saving || deleting}
                        onClick={() => onEdit(group)}
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </IconButton>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        title="Delete group"
                        aria-label="Delete group"
                        rounded="full"
                        variant="ghost"
                        tone="danger"         // ← 红色
                        size="sm"
                        disabled={saving || deleting}
                        onClick={() => onDelete(group.id)}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </IconButton>
                    </div>
                  </div>
                )}

                {/* 标题 & 时间 */}
                <h2 className="text-lg font-semibold text-dark-gray mt-8">
                  {group.title}
                </h2>

                <p className="text-xs text-gray mb-1.5">
                  <span className="inline-flex items-center gap-1.5 text-yellow">
                    <CalendarIcon className="h-4 w-4" />
                    <time dateTime={group.createdDate} className="font-medium">
                      {group.createdDate ? formatDate(group.createdDate) : "—"}
                    </time>
                  </span>
                </p>

                {/* 描述（省略） */}
                <p
                  className="text-gray text-sm"
                  title={group.description || ""}
                >
                  {ellipsize(group.description || "", 80, { byWords: true })}
                </p>

                {/* 底部：作者 + 订阅按钮（按钮外层阻止冒泡） */}
                <div className="mt-2 flex justify-between items-center">
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-dark-green/10 text-dark-green text-xs font-semibold">
                      {(group.creator?.firstName?.[0] || "?").toUpperCase()}
                    </span>
                    <span>{group.creator?.firstName}</span>
                  </span>

                  <div onClick={(e) => e.stopPropagation()}>
                    <Button
                      className="min-w-28"
                      variant={subbed ? "outline" : "primary"}
                      tone={subbed ? "brand" : "default"}
                      disabled={saving || deleting || toggling}
                      aria-pressed={subbed}
                      aria-label={subbed ? "Unsubscribe" : "Subscribe"}
                      onClick={() => onToggleSubscription(group)}
                    >
                      {toggling ? (
                        <span className="inline-flex items-center gap-1">
                          <Spinner className="h-4 w-4" />
                          {subbed ? "Unsubscribing…" : "Subscribing…"}
                        </span>
                      ) : (
                        <>{subbed ? "Unsubscribe" : "Subscribe"}</>
                      )}
                    </Button>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!listLoading && (
        <div className="mt-6 flex justify-center">
          <Pagination currentPage={currentPage} totalPages={totalPages} buildHref={buildHref} />
        </div>
      )}
    </div>
  );
}
