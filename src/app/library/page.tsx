"use client";
import { Suspense } from "react";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import { fetchLibraryCatalog, fetchLibraryCategories } from "@/app/features/library/slice";
import { LIBRARY_PER_PAGE } from "@/app/constants";
import PageTitle from "@/components/layout/PageTitle";
import CustomHeader from "@/components/layout/CustomHeader";
import LoadingOverlay from "@/components/feedback/LoadingOverLay";
import SearchBar from "@/components/SearchBar";
import Pagination from "@/components/ui/Pagination";
import CatalogGroupCard from "@/components/library/CatalogGroupCard";

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
  }, [dispatch, mounted, qParam, categoryParam, availableOnly, currentPage]);

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
      <CustomHeader pageTitle="Library" showLogo={true} />
      <PageTitle title="Library" showPageTitle />

      <div className="mx-auto w-full max-w-3xl p-4 min-h-screen mt-0 md:mt-16">
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
          placeholder="Search by title, author or call number…"
          sticky={false}
        />

        {/* 筛选：分类 + 只看可借 */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <select
            aria-label="Category"
            value={categoryParam}
            onChange={(e) => pushQuery({ category: e.target.value })}
            className="min-w-0 max-w-full rounded-sm border border-border bg-white p-1.5"
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
                <li key={`${g.item_type}:${g.category}:${g.title}:${g.items[0]?.id ?? ""}`}>
                  <CatalogGroupCard group={g} />
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
    </>
  );
}
