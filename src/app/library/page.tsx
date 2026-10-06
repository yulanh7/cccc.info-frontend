"use client";
import { Suspense } from "react";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookmarkIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import { fetchLibraryCatalog, fetchLibraryCategories, borrowLibraryItem } from "@/app/features/library/slice";
import type { LibraryCatalogGroup } from "@/app/types/library";
import { LIBRARY_PER_PAGE } from "@/app/constants";
import PageTitle from "@/components/layout/PageTitle";
import CustomHeader from "@/components/layout/CustomHeader";
import LoadingOverlay from "@/components/feedback/LoadingOverLay";
import SearchBar from "@/components/SearchBar";
import Pagination from "@/components/ui/Pagination";
import CatalogGroupCard from "@/components/library/CatalogGroupCard";
import type { CatalogBorrowResult } from "@/components/library/CatalogGroupCard";
import ConfirmModal from "@/components/ConfirmModal";
import { useConfirm } from "@/hooks/useConfirm";

const LIBRARY_PATH = "/library";
const SEARCH_DEBOUNCE_MS = 400;

export default function LibraryPage() {
  return (
    <Suspense fallback={<LoadingOverlay show text="Loading library…" />}>
      <LibraryPageInner />
    </Suspense>
  );
}

function LibraryPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { catalog, categories } = useAppSelector((s) => s.library);

  // ===== 在列表上直接借：先确认，带 any_copy（这件被借走时后端自动换同一本书的另一个可借复本）
  const groupKey = (g: LibraryCatalogGroup) => `${g.item_type}:${g.category}:${g.title}:${g.items[0]?.id ?? ""}`;
  const confirmBorrow = useConfirm<LibraryCatalogGroup>("Borrow this item?");
  const [borrowingKey, setBorrowingKey] = useState<string | null>(null);
  const [borrowResults, setBorrowResults] = useState<Record<string, CatalogBorrowResult>>({});
  const [reloadTick, setReloadTick] = useState(0);

  const doBorrow = async (group: LibraryCatalogGroup | null) => {
    if (!group) return;
    const target = group.items.find((c) => c.available) ?? group.items[0];
    if (!target) return;
    const key = groupKey(group);
    setBorrowingKey(key);
    try {
      const res = await dispatch(borrowLibraryItem({ itemId: target.id, any_copy: true })).unwrap();
      setBorrowResults((m) => ({ ...m, [key]: { ok: true, callNumber: res.item.call_number } }));
    } catch (e: any) {
      setBorrowResults((m) => ({ ...m, [key]: { ok: false, message: typeof e === "string" ? e : e?.message || "Borrow failed" } }));
    } finally {
      setBorrowingKey(null);
      // 成功或 409 都刷新可借数量
      setReloadTick((t) => t + 1);
    }
  };

  // ===== URL 参数：q / category / available / page
  const qParam = (searchParams.get("q") || "").trim();
  const categoryParam = searchParams.get("category") || "";
  const availableOnly = searchParams.get("available") === "1";
  const currentPage = useMemo(() => {
    const p = Number(searchParams.get("page"));
    return Number.isFinite(p) && p > 0 ? p : 1;
  }, [searchParams]);

  const [qInput, setQInput] = useState(qParam);
  useEffect(() => setQInput(qParam), [qParam]);

  /** 改筛选条件时回到第 1 页；搜索框输入用 replace，避免每个字都进历史记录 */
  const pushQuery = (
    next: Partial<{ q: string; category: string; available: boolean; page: number }>,
    replace = false
  ) => {
    const q = next.q ?? qParam;
    const category = next.category ?? categoryParam;
    const available = next.available ?? availableOnly;
    const page = next.page ?? 1;

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (available) params.set("available", "1");
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    const href = qs ? `${LIBRARY_PATH}?${qs}` : LIBRARY_PATH;
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

  useEffect(() => {
    if (!mounted) return;
    dispatch(fetchLibraryCategories());
  }, [dispatch, mounted]);

  useEffect(() => {
    if (!mounted) return;
    dispatch(
      fetchLibraryCatalog({
        q: qParam || undefined,
        category: categoryParam || undefined,
        available_only: availableOnly || undefined,
        page: currentPage,
        per_page: LIBRARY_PER_PAGE,
      })
    );
  }, [dispatch, mounted, qParam, categoryParam, availableOnly, currentPage, reloadTick]);

  // 分类按书 / 影音分组显示
  const bookCategories = categories.list.filter((c) => c.item_type === "book");
  const mediaCategories = categories.list.filter((c) => c.item_type !== "book");

  const listLoading = catalog.status === "loading";
  const totalPages = catalog.pagination?.pages ?? 1;
  const totalGroups = catalog.pagination?.total ?? 0;
  const hasFilters = !!(qParam || categoryParam || availableOnly);

  return (
    <>
      <LoadingOverlay show={!mounted} text="Loading library…" />
      <CustomHeader
        pageTitle="Library"
        showLogo={true}
        rightSlot={
          // 手机顶部栏右侧的“我的借阅”快捷入口（电脑上在右上角用户菜单里）
          <Link href="/library/my-borrows" aria-label="My borrows" className="inline-flex items-center gap-1 text-sm text-dark-green">
            <BookmarkIcon className="h-5 w-5" />
            My borrows
          </Link>
        }
      />
      <PageTitle title="Library" showPageTitle />

      <div className="mx-auto w-full max-w-3xl p-4 min-h-screen mt-0 md:mt-16">
        {/* 电脑上在搜索栏右边放“我的借阅”；手机上在顶部栏右侧 */}
        <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
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
          placeholder="Title, author, shelf no. (e.g. C14)"
          sticky={false}
          size="lg"
        />
        </div>
        <Link
          href="/library/my-borrows"
          className="hidden md:inline-flex h-10 shrink-0 items-center gap-1.5 rounded-sm border border-dark-green px-3 text-[16px] text-dark-green hover:bg-dark-green/5"
        >
          <BookmarkIcon className="h-5 w-5" />
          My borrows
        </Link>
        </div>

        {/* 筛选：分类 + 只看可借 */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          {/* 自绘箭头：原生箭头会紧贴右边框 */}
          <div className="relative min-w-0 max-w-full">
          <select
            aria-label="Category"
            value={categoryParam}
            onChange={(e) => pushQuery({ category: e.target.value })}
            className="h-10 w-full appearance-none rounded-sm border border-border bg-white pl-3 pr-9 text-[16px]"
          >
            <option value="">All categories</option>
            {bookCategories.length > 0 && (
              <optgroup label="Books">
                {bookCategories.map((c) => (
                  <option key={`${c.item_type}:${c.category}`} value={c.category}>
                    {c.category} ({c.total})
                  </option>
                ))}
              </optgroup>
            )}
            {mediaCategories.length > 0 && (
              <optgroup label="Audio & video">
                {mediaCategories.map((c) => (
                  <option key={`${c.item_type}:${c.category}`} value={c.category}>
                    {c.category} ({c.total})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-gray" aria-hidden />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-dark-gray">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => pushQuery({ available: e.target.checked })}
            />
            Available only
          </label>

          {catalog.pagination && (
            <span className="ml-auto text-xs text-dark-gray/70">
              {totalGroups} {totalGroups === 1 ? "title" : "titles"}
            </span>
          )}
        </div>

        {catalog.error && <p className="mt-3 text-sm text-red-600">{catalog.error}</p>}

        <div className="mt-4 relative min-h-[120px]">
          {listLoading && (
            <div className="absolute inset-0 bg-bg/60 backdrop-blur-[1px] flex items-center justify-center z-10">
              <span className="inline-block h-5 w-5 rounded-full border-2 border-current border-t-transparent animate-spin" aria-label="Loading" />
            </div>
          )}

          {catalog.list.length === 0 && !listLoading && catalog.status !== "idle" ? (
            <p className="text-sm text-dark-gray">
              {hasFilters ? "No items match your search." : "The library is empty."}
            </p>
          ) : (
            <ul className="space-y-2">
              {catalog.list.map((g) => (
                <li key={groupKey(g)}>
                  <CatalogGroupCard
                    group={g}
                    borrowing={borrowingKey === groupKey(g)}
                    result={borrowResults[groupKey(g)]}
                    onBorrow={(grp) => confirmBorrow.ask(grp, `Borrow "${grp.title}"?`)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => pushQuery({ page: p })}
            />
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmBorrow.open}
        title="Borrow"
        message={confirmBorrow.message}
        confirmLabel="Borrow"
        confirmVariant="primary"
        cancelLabel="Cancel"
        cancelVariant="outline"
        onCancel={confirmBorrow.cancel}
        onClose={confirmBorrow.cancel}
        onConfirm={confirmBorrow.confirm(doBorrow)}
      />
    </>
  );
}
