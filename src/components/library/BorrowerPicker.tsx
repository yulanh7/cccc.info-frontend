"use client";

import React, { useEffect, useState } from "react";
import { useAppDispatch } from "@/app/features/hooks";
import { searchLibraryBorrowers } from "@/app/features/library/slice";
import type { LibraryBorrower } from "@/app/types/library";
import { errorMessage } from "@/app/lib/errors";

const SEARCH_DEBOUNCE_MS = 300;

/** 按姓名 / email 搜借阅人（最多 20 人），点一下选中 */
export default function BorrowerPicker({
  selected,
  onSelect,
  autoFocus = false,
}: {
  selected: LibraryBorrower | null;
  onSelect: (u: LibraryBorrower | null) => void;
  autoFocus?: boolean;
}) {
  const dispatch = useAppDispatch();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<LibraryBorrower[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const users = await dispatch(searchLibraryBorrowers(term)).unwrap();
        if (!cancelled) setResults(users);
      } catch (e) {
        if (!cancelled) setError(errorMessage(e, "Search failed"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [dispatch, q]);

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-sm border border-dark-green/40 bg-dark-green/5 px-3 py-2 text-sm">
        <span className="min-w-0 break-all">
          <span className="font-medium">{selected.firstName}</span>{" "}
          <span className="text-dark-gray/70">{selected.email}</span>
        </span>
        <button type="button" className="text-xs text-dark-gray underline" onClick={() => onSelect(null)}>
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="text-sm">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or email…"
        autoFocus={autoFocus}
        aria-label="Search borrower"
        className="w-full rounded-sm border border-border bg-white px-2 py-1.5"
      />
      {error && <p className="mt-1 text-red-600">{error}</p>}
      {loading && <p className="mt-1 text-xs text-dark-gray/70">Searching…</p>}
      {!loading && q.trim() && results.length === 0 && !error && (
        <p className="mt-1 text-xs text-dark-gray/70">No users found.</p>
      )}
      {results.length > 0 && (
        <ul className="mt-1 max-h-48 overflow-y-auto rounded-sm border border-border">
          {results.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => onSelect(u)}
                className="w-full px-3 py-1.5 text-left hover:bg-gray-50"
              >
                <span className="font-medium">{u.firstName}</span>{" "}
                <span className="text-dark-gray/70 break-all">{u.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
