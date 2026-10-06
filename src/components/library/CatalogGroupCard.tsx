"use client";

import React from "react";
import Link from "next/link";
import type { LibraryCatalogGroup } from "@/app/types/library";

/** 目录里的一组（同一本书的所有在架复本） */
export default function CatalogGroupCard({ group }: { group: LibraryCatalogGroup }) {
  // 详情页链接：优先一件可借的复本，否则第一件
  const target = group.items.find((c) => c.available) ?? group.items[0];
  const allOut = group.available === 0;
  const byline = [group.creator, group.publisher].filter(Boolean).join(" · ");

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-dark-gray break-words">{group.title}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${allOut ? "bg-gray-100 text-dark-gray" : "bg-dark-green/10 text-dark-green"}`}
        >
          {allOut
            ? "All copies are out"
            : `${group.total} ${group.total === 1 ? "copy" : "copies"}, ${group.available} available`}
        </span>
      </div>

      {byline && <p className="mt-1 text-sm text-dark-gray/80 break-words">{byline}</p>}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-dark-gray/70">
        <span>{group.category}</span>
        {group.item_type !== "book" && <span className="uppercase">{group.item_type}</span>}
        {/* 编号：借出的置灰划线，方便到书架上找 */}
        {group.items.some((c) => c.call_number) && (
          <span className="inline-flex flex-wrap gap-x-1.5">
            {group.items.map((c) =>
              c.call_number ? (
                <span
                  key={c.id}
                  className={c.available ? "text-dark-gray" : "line-through opacity-60"}
                  title={c.available ? "Available" : "Borrowed"}
                >
                  {c.call_number}
                </span>
              ) : null
            )}
          </span>
        )}
      </div>
    </>
  );

  const className = "block rounded-md border border-border bg-white p-3 hover:border-dark-green/40 transition";
  return target ? (
    <Link href={`/library/items/${target.id}`} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
