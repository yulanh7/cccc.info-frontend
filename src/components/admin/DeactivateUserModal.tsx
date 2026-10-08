"use client";

import React, { useEffect, useState } from "react";
import { useAppDispatch } from "@/app/features/hooks";
import { apiRequest } from "@/app/features/request";
import { unwrapData } from "@/app/types";
import { setUserActive } from "@/app/features/admin/usersSlice";
import type { UserProps, AdminUsersListData } from "@/app/types/user";
import Button from "@/components/ui/Button";
import LibraryModal from "@/components/library/LibraryModal";
import { errorMessage } from "@/app/lib/errors";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * 停用一个创建过小组的用户：列出他的小组，必须先选一个接手人（transfer_groups_to），
 * 后端在同一个请求里把这些小组的创建者换成接手人。候选人排除他本人和已停用的人。
 */
export default function DeactivateUserModal({
  user,
  onClose,
  onDone,
}: {
  user: UserProps;
  onClose: () => void;
  onDone: (updated: UserProps, newOwner: UserProps) => void;
}) {
  const dispatch = useAppDispatch();
  const groups = user.created_groups ?? [];
  const [q, setQ] = useState("");
  const [results, setResults] = useState<UserProps[]>([]);
  const [searching, setSearching] = useState(false);
  const [owner, setOwner] = useState<UserProps | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 用 admin 用户列表接口搜人（不动列表页的 store）
  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const qs = new URLSearchParams({ q: term, per_page: "10" });
        const data = unwrapData(await apiRequest<AdminUsersListData>("GET", `/admin/users?${qs}`));
        if (!cancelled) setResults((data.users ?? []).filter((u) => u.id !== user.id && u.is_active !== false));
      } catch (e) {
        if (!cancelled) setError(errorMessage(e, "Search failed"));
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, user.id]);

  const confirm = async () => {
    if (!owner) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await dispatch(
        setUserActive({ userId: user.id, active: false, transfer_groups_to: owner.id })
      ).unwrap();
      onDone(updated, owner);
    } catch (e) {
      setError(errorMessage(e, "Deactivate failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <LibraryModal
      title="Deactivate account"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="danger" onClick={confirm} disabled={!owner} loading={saving} loadingText="Deactivating…">
            Deactivate
          </Button>
        </>
      }
    >
      <p className="text-sm text-dark-gray">
        Deactivate <strong>{user.firstName}</strong>&apos;s account? They will be logged out and can&apos;t log in. Their
        posts stay, shown as &quot;Deleted user&quot;. You can reactivate it later.
      </p>

      <p className="mt-3 text-sm font-medium text-dark-gray">
        {user.firstName} created {groups.length === 1 ? "this group" : `these ${groups.length} groups`}:
      </p>
      <ul className="mt-1 list-disc pl-5 text-sm text-dark-gray">
        {groups.map((g) => <li key={g.id} className="break-words">{g.name}</li>)}
      </ul>

      <p className="mt-3 mb-1 text-sm font-medium text-dark-gray">Transfer these groups to:</p>
      {owner ? (
        <div className="flex items-center justify-between gap-2 rounded-sm border border-dark-green/40 bg-dark-green/5 px-3 py-2 text-sm">
          <span className="min-w-0 break-all">
            <span className="font-medium">{owner.firstName}</span>{" "}
            <span className="text-dark-gray/70">{owner.email}</span>
          </span>
          <button type="button" className="text-xs text-dark-gray underline" onClick={() => setOwner(null)} disabled={saving}>
            Change
          </button>
        </div>
      ) : (
        <>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name or email"
            className="w-full rounded-sm border border-border bg-white p-2 text-[16px]"
            autoFocus
            aria-label="Search for the new owner"
          />
          {searching && <p className="mt-1 text-xs text-dark-gray/70">Searching…</p>}
          {!searching && q.trim() && results.length === 0 && (
            <p className="mt-1 text-xs text-dark-gray/70">No matching active users.</p>
          )}
          {results.length > 0 && (
            <ul className="mt-1 max-h-48 overflow-y-auto rounded-sm border border-border">
              {results.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                    onClick={() => setOwner(u)}
                  >
                    <span className="font-medium">{u.firstName}</span>{" "}
                    <span className="text-dark-gray/70 break-all">{u.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <p className="mt-2 text-xs text-dark-gray/70">
        They become the creator and a leader of each group. {user.firstName} will no longer own or lead these groups.
      </p>

      {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
    </LibraryModal>
  );
}
