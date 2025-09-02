"use client";
import React, { useMemo } from "react";
import Link from "next/link";
import { PaginationProps } from "@/app/types/group"

type PageItem = number | "ellipsis";

function getPageItems(current: number, total: number, siblingCount = 1): PageItem[] {
  const items: PageItem[] = [];
  const first = 1;
  const last = total;

  const left = Math.max(first, current - siblingCount);
  const right = Math.min(last, current + siblingCount);

  items.push(first);
  if (left > first + 1) items.push("ellipsis");

  for (let p = left; p <= right; p++) {
    if (p !== first && p !== last) items.push(p);
  }

  if (right < last - 1) items.push("ellipsis");
  if (last !== first) items.push(last);

  return items.filter((v, i, arr) => (i === 0 ? true : v !== arr[i - 1]));
}



export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className = "",
}: PaginationProps) {
  const items = useMemo(
    () => getPageItems(currentPage, Math.max(1, totalPages), siblingCount),
    [currentPage, totalPages, siblingCount]
  );

  const buildHref = (p: number) => {
    const sp = new URLSearchParams(window.location.search);
    sp.set("page", String(p));
    return `${window.location.pathname}?${sp.toString()}`;
  };
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className={className}>

      <ul className="flex items-center gap-2">
        <li>
          {buildHref ? (
            currentPage > 1 ? (
              <Link href={buildHref(currentPage - 1)} className="w-9 h-9 inline-flex items-center justify-center rounded-sm border border-border text-sm bg-white hover:bg-gray-50 text-dark-gray">
                ‹
              </Link>
            ) : (
              <span className="w-9 h-9 inline-flex items-center justify-center rounded-sm border border-border text-sm bg-light-gray text-dark-gray cursor-default">‹</span>
            )
          ) : (
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => onPageChange?.(currentPage - 1)}
              className={`w-9 h-9 inline-flex items-center justify-center rounded-sm border border-border text-sm ${currentPage === 1 ? "bg-light-gray text-dark-gray cursor-default" : "bg-white hover:bg-gray-50 text-dark-gray"}`}
            >
              ‹
            </button>
          )}
        </li>
        {items.map((item, idx) => {
          if (item === "ellipsis") {
            return (
              <li key={`e-${idx}`}>
                <span className="px-2 text-gray select-none">…</span>
              </li>
            );
          }

          const isActive = item === currentPage;
          const base =
            "w-9 h-9 inline-flex items-center justify-center rounded-sm border border-border text-sm";
          const active =
            "bg-light-gray text-dark-gray cursor-default pointer-events-none";
          const normal = "bg-white hover:bg-gray-50 text-dark-gray";

          const content = (
            <span aria-current={isActive ? "page" : undefined}>{item}</span>
          );

          return (
            <li key={item}>
              {buildHref ? (
                isActive ? (
                  <span className={`${base} ${active}`}>{content}</span>
                ) : (
                  <Link href={buildHref(item)} scroll className={`${base} ${normal}`}>
                    {content}
                  </Link>
                )
              ) : (
                <button
                  type="button"
                  disabled={isActive}
                  onClick={() => !isActive && onPageChange?.(item)}
                  className={`${base} ${isActive ? active : normal}`}
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
        <li>
          {buildHref ? (
            currentPage < totalPages ? (
              <Link href={buildHref(currentPage + 1)} className="w-9 h-9 inline-flex items-center justify-center rounded-sm border border-border text-sm bg-white hover:bg-gray-50 text-dark-gray">
                ›
              </Link>
            ) : (
              <span className="w-9 h-9 inline-flex items-center justify-center rounded-sm border border-border text-sm bg-light-gray text-dark-gray cursor-default">›</span>
            )
          ) : (
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange?.(currentPage + 1)}
              className={`w-9 h-9 inline-flex items-center justify-center rounded-sm border border-border text-sm ${currentPage === totalPages ? "bg-light-gray text-dark-gray cursor-default" : "bg-white hover:bg-gray-50 text-dark-gray"}`}
            >
              ›
            </button>
          )}
        </li>

      </ul>
    </nav>
  );
}
