"use client";
import { Suspense } from "react";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { useBackNavigation, useScrollRestoration } from "@/hooks/useBackNavigation";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import { fetchMyBorrows, returnLibraryBorrow } from "@/app/features/library/slice";
import type { LibraryBorrow } from "@/app/types/library";
import { formatDate } from "@/app/ultility";
import { LIBRARY_PER_PAGE } from "@/app/constants";
import PageTitle from "@/components/layout/PageTitle";
import CustomHeader from "@/components/layout/CustomHeader";
import LoadingOverlay from "@/components/feedback/LoadingOverLay";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ConfirmModal";
import { useConfirm } from "@/hooks/useConfirm";

const MY_BORROWS_PATH = "/library/my-borrows";
type Tab = "active" | "history";

export default function MyBorrowsPage() {
  return (
    <Suspense fallback={<LoadingOverlay show text="Loading your borrows…" />}>
      <MyBorrowsPageInner />
    </Suspense>
  );
}

function MyBorrowsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const goBack = useBackNavigation("/library");

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const currentUser = useAppSelector((s) => s.auth.user);
  const { list, pagination, status, error } = useAppSelector((s) => s.library.myBorrows);
  // 通过返回回到这一页时，滚回离开前的位置
  useScrollRestoration(status === "succeeded");

  // ===== URL 参数：tab / page
  const tab: Tab = searchParams.get("tab") === "history" ? "history" : "active";
  const currentPage = useMemo(() => {
    const p = Number(searchParams.get("page"));
    return Number.isFinite(p) && p > 0 ? p : 1;
  }, [searchParams]);

  const pushQuery = (nextTab: Tab, page = 1) => {
    const params = new URLSearchParams();
    if (nextTab === "history") params.set("tab", "history");
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    router.push(qs ? `${MY_BORROWS_PATH}?${qs}` : MY_BORROWS_PATH);
  };

  const load = () =>
    dispatch(
      fetchMyBorrows({
        status: tab === "history" ? "returned" : "active",
        page: currentPage,
        per_page: LIBRARY_PER_PAGE,
      })
    );

  useEffect(() => {
    if (!mounted) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, mounted, tab, currentPage]);

  // ===== 还书
  const confirmReturn = useConfirm<LibraryBorrow>("Return this item?");
  const [returningId, setReturningId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const doReturn = async (b: LibraryBorrow | null) => {
    if (!b) return;
    setReturningId(b.id);
    setActionError(null);
    try {
      await dispatch(returnLibraryBorrow(b.id)).unwrap();
    } catch (e: any) {
      setActionError(typeof e === "string" ? e : e?.message || "Return failed");
    } finally {
      setReturningId(null);
      // 还掉的从“借阅中”移到“历史”：重新拉当前页
      load();
    }
  };

  const listLoading = status === "loading";
  const totalPages = pagination?.pages ?? 1;

  const tabClass = (t: Tab) =>
    `px-3 py-1.5 text-sm border-b-2 ${tab === t ? "border-dark-green text-dark-green font-medium" : "border-transparent text-dark-gray hover:text-dark-green"}`;

  return (
    <>
      <LoadingOverlay show={!mounted} text="Loading your borrows…" />
      <CustomHeader pageTitle="My borrows" backHref="/library" backText="Library" backLabel="Back to library" />
      <PageTitle title="My borrows" showPageTitle />

      <div className="mx-auto w-full max-w-3xl p-4 min-h-screen mt-0 md:mt-16">
        <Link href="/library" onClick={goBack} className="hidden md:inline-flex items-center gap-1 text-sm text-dark-gray hover:text-dark-green mb-3">
          <ChevronLeftIcon className="h-4 w-4" />
          Back to library
        </Link>

        <div className="flex gap-2 border-b border-border" role="tablist">
          <button role="tab" aria-selected={tab === "active"} className={tabClass("active")} onClick={() => pushQuery("active")}>
            Borrowed
          </button>
          <button role="tab" aria-selected={tab === "history"} className={tabClass("history")} onClick={() => pushQuery("history")}>
            History
          </button>
        </div>

        {(error || actionError) && <p className="mt-3 text-sm text-red-600" role="alert">{actionError || error}</p>}

        <div className="mt-4 relative min-h-[120px]">
          {listLoading && (
            <div className="absolute inset-0 bg-bg/60 backdrop-blur-[1px] flex items-center justify-center z-10">
              <span className="inline-block h-5 w-5 rounded-full border-2 border-current border-t-transparent animate-spin" aria-label="Loading" />
            </div>
          )}

          {list.length === 0 && !listLoading && status !== "idle" ? (
            <p className="text-sm text-dark-gray">
              {tab === "active" ? (
                <>You have nothing borrowed. <Link href="/library" className="underline">Browse the library</Link></>
              ) : (
                "No returned items yet."
              )}
            </p>
          ) : (
            <ul className="space-y-2">
              {list.map((b) => {
                const proxyBorrowed = b.borrowed_by && currentUser && b.borrowed_by.id !== currentUser.id;
                const proxyReturned = b.returned_by && currentUser && b.returned_by.id !== currentUser.id;
                return (
                  <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-white p-3 text-sm">
                    <div className="min-w-0">
                      <span className="font-medium text-dark-gray break-words">{b.item.title}</span>
                      <div className="mt-0.5 text-xs text-dark-gray/70">
                        {[b.item.call_number, b.item.category].filter(Boolean).join(" · ")}
                      </div>
                      <div className="mt-0.5 text-xs text-dark-gray/70">
                        Borrowed {formatDate(b.borrowed_at)}
                        {proxyBorrowed && ` by ${b.borrowed_by!.firstName}`}
                        {b.returned_at && (
                          <>
                            {" · "}Returned {formatDate(b.returned_at)}
                            {proxyReturned && ` by ${b.returned_by!.firstName}`}
                          </>
                        )}
                      </div>
                    </div>

                    {!b.returned_at && (
                      <Button
                        size="sm"
                        variant="outline"
                        tone="brand"
                        loading={returningId === b.id}
                        loadingText="Returning…"
                        onClick={() => confirmReturn.ask(b, `Return "${b.item.title}"${b.item.call_number ? ` (${b.item.call_number})` : ""}?`)}
                      >
                        Return
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => pushQuery(tab, p)} />
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmReturn.open}
        title="Return item"
        message={confirmReturn.message}
        confirmLabel="Return"
        confirmVariant="primary"
        cancelLabel="Cancel"
        cancelVariant="outline"
        onCancel={confirmReturn.cancel}
        onClose={confirmReturn.cancel}
        onConfirm={confirmReturn.confirm(doReturn)}
      />
    </>
  );
}
