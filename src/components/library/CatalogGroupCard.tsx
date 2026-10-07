"use client";

import React from "react";
import Link from "next/link";
import type { LibraryCatalogGroup, LibraryCopy } from "@/app/types/library";
import { formatDate } from "@/app/ultility";
import Button from "@/components/ui/Button";

/** 借 / 还失败时卡片底部的提示；成功不用提示，那一行的状态本身会变 */
export type CatalogActionError = { message: string };

/** 自己借的那一件：用来显示 "Borrowed by you" 和还书 */
export type OwnBorrow = { borrowId: number; borrowedAt: string };

/** 图书管理员每一件的操作；不传 = 普通读者视图 */
export type CatalogManagerActions = {
  onWithdraw: (copy: LibraryCopy) => void;
  onRestore: (copy: LibraryCopy) => void;
  onEdit: (copy: LibraryCopy) => void;
  onLend: (copy: LibraryCopy) => void;
  onReturnFor: (copy: LibraryCopy, borrowId: number) => void;
  historyHref: (copy: LibraryCopy) => string;
};

type Props = {
  group: LibraryCatalogGroup;
  /** 按馆藏 id 查“我借的那一件”（来自我的借阅中） */
  ownBorrows: Record<number, OwnBorrow>;
  /** 正在操作的那一件 */
  busyCopyId?: number | null;
  error?: CatalogActionError;
  onBorrow: (group: LibraryCatalogGroup, copy: LibraryCopy) => void;
  onReturn: (group: LibraryCatalogGroup, copy: LibraryCopy, borrowId: number) => void;
  manager?: CatalogManagerActions;
};

/** 目录里的一组（同一本书的所有复本）：每一件单独一行。
 *  普通读者：编号 · 状态 · Borrow / Return
 *  图书管理员：编号 · 状态 · Borrow history，下面一排 [Withdraw|Restore] [Edit] [Lend|Return]（不显示借阅人） */
export default function CatalogGroupCard({ group, ownBorrows, busyCopyId, error, onBorrow, onReturn, manager }: Props) {
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

      <ul className="mt-2 divide-y divide-border border-t border-border">
        {group.items.map((c) => {
          const own = ownBorrows[c.id];
          const busy = busyCopyId === c.id;
          const withdrawn = c.is_active === false;
          const onLoan = !withdrawn && !c.available;
          // 编号固定宽度对齐；没有编号显示 —
          const number = (
            <span className="w-14 shrink-0 text-xs font-medium text-dark-gray">{c.call_number ?? "—"}</span>
          );

          if (manager) {
            // 代还要用借阅记录 id：自己借的来自我的借阅，别人借的来自 current_borrow（不显示借阅人）
            const borrowId = own?.borrowId ?? c.current_borrow?.id;
            const status = withdrawn ? (
              <span className="text-dark-gray/60">Withdrawn</span>
            ) : own ? (
              <span className="font-medium text-dark-green">Borrowed by you</span>
            ) : onLoan ? (
              <span className="text-amber-700">On loan</span>
            ) : (
              <span className="text-dark-green">Available</span>
            );
            return (
              <li key={c.id} className="py-2 text-sm">
                <div className="flex items-center gap-2">
                  {number}
                  <span className="min-w-0 flex-1 text-xs">{status}</span>
                  <Link href={manager.historyHref(c)} className="shrink-0 text-xs text-dark-gray underline underline-offset-2 hover:text-dark-green">
                    Borrow history
                  </Link>
                </div>
                {/* 位置固定：左 下架/恢复 · 中 编辑 · 右 代借/代还（主要操作在右边）。
                    手机上三等分全宽；电脑上靠右、每个一样宽 */}
                <div className="mt-1.5 grid grid-cols-3 gap-2 sm:flex sm:justify-end sm:[&>button]:w-[100px]">
                  {withdrawn ? (
                    <Button size="sm" variant="outline" tone="brand" disabled={busy} onClick={() => manager.onRestore(c)}>
                      Restore
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      tone="danger"
                      disabled={busy || onLoan}
                      title={onLoan ? "Register the return first" : undefined}
                      onClick={() => manager.onWithdraw(c)}
                    >
                      Withdraw
                    </Button>
                  )}
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => manager.onEdit(c)}>
                    Edit
                  </Button>
                  {onLoan ? (
                    <Button
                      size="sm"
                      variant="outline"
                      tone="brand"
                      loading={busy}
                      loadingText="Returning…"
                      disabled={!borrowId}
                      onClick={() => borrowId && manager.onReturnFor(c, borrowId)}
                    >
                      Return
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      loading={busy && !withdrawn}
                      loadingText="Lending…"
                      disabled={withdrawn}
                      onClick={() => manager.onLend(c)}
                    >
                      Lend
                    </Button>
                  )}
                </div>
              </li>
            );
          }

          // ===== 普通读者
          let status: React.ReactNode;
          if (c.available) status = <span className="text-dark-green">Available</span>;
          else if (own) status = <span className="font-medium text-dark-green">Borrowed by you · {formatDate(own.borrowedAt)}</span>;
          else status = <span className="text-dark-gray/60">Borrowed</span>;

          return (
            <li key={c.id} className="flex items-center gap-2 py-1.5 text-sm">
              {number}
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
