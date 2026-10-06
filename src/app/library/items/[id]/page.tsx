"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeftIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import { fetchLibraryItem, borrowLibraryItem, clearLibraryDetail } from "@/app/features/library/slice";
import type { LibraryItemDetail } from "@/app/types/library";
import { formatDate } from "@/app/ultility";
import PageTitle from "@/components/layout/PageTitle";
import CustomHeader from "@/components/layout/CustomHeader";
import Button from "@/components/ui/Button";

/** 详情字段：值为 null / 空就不显示这一行；影音类的 creator / publisher 是讲员 / 制作单位 */
const detailRows = (item: LibraryItemDetail): Array<[string, React.ReactNode]> => {
  const isBook = item.item_type === "book";
  const rows: Array<[string, React.ReactNode]> = [
    ["Call number", item.call_number],
    [isBook ? "Author" : "Speaker", item.creator],
    [isBook ? "Publisher" : "Producer", item.publisher],
    ["Place of publication", item.publish_place],
    ["Year", item.year],
    ["Category", item.category],
    ["Type", isBook ? null : item.item_type.toUpperCase()],
    ["Language", item.language],
    ["Subtitles", item.subtitles],
    ["Discs", item.disc_count],
    ["Duration", item.duration],
    ["Catalogued", item.catalog_date],
    ["Barcode", item.barcode],
  ];
  return rows.filter(([, v]) => v !== null && v !== undefined && v !== "");
};

export default function LibraryItemPage() {
  const { id } = useParams<{ id: string }>();
  const itemId = Number(id);
  const dispatch = useAppDispatch();
  const { item, status, error } = useAppSelector((s) => s.library.detail);

  const [borrowing, setBorrowing] = useState(false);
  const [borrowedCallNumber, setBorrowedCallNumber] = useState<string | null>(null);
  const [borrowedOk, setBorrowedOk] = useState(false);
  const [borrowError, setBorrowError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(itemId)) return;
    setBorrowedOk(false);
    setBorrowError(null);
    dispatch(fetchLibraryItem(itemId));
    return () => {
      dispatch(clearLibraryDetail());
    };
  }, [dispatch, itemId]);

  // 是否还能借：看所有复本，不看这一件自己
  const anyAvailable = !!item?.copies.some((c) => c.available);

  // “借这本书”：带 any_copy，这件被借走时后端会自动换另一个可借复本
  const handleBorrow = async () => {
    if (!item) return;
    setBorrowing(true);
    setBorrowError(null);
    setBorrowedOk(false);
    try {
      const res = await dispatch(borrowLibraryItem({ itemId: item.id, any_copy: true })).unwrap();
      setBorrowedCallNumber(res.item.call_number);
      setBorrowedOk(true);
    } catch (e: any) {
      setBorrowError(typeof e === "string" ? e : e?.message || "Borrow failed");
    } finally {
      setBorrowing(false);
      // 成功或 409 都刷新复本状态
      dispatch(fetchLibraryItem(item.id));
    }
  };

  const loading = status === "loading" && !item;

  return (
    <>
      <CustomHeader pageTitle={item?.title ?? "Library"} />
      <PageTitle title="Library" showPageTitle />

      <div className="mx-auto w-full max-w-3xl p-4 min-h-screen mt-0 md:mt-16">
        <Link href="/library" className="hidden md:inline-flex items-center gap-1 text-sm text-dark-gray hover:text-dark-green mb-3">
          <ChevronLeftIcon className="h-4 w-4" />
          Back to library
        </Link>

        {loading && <p className="text-sm text-dark-gray">Loading…</p>}
        {status === "failed" && !item && <p className="text-sm text-red-600">{error}</p>}

        {item && (
          <div className="rounded-md border border-border bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h1 className="text-lg font-semibold text-dark-gray break-words">{item.title}</h1>
              {!item.is_active && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-dark-gray">Withdrawn</span>
              )}
            </div>

            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              {detailRows(item).map(([label, value]) => (
                <React.Fragment key={label}>
                  <dt className="text-dark-gray/70">{label}</dt>
                  <dd className="text-dark-gray break-words">{value}</dd>
                </React.Fragment>
              ))}
            </dl>

            {/* 复本 */}
            <h2 className="mt-5 mb-2 text-sm font-medium text-dark-gray">
              Copies ({item.copies.filter((c) => c.available).length} of {item.copies.length} available)
            </h2>
            <ul className="divide-y divide-border rounded-sm border border-border text-sm">
              {item.copies.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-3 py-2">
                  <span className={c.id === item.id ? "font-medium" : ""}>
                    {c.call_number ?? <span className="text-dark-gray/60">No call number</span>}
                  </span>
                  <span className={c.available ? "text-dark-green" : "text-dark-gray/60"}>
                    {c.available ? "Available" : "Borrowed"}
                  </span>
                </li>
              ))}
            </ul>

            {/* 图书管理员才会拿到 current_borrow */}
            {item.current_borrow && (
              <p className="mt-2 text-xs text-dark-gray/80">
                This copy is borrowed by {item.current_borrow.user.firstName}
                {item.current_borrow.user.email ? ` (${item.current_borrow.user.email})` : ""} since{" "}
                {formatDate(item.current_borrow.borrowed_at)}.
              </p>
            )}

            {/* 借书 */}
            <div className="mt-5">
              {borrowedOk && (
                <p className="mb-3 flex items-start gap-1.5 rounded-sm border border-dark-green/30 bg-dark-green/5 p-3 text-sm text-dark-green" role="status">
                  <CheckCircleIcon className="h-5 w-5 shrink-0" />
                  <span>
                    {borrowedCallNumber
                      ? <>You borrowed <strong>{borrowedCallNumber}</strong>. Look for this call number on the shelf.</>
                      : "You borrowed this item."}
                  </span>
                </p>
              )}
              {borrowError && <p className="mb-3 text-sm text-red-600" role="alert">{borrowError}</p>}

              {item.is_active && (
                <Button
                  variant="primary"
                  onClick={handleBorrow}
                  disabled={!anyAvailable}
                  loading={borrowing}
                  loadingText="Borrowing…"
                  title={anyAvailable ? undefined : "All copies are out"}
                >
                  {!anyAvailable ? "All copies are out" : item.item_type === "book" ? "Borrow this book" : "Borrow this item"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
