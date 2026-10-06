"use client";
import { Suspense } from "react";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import { fetchAdminUsers, setUserPermission } from "@/app/features/admin/usersSlice";
import { isAdmin, PERMISSION_CREATE_GROUP } from "@/app/types/user";
import { PERMISSION_MANAGE_LIBRARY } from "@/app/types/library";
import type { UserProps } from "@/app/types/user";
import { formatDate } from "@/app/ultility";
import { ADMIN_USERS_PER_PAGE } from "@/app/constants";
import PageTitle from "@/components/layout/PageTitle";
import CustomHeader from "@/components/layout/CustomHeader";
import LoadingOverlay from "@/components/feedback/LoadingOverLay";
import SearchBar from "@/components/SearchBar";
import Pagination from "@/components/ui/Pagination";

const ADMIN_USERS_PATH = "/admin/users";

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<LoadingOverlay show text="Loading users…" />}>
      <AdminUsersPageInner />
    </Suspense>
  );
}

function AdminUsersPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const currentUser = useAppSelector((s) => s.auth.user);
  const { users, pagination, status, error, updatingIds } = useAppSelector((s) => s.adminUsers);
  const canAccess = isAdmin(currentUser);

  // ===== URL 参数
  const qParam = (searchParams.get("q") || "").trim();
  const currentPage = useMemo(() => {
    const p = Number(searchParams.get("page"));
    return Number.isFinite(p) && p > 0 ? p : 1;
  }, [searchParams]);

  const [qInput, setQInput] = useState(qParam);
  useEffect(() => setQInput(qParam), [qParam]);

  // 非 admin 不调接口（后端也会 403）
  useEffect(() => {
    if (!mounted || !canAccess) return;
    dispatch(fetchAdminUsers({ page: currentPage, per_page: ADMIN_USERS_PER_PAGE, q: qParam || undefined }));
  }, [dispatch, mounted, canAccess, currentPage, qParam]);

  const pushQuery = (q: string, page: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    router.push(qs ? `${ADMIN_USERS_PATH}?${qs}` : ADMIN_USERS_PATH);
  };

  const togglePermission = async (u: UserProps, permission: string, granted: boolean) => {
    try {
      await dispatch(setUserPermission({ userId: u.id, permission, granted })).unwrap();
    } catch (e: any) {
      alert(typeof e === "string" ? e : e?.message || "Update permission failed");
    }
  };

  const listLoading = status === "loading";
  const totalPages = pagination?.pages ?? 1;

  return (
    <>
      <LoadingOverlay show={!mounted} text="Loading users…" />
      <CustomHeader pageTitle="User Permissions" showLogo={true} />
      <PageTitle title="User Permissions" showPageTitle />

      <div className="mx-auto w-full max-w-3xl p-4 min-h-screen mt-0 md:mt-16">
        {mounted && !canAccess ? (
          <p className="text-sm text-dark-gray">Only admins can manage user permissions.</p>
        ) : (
          <>
            <SearchBar
              value={qInput}
              onChange={setQInput}
              onSubmit={(e) => {
                e.preventDefault();
                pushQuery(qInput.trim(), 1);
              }}
              onClear={() => {
                setQInput("");
                pushQuery("", 1);
              }}
              placeholder="Search by email or name…"
              sticky={false}
            />

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-4 rounded-md border border-border bg-white relative">
              {listLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                  <span className="inline-block h-5 w-5 rounded-full border-2 border-current border-t-transparent animate-spin" aria-label="Loading" />
                </div>
              )}

              {users.length === 0 && !listLoading ? (
                <p className="p-4 text-sm text-dark-gray">No users found.</p>
              ) : users.map((u) => {
                const hasCreateGroup = !!u.permissions?.includes(PERMISSION_CREATE_GROUP);
                const hasManageLibrary = !!u.permissions?.includes(PERMISSION_MANAGE_LIBRARY);
                const updating = updatingIds.includes(u.id);
                return (
                  <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border last:border-b-0 p-3 text-sm">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-dark-gray">{u.firstName}</span>
                        {u.admin && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-green px-2 py-0.5 text-[10px] text-green">
                            <ShieldCheckIcon className="h-3 w-3" />
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-dark-gray break-all">{u.email}</div>
                      {u.created_at && (
                        <div className="text-xs text-dark-gray/70">Joined {formatDate(u.created_at)}</div>
                      )}
                    </div>

                    {/* admin 隐含拥有全部权限，开关只读 */}
                    <div className="flex flex-col gap-1">
                      <label
                        className={`flex items-center gap-2 ${u.admin || updating ? "opacity-60" : "cursor-pointer"}`}
                        title={u.admin ? "Admins can always create groups" : undefined}
                      >
                        <input
                          type="checkbox"
                          aria-label={`Allow ${u.firstName} to create groups`}
                          checked={u.admin || hasCreateGroup}
                          disabled={u.admin || updating}
                          onChange={(e) => togglePermission(u, PERMISSION_CREATE_GROUP, e.target.checked)}
                        />
                        <span className="text-dark-gray">Can create groups</span>
                      </label>
                      <label
                        className={`flex items-center gap-2 ${u.admin || updating ? "opacity-60" : "cursor-pointer"}`}
                        title={u.admin ? "Admins can always manage the library" : undefined}
                      >
                        <input
                          type="checkbox"
                          aria-label={`Make ${u.firstName} a library manager`}
                          checked={u.admin || hasManageLibrary}
                          disabled={u.admin || updating}
                          onChange={(e) => togglePermission(u, PERMISSION_MANAGE_LIBRARY, e.target.checked)}
                        />
                        <span className="text-dark-gray">Library manager</span>
                      </label>
                      {updating && <span className="text-xs text-dark-gray/70">Saving…</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(p) => pushQuery(qParam, p)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
