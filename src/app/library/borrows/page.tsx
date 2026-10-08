"use client";
import { Suspense } from "react";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useBackNavigation, useScrollRestoration } from "@/hooks/useBackNavigation";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import { fetchAdminBorrows, returnLibraryBorrow } from "@/app/features/library/slice";
import { canManageLibrary } from "@/app/types/library";
import type { LibraryBorrow, LibraryBorrowStatus } from "@/app/types/library";
import { formatDate } from "@/app/ultility";
import { LIBRARY_PER_PAGE } from "@/app/constants";
import PageTitle from "@/components/layout/PageTitle";
import CustomHeader from "@/components/layout/CustomHeader";
import LoadingOverlay from "@/components/feedback/LoadingOverLay";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ConfirmModal";
import { useConfirm } from "@/hooks/useConfirm";
import SearchBar from "@/components/SearchBar";
import { errorMessage } from "@/app/lib/errors";

const BORROWS_PATH = "/library/borrows";

export default function LibraryBorrowsPage() {
  return (
    <Suspense fallback={<LoadingOverlay show text="Loading borrows…" />}>
      <LibraryBorrowsPageInner />
    </Suspense>
  );
}

const positiveInt = (v: string | null) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

function LibraryBorrowsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const goBack = useBackNavigation("/library");

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const currentUser = useAppSelector((s) => s.auth.user);
  const canAccess = canManageLibrary(currentUser);
  const { list, pagination, status, error } = useAppSelector((s) => s.library.adminBorrows);
  // 通过返回回到这一页时，滚回离开前的位置
  useScrollRestoration(status === "succeeded");

  // ===== URL 参数：status / user_id / item_id / page（user_name、item_label 只用于显示筛选标签）
  const statusParam = searchParams.get("status");
  const statusFilter: LibraryBorrowStatus | undefined =
    statusParam === "active" || statusParam === "returned" ? statusParam : undefined;
  const qParam = (searchParams.get("q") || "").trim();
  const userId = positiveInt(searchParams.get("user_id"));
  const itemId = positiveInt(searchParams.get("item_id"));
  const userLabel = searchParams.get("user_name") || (userId ? `User #${userId}` : "");
  const itemLabel = searchParams.get("item_label") || (itemId ? `Item #${itemId}` : "");
  const currentPage = useMemo(() => {
    const p = Number(searchParams.get("page"));
    return Number.isFinite(p) && p > 0 ? p : 1;
  }, [searchParams]);

  const pushQuery = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
    if (!("page" in patch)) params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${BORROWS_PATH}?${qs}` : BORROWS_PATH);
  };

  const load = () =>
    dispatch(
      fetchAdminBorrows({
        q: qParam || undefined,
        status: statusFilter,
        user_id: userId,
        item_id: itemId,
        page: currentPage,
        per_page: LIBRARY_PER_PAGE,
      })
    );

  useEffect(() => {
    if (!mounted || !canAccess) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, mounted, canAccess, qParam, statusFilter, userId, itemId, currentPage]);

  // ===== 文字搜索：借阅人名字 / 邮箱、书名、编号
  const [qInput, setQInput] = useState(qParam);
  useEffect(() => setQInput(qParam), [qParam]);

  // ===== 代还
  const confirmReturn = useConfirm<LibraryBorrow>("Register this return?");
  const [returningId, setReturningId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const doReturn = async (b: LibraryBorrow | null) => {
    if (!b) return;
    setReturningId(b.id);
    setActionError(null);
    try {
      await dispatch(returnLibraryBorrow(b.id)).unwrap();
    } catch (e) {
      setActionError(errorMessage(e, "Return failed"));
    } finally {
      setReturningId(null);
      load();
    }
  };

  const listLoading = status === "loading";
  const totalPages = pagination?.pages ?? 1;

  const chip = (label: string, onClear: () => void) => (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2 py-0.5 text-xs">
      {label}
      <button type="button" aria-label={`Clear ${label}`} onClick={onClear}>
        <XMarkIcon className="h-3.5 w-3.5" />
      </button>
    </span>
  );

  return (
    <>
      <LoadingOverlay show={!mounted} text="Loading borrows…" />
      <CustomHeader pageTitle="Borrow history" backHref="/library" backText="Library" backLabel="Back to library" />
      <PageTitle title="Borrow history" showPageTitle />

      <div className="mx-auto w-full max-w-4xl p-4 min-h-screen mt-0 md:mt-16">
        <Link href="/library" onClick={goBack} className="hidden md:inline-flex items-center gap-1 text-sm text-dark-gray hover:text-dark-green mb-3">
          <ChevronLeftIcon className="h-4 w-4" />
          Back to library
        </Link>

        {mounted && !canAccess ? (
          <p className="text-sm text-dark-gray">Only library managers can see all borrows.</p>
        ) : (
          <>
            {/* 状态：三个并排按钮 */}
            <div className="grid grid-cols-3 overflow-hidden rounded-sm border border-border bg-white text-[16px]" role="tablist" aria-label="Status">
              {([
                [undefined, "All"],
                ["active", "On loan"],
                ["returned", "Returned"],
              ] as Array<[LibraryBorrowStatus | undefined, string]>).map(([value, label], i) => {
                const selected = statusFilter === value;
                return (
                  <button
                    key={label}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => pushQuery({ status: value })}
                    className={`h-10 px-2 ${i > 0 ? "border-l border-border" : ""} ${selected ? "bg-dark-green text-white" : "text-dark-gray hover:bg-gray-50"}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="mt-3">
              <SearchBar
                value={qInput}
                onChange={setQInput}
                onSubmit={(e) => {
                  e.preventDefault();
                  pushQuery({ q: qInput.trim() || undefined });
                }}
                onClear={() => {
                  setQInput("");
                  pushQuery({ q: undefined });
                }}
                placeholder="Borrower, title or no."
                sticky={false}
                size="lg"
              />
            </div>

            {/* 从馆藏管理页某一本的 "Borrow history" 进来时，只看这一本；点 ✕ 看全部 */}
            {(userId || itemId) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {userId && chip(`Showing borrows by ${userLabel}`, () => pushQuery({ user_id: undefined, user_name: undefined }))}
                {itemId && chip(`Showing borrows for ${itemLabel}`, () => pushQuery({ item_id: undefined, item_label: undefined }))}
              </div>
            )}

            {(error || actionError) && <p className="mt-3 text-sm text-red-600" role="alert">{actionError || error}</p>}

            <div className="mt-4 rounded-md border border-border bg-white relative min-h-[120px]">
              {listLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                  <span className="inline-block h-5 w-5 rounded-full border-2 border-current border-t-transparent animate-spin" aria-label="Loading" />
                </div>
              )}

              {list.length === 0 && !listLoading && status !== "idle" ? (
                <p className="p-4 text-sm text-dark-gray">No borrows found.</p>
              ) : list.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border last:border-b-0 p-3 text-sm">
                  {/* 手机上信息独占一行、按钮换到下一行；sm 以上左右排列 */}
                  <div className="min-w-0 flex-1 basis-full sm:basis-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {b.item.call_number && <span className="font-mono text-xs text-dark-gray/80">{b.item.call_number}</span>}
                      <span className="font-medium text-dark-gray break-words">{b.item.title}</span>
                      {!b.returned_at && (
                        <span className="rounded-full bg-dark-green/10 px-2 py-0.5 text-[10px] text-dark-green">On loan</span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-dark-gray">
                      {b.user.firstName}
                      {b.user.email ? ` (${b.user.email})` : ""}
                    </div>
                    <div className="mt-0.5 text-xs text-dark-gray/70">
                      Borrowed {formatDate(b.borrowed_at)}
                      {b.borrowed_by && b.borrowed_by.id !== b.user.id && ` · lent by ${b.borrowed_by.firstName}`}
                      {b.returned_at && (
                        <>
                          {" · "}Returned {formatDate(b.returned_at)}
                          {b.returned_by && b.returned_by.id !== b.user.id && ` · registered by ${b.returned_by.firstName}`}
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
                      onClick={() => confirmReturn.ask(b, `Register the return of "${b.item.title}" from ${b.user.firstName}?`)}
                    >
                      Return
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => pushQuery({ page: String(p) })} />
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmReturn.open}
        title="Register return"
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
