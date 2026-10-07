"use client";
import { Suspense } from "react";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import { fetchAdminUsers, setUserPermission, setUserAdmin } from "@/app/features/admin/usersSlice";
import { fetchProfileThunk } from "@/app/features/auth/slice";
import { isAdmin, PERMISSION_CREATE_GROUP, PERMISSION_MANAGE_GROUPS } from "@/app/types/user";
import ConfirmModal from "@/components/ConfirmModal";
import { useConfirm } from "@/hooks/useConfirm";
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

  // ===== 设为 admin / 改回普通用户（先确认；不能取消自己，后端也会拒绝）
  const confirmAdmin = useConfirm<{ user: UserProps; admin: boolean }>("Change admin role?");
  const toggleAdmin = async (target: { user: UserProps; admin: boolean } | null) => {
    if (!target) return;
    try {
      await dispatch(setUserAdmin({ userId: target.user.id, admin: target.admin })).unwrap();
    } catch (e: any) {
      alert(typeof e === "string" ? e : e?.message || "Update admin role failed");
    }
  };

  const togglePermission = async (u: UserProps, permission: string, granted: boolean) => {
    try {
      await dispatch(setUserPermission({ userId: u.id, permission, granted })).unwrap();
      // 改的是自己的权限：马上刷新登录资料，其他页面（图书馆、建组按钮）不用刷新就生效
      if (currentUser && u.id === currentUser.id) dispatch(fetchProfileThunk());
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
              placeholder="Name or email"
              sticky={false}
              size="lg"
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
                const hasManageGroups = !!u.permissions?.includes(PERMISSION_MANAGE_GROUPS);
                const isSelf = currentUser?.id === u.id;
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

                    <div className="flex flex-col gap-1">
                      {/* 站点管理员：不能取消自己 */}
                      <label
                        className={`flex items-center gap-2 ${isSelf || updating ? "opacity-60" : "cursor-pointer"}`}
                        title={isSelf ? "You can't remove your own admin role" : undefined}
                      >
                        <input
                          type="checkbox"
                          aria-label={`Make ${u.firstName} an admin`}
                          checked={u.admin}
                          disabled={isSelf || updating}
                          onChange={(e) =>
                            confirmAdmin.ask(
                              { user: u, admin: e.target.checked },
                              e.target.checked
                                ? `Make ${u.firstName} an admin? Admins can manage users and permissions.`
                                : `Remove ${u.firstName}'s admin role? Their Group manager access will also be removed.`
                            )
                          }
                        />
                        <span className="text-dark-gray">Admin</span>
                      </label>
                      {/* admin 隐含可以建组，开关只读 */}
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
                      {/* 图书管理员要单独授予，admin 也一样（可以给自己开） */}
                      <label className={`flex items-center gap-2 ${updating ? "opacity-60" : "cursor-pointer"}`}>
                        <input
                          type="checkbox"
                          aria-label={`Make ${u.firstName} a library manager`}
                          checked={hasManageLibrary}
                          disabled={updating}
                          onChange={(e) => togglePermission(u, PERMISSION_MANAGE_LIBRARY, e.target.checked)}
                        />
                        <span className="text-dark-gray">Library manager</span>
                      </label>
                      {/* 小组管理员：只能给 admin，admin 也要单独打开 */}
                      {u.admin && (
                        <label className={`flex items-center gap-2 ${updating ? "opacity-60" : "cursor-pointer"}`}>
                          <input
                            type="checkbox"
                            aria-label={`Make ${u.firstName} a group manager`}
                            checked={hasManageGroups}
                            disabled={updating}
                            onChange={(e) => togglePermission(u, PERMISSION_MANAGE_GROUPS, e.target.checked)}
                          />
                          <span className="text-dark-gray">Group manager</span>
                        </label>
                      )}
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
      <ConfirmModal
        isOpen={confirmAdmin.open}
        title="Admin role"
        message={confirmAdmin.message}
        confirmLabel="Confirm"
        confirmVariant="primary"
        cancelLabel="Cancel"
        cancelVariant="outline"
        onCancel={confirmAdmin.cancel}
        onClose={confirmAdmin.cancel}
        onConfirm={confirmAdmin.confirm(toggleAdmin)}
      />
    </>
  );
}
