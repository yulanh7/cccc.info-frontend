"use client";

import React from "react";
import Link from "next/link";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import type { LibraryCatalogGroup } from "@/app/types/library";
import Button from "@/components/ui/Button";

/** 借书结果：成功时带实际借到的编号 */
export type CatalogBorrowResult =
  | { ok: true; callNumber: string | null }
  | { ok: false; message: string };

type Props = {
  group: LibraryCatalogGroup;
  onBorrow: (group: LibraryCatalogGroup) => void;
  borrowing?: boolean;
  result?: CatalogBorrowResult;
};

/** 目录里的一组（同一本书的所有在架复本），直接在这里借 */
export default function CatalogGroupCard({ group, onBorrow, borrowing = false, result }: Props) {
  const allOut = group.available === 0;
  const byline = [group.creator, group.publisher].filter(Boolean).join(" · ");
  const numbered = group.items.filter((c) => c.call_number);

  return (
    <div className="rounded-md border border-border bg-white p-3">
      {/* 上：书名 + 分类；影音类的分类名就是 DVD / CD / MP3 / VCD，不再另外显示类型 */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 font-medium text-dark-gray break-words">{group.title}</h3>
        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-dark-gray/80">
          {group.category}
        </span>
      </div>
      {byline && <p className="mt-0.5 text-sm text-dark-gray/80 break-words">{byline}</p>}

      {/* 下：书架编号（左）+ 可借数量和借书按钮（右下） */}
      <div className="mt-2 flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
        {/* 借出的置灰划线；管理员额外看到借阅人（只有管理员的响应带 current_borrow） */}
        {numbered.length > 0 ? (
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs">
            <span className="text-dark-gray/60">Shelf no.</span>
            {numbered.map((c) => (
              <span
                key={c.id}
                className={`rounded-sm border px-1.5 py-0.5 ${c.available ? "border-dark-green/40 text-dark-gray" : "border-border text-dark-gray/50"}`}
                title={c.available ? "Available" : c.current_borrow ? `Borrowed by ${c.current_borrow.user.firstName}` : "Borrowed"}
              >
                <span className={c.available ? "" : "line-through"}>{c.call_number}</span>
                {c.current_borrow && (
                  <span className="ml-1 text-dark-gray/80">({c.current_borrow.user.firstName})</span>
                )}
              </span>
            ))}
          </div>
        ) : (
          <span />
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <span className="text-[11px] text-dark-gray/70">
            {group.available} of {group.total} available
          </span>
          <Button
            size="sm"
            variant={allOut ? "outline" : "primary"}
            disabled={allOut}
            loading={borrowing}
            loadingText="Borrowing…"
            onClick={() => onBorrow(group)}
          >
            {allOut ? "All out" : "Borrow"}
          </Button>
        </div>
      </div>

      {result?.ok && (
        <p className="mt-2 flex items-start gap-1.5 rounded-sm border border-dark-green/30 bg-dark-green/5 p-2 text-sm text-dark-green" role="status">
          <CheckCircleIcon className="h-5 w-5 shrink-0" />
          <span>
            {result.callNumber
              ? <>Borrowed <strong>{result.callNumber}</strong>. Find this number on the shelf.</>
              : "Borrowed."}{" "}
            <Link href="/library/my-borrows" className="underline">My borrows</Link>
          </span>
        </p>
      )}
      {result && !result.ok && (
        <p className="mt-2 text-sm text-red-600" role="alert">{result.message}</p>
      )}
    </div>
  );
}
