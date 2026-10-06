"use client";

import React from "react";
import type { LibraryCatalogGroup, LibraryCopy } from "@/app/types/library";
import { formatDate } from "@/app/ultility";
import Button from "@/components/ui/Button";

/** 借 / 还失败时卡片底部的提示；成功不用提示，那一行的状态本身会变 */
export type CatalogActionError = { message: string };

/** 自己借的那一件：用来显示 "Borrowed by you" 和还书 */
export type OwnBorrow = { borrowId: number; borrowedAt: string };

type Props = {
  group: LibraryCatalogGroup;
  /** 按馆藏 id 查“我借的那一件”（来自我的借阅中） */
  ownBorrows: Record<number, OwnBorrow>;
  currentUserId?: number | null;
  /** 正在借 / 还的那一件 */
  busyCopyId?: number | null;
  error?: CatalogActionError;
  onBorrow: (group: LibraryCatalogGroup, copy: LibraryCopy) => void;
  onReturn: (group: LibraryCatalogGroup, copy: LibraryCopy, borrowId: number) => void;
};

/** 目录里的一组（同一本书的所有在架复本）：每一件单独一行，各自借 / 还 */
export default function CatalogGroupCard({
  group,
  ownBorrows,
  currentUserId,
  busyCopyId,
  error,
  onBorrow,
  onReturn,
}: Props) {
  const byline = [group.creator, group.publisher].filter(Boolean).join(" · ");

  return (
    <div className="rounded-md border border-border bg-white p-3">
      {/* 书名 + 分类；影音类的分类名就是 DVD / CD / MP3 / VCD，不再另外显示类型 */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 font-medium text-dark-gray break-words">{group.title}</h3>
        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-dark-gray/80">
          {group.category}
        </span>
      </div>
      {byline && <p className="mt-0.5 text-sm text-dark-gray/80 break-words">{byline}</p>}

      {/* 每一件一行：编号 + 状态 + 按钮；自己借的用绿色加粗区分，不加底色 */}
      <ul className="mt-2 divide-y divide-border border-t border-border">
        {group.items.map((c) => {
          // 自己借的：普通用户从“我的借阅中”对上；管理员的目录响应自带 current_borrow
          const own: OwnBorrow | undefined =
            ownBorrows[c.id] ??
            (c.current_borrow && currentUserId != null && c.current_borrow.user.id === currentUserId
              ? { borrowId: c.current_borrow.id, borrowedAt: c.current_borrow.borrowed_at }
              : undefined);
          const busy = busyCopyId === c.id;

          let status: React.ReactNode;
          if (c.available) status = <span className="text-dark-green">Available</span>;
          else if (own) status = <span className="font-medium text-dark-green">Borrowed by you · {formatDate(own.borrowedAt)}</span>;
          else if (c.current_borrow)
            status = (
              <span className="text-dark-gray/80" title={c.current_borrow.user.email}>
                Borrowed by {c.current_borrow.user.firstName} · {formatDate(c.current_borrow.borrowed_at)}
              </span>
            );
          else status = <span className="text-dark-gray/60">Borrowed</span>;

          return (
            <li
              key={c.id}
              className="flex items-center gap-2 py-1.5 text-sm"
            >
              {/* 编号固定宽度对齐；没有编号显示 — */}
              <span className="w-14 shrink-0 text-xs font-medium text-dark-gray">{c.call_number ?? "—"}</span>
              <span className="min-w-0 flex-1 text-xs break-words">{status}</span>
              {c.available ? (
                <Button size="sm" variant="primary" loading={busy} loadingText="Borrowing…" onClick={() => onBorrow(group, c)}>
                  Borrow
                </Button>
              ) : own ? (
                <Button
                  size="sm"
                  variant="outline"
                  tone="brand"
                  loading={busy}
                  loadingText="Returning…"
                  onClick={() => onReturn(group, c, own.borrowId)}
                >
                  Return
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">{error.message}</p>
      )}
    </div>
  );
}
