"use client";
import { Suspense } from "react";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PlusIcon, ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import {
  fetchLibraryItems,
  fetchLibraryCategories,
  deactivateLibraryItem,
  restoreLibraryItem,
  returnLibraryBorrow,
} from "@/app/features/library/slice";
import { canManageLibrary } from "@/app/types/library";
import type { LibraryItem } from "@/app/types/library";
import { formatDate } from "@/app/ultility";
import { LIBRARY_PER_PAGE } from "@/app/constants";
import PageTitle from "@/components/layout/PageTitle";
import CustomHeader from "@/components/layout/CustomHeader";
import LoadingOverlay from "@/components/feedback/LoadingOverLay";
import SearchBar from "@/components/SearchBar";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ConfirmModal";
import { useConfirm } from "@/hooks/useConfirm";
import LibraryItemFormModal from "@/components/library/LibraryItemFormModal";
import LendItemModal from "@/components/library/LendItemModal";

const MANAGE_PATH = "/library/manage";
const SEARCH_DEBOUNCE_MS = 400;

export default function LibraryManagePage() {
  return (
    <Suspense fallback={<LoadingOverlay show text="Loading items…" />}>
      <LibraryManagePageInner />
    </Suspense>
  );
}

function LibraryManagePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const currentUser = useAppSelector((s) => s.auth.user);
  const canAccess = canManageLibrary(currentUser);
  const { adminItems, categories } = useAppSelector((s) => s.library);

  // ===== URL 参数：q / category / page
  const qParam = (searchParams.get("q") || "").trim();
  const categoryParam = searchParams.get("category") || "";
  const currentPage = useMemo(() => {
    const p = Number(searchParams.get("page"));
    return Number.isFinite(p) && p > 0 ? p : 1;
  }, [searchParams]);

  const [qInput, setQInput] = useState(qParam);
  useEffect(() => setQInput(qParam), [qParam]);

  const pushQuery = (next: Partial<{ q: string; category: string; page: number }>, replace = false) => {
    const params = new URLSearchParams();
    const q = next.q ?? qParam;
    const category = next.category ?? categoryParam;
    const page = next.page ?? 1;
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    const href = qs ? `${MANAGE_PATH}?${qs}` : MANAGE_PATH;
    if (replace) router.replace(href);
    else router.push(href);
  };

  // 搜索防抖
  useEffect(() => {
    const q = qInput.trim();
    if (q === qParam) return;
    const t = setTimeout(() => pushQuery({ q }, true), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput]);

  const load = () =>
    dispatch(
      fetchLibraryItems({
        q: qParam || undefined,
        category: categoryParam || undefined,
        include_inactive: true,
        page: currentPage,
        per_page: LIBRARY_PER_PAGE,
      })
    );

  useEffect(() => {
    if (!mounted || !canAccess) return;
    dispatch(fetchLibraryCategories());
  }, [dispatch, mounted, canAccess]);

  useEffect(() => {
    if (!mounted || !canAccess) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, mounted, canAccess, qParam, categoryParam, currentPage]);

  // ===== 新增 / 编辑
  const [editing, setEditing] = useState<LibraryItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const categoryNames = categories.list.map((c) => c.category);

  // ===== 下架 / 恢复
  const confirmWithdraw = useConfirm<LibraryItem>("Withdraw this item?");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const runAction = async (item: LibraryItem, action: "withdraw" | "restore") => {
    setBusyId(item.id);
    setActionError(null);
    setNotice(null);
    try {
      if (action === "withdraw") await dispatch(deactivateLibraryItem(item.id)).unwrap();
      else await dispatch(restoreLibraryItem(item.id)).unwrap();
      setNotice(`${action === "withdraw" ? "Withdrew" : "Restored"} "${item.title}".`);
      dispatch(fetchLibraryCategories());
    } catch (e: any) {
      setActionError(typeof e === "string" ? e : e?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  // ===== 代借 / 代还
  const [lending, setLending] = useState<LibraryItem | null>(null);
  const confirmReturn = useConfirm<LibraryItem>("Register this return?");

  const doReturn = async (item: LibraryItem | null) => {
    const borrow = item?.current_borrow;
    if (!item || !borrow) return;
    setBusyId(item.id);
    setActionError(null);
    setNotice(null);
    try {
      await dispatch(returnLibraryBorrow(borrow.id)).unwrap();
      setNotice(`Registered the return of "${item.title}".`);
    } catch (e: any) {
      setActionError(typeof e === "string" ? e : e?.message || "Return failed");
    } finally {
      setBusyId(null);
      load();
    }
  };

  const listLoading = adminItems.status === "loading";
  const totalPages = adminItems.pagination?.pages ?? 1;
  const total = adminItems.pagination?.total ?? 0;

  return (
    <>
      <LoadingOverlay show={!mounted} text="Loading items…" />
      <CustomHeader pageTitle="Library management" showLogo={true} />
      <PageTitle title="Library management" showPageTitle />

      <div className="mx-auto w-full max-w-4xl p-4 min-h-screen mt-0 md:mt-16">
        {mounted && !canAccess ? (
          <p className="text-sm text-dark-gray">Only library managers can manage the library.</p>
        ) : (
          <>
            {/* 顶部操作 */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<PlusIcon className="h-4 w-4" />}
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                Add item
              </Button>
              <Link
                href="/library/manage/borrows"
                className="inline-flex items-center gap-1 rounded-sm border border-dark-green px-3 py-1 text-sm text-dark-green hover:bg-dark-green/5"
              >
                <ArrowsRightLeftIcon className="h-4 w-4" />
                Borrows
              </Link>
            </div>

            <SearchBar
              value={qInput}
              onChange={setQInput}
              onSubmit={(e) => {
                e.preventDefault();
                pushQuery({ q: qInput.trim() });
              }}
              onClear={() => {
                setQInput("");
                pushQuery({ q: "" });
              }}
              placeholder="Search by title, author, call number or barcode…"
              sticky={false}
            />

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <select
                aria-label="Category"
                value={categoryParam}
                onChange={(e) => pushQuery({ category: e.target.value })}
                className="min-w-0 max-w-full rounded-sm border border-border bg-white p-1.5"
              >
                <option value="">All categories</option>
                {categories.list.map((c) => (
                  <option key={`${c.item_type}:${c.category}`} value={c.category}>
                    {c.category}
                  </option>
                ))}
              </select>
              {adminItems.pagination && (
                <span className="ml-auto text-xs text-dark-gray/70">
                  {total} {total === 1 ? "item" : "items"} (including withdrawn)
                </span>
              )}
            </div>

            {notice && <p className="mt-3 text-sm text-dark-green" role="status">{notice}</p>}
            {(adminItems.error || actionError) && (
              <p className="mt-3 text-sm text-red-600" role="alert">{actionError || adminItems.error}</p>
            )}

            <div className="mt-4 rounded-md border border-border bg-white relative min-h-[120px]">
              {listLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                  <span className="inline-block h-5 w-5 rounded-full border-2 border-current border-t-transparent animate-spin" aria-label="Loading" />
                </div>
              )}

              {adminItems.list.length === 0 && !listLoading && adminItems.status !== "idle" ? (
                <p className="p-4 text-sm text-dark-gray">No items found.</p>
              ) : adminItems.list.map((it) => {
                const borrow = it.current_borrow;
                return (
                  <div
                    key={it.id}
                    className={`flex flex-wrap items-center justify-between gap-3 border-b border-border last:border-b-0 p-3 text-sm ${it.is_active ? "" : "bg-gray-50"}`}
                  >
                    {/* 手机上信息独占一行、按钮换到下一行；sm 以上左右排列 */}
                    <div className="min-w-0 flex-1 basis-full sm:basis-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-dark-gray/80">{it.call_number ?? "—"}</span>
                        <Link href={`/library/items/${it.id}`} className="font-medium text-dark-gray hover:text-dark-green break-words">
                          {it.title}
                        </Link>
                        {!it.is_active && (
                          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] text-dark-gray">Withdrawn</span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-dark-gray/70">
                        {[it.category, it.item_type !== "book" ? it.item_type.toUpperCase() : null, it.creator]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                      <div className="mt-0.5 text-xs">
                        {borrow ? (
                          <span className="text-dark-gray">
                            Borrowed by {borrow.user.firstName}
                            {borrow.user.email ? ` (${borrow.user.email})` : ""} · {formatDate(borrow.borrowed_at)}
                          </span>
                        ) : it.is_active ? (
                          <span className="text-dark-green">Available</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {borrow ? (
                        <Button
                          size="sm"
                          variant="outline"
                          tone="brand"
                          loading={busyId === it.id}
                          onClick={() => confirmReturn.ask(it, `Register the return of "${it.title}" from ${borrow.user.firstName}?`)}
                        >
                          Return
                        </Button>
                      ) : it.is_active ? (
                        <Button size="sm" variant="outline" tone="brand" onClick={() => setLending(it)}>
                          Lend
                        </Button>
                      ) : null}
                      <Link
                        href={`/library/manage/borrows?item_id=${it.id}&item_label=${encodeURIComponent(it.call_number || it.title)}`}
                        className="text-xs text-dark-gray underline hover:text-dark-green"
                      >
                        History
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(it);
                          setFormOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      {it.is_active ? (
                        <Button
                          size="sm"
                          variant="outline"
                          tone="danger"
                          loading={busyId === it.id}
                          onClick={() => confirmWithdraw.ask(it, `Withdraw "${it.title}"? Members will no longer see it. You can restore it later.`)}
                        >
                          Withdraw
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          tone="brand"
                          loading={busyId === it.id}
                          onClick={() => runAction(it, "restore")}
                        >
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => pushQuery({ page: p })} />
              </div>
            )}
          </>
        )}
      </div>

      {formOpen && (
        <LibraryItemFormModal
          item={editing}
          categories={categoryNames}
          onClose={() => setFormOpen(false)}
          onSaved={(saved) => {
            setFormOpen(false);
            setNotice(`${editing ? "Saved" : "Added"} "${saved.title}".`);
            setActionError(null);
            dispatch(fetchLibraryCategories());
            // 新增的不在当前页：重新拉一次
            if (!editing) load();
          }}
        />
      )}

      {lending && (
        <LendItemModal
          item={lending}
          onClose={() => setLending(null)}
          onLent={(res) => {
            setLending(null);
            setActionError(null);
            setNotice(`Lent ${res.item.call_number ?? `"${res.item.title}"`} to ${res.borrow.user.firstName}.`);
            load();
          }}
        />
      )}

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

      <ConfirmModal
        isOpen={confirmWithdraw.open}
        title="Withdraw item"
        message={confirmWithdraw.message}
        confirmLabel="Withdraw"
        confirmVariant="danger"
        cancelLabel="Cancel"
        cancelVariant="outline"
        onCancel={confirmWithdraw.cancel}
        onClose={confirmWithdraw.cancel}
        onConfirm={confirmWithdraw.confirm((it) => (it ? runAction(it, "withdraw") : undefined))}
      />
    </>
  );
}
