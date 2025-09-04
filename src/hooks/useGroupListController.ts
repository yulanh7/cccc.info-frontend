"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import {
  createGroup,
  fetchAvailableGroups,
  fetchAllGroups,
  fetchUserGroups,
  searchGroups,
  updateGroup as updateGroupThunk,
  deleteGroup as deleteGroupThunk,
  joinGroup,
  leaveGroup,
  setSearchQuery as setSearchQueryAction,
  clearSearch as clearSearchAction,
} from "@/app/features/groups/slice";
import type { GroupApi } from "@/app/types";
import type { CreateOrUpdateGroupBody, GroupListPaginationApi } from "@/app/types/group";
import { mapApiErrorToFields } from "@/app/ultility";

/** 控制器模式：决定数据从哪里来 */
export type GroupListMode =
  | "availableWithSearch"  // 有 q 参数时走 search，否则拉 available
  | "user"                 // 用户订阅的群组
  | "all"                  // 全部群组
  | "searchOnly";          // 只根据 q 搜索

export type UseGroupListControllerOptions = {
  mode?: GroupListMode;
  pageSize?: number;        // 默认 9
  basePath?: string;        // 默认 "/groups"
};

export function useGroupListController(opts: UseGroupListControllerOptions = {}) {
  const {
    mode = "availableWithSearch",
    pageSize = 9,
    basePath = "/groups",
  } = opts;

  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  // ===== 从 Redux 取需要的 state
  const user = useAppSelector((s) => s.auth.user);
  const canCreate = !!user?.admin;

  const availableGroups = useAppSelector((s) => s.groups.availableGroups);
  const userGroups = useAppSelector((s) => s.groups.userGroups);
  const searchResults = useAppSelector((s) => s.groups.searchResults);

  const availablePagination = useAppSelector((s) => s.groups.availableGroupsPagination);
  const userPagination = useAppSelector((s) => s.groups.userGroupsPagination);
  const searchPagination = useAppSelector((s) => s.groups.searchPagination);
  const searchQuery = useAppSelector((s) => s.groups.searchQuery);

  // ===== 本地 UI 状态
  const [listLoading, setListLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // modal 状态（新建/编辑）
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupApi | undefined>(undefined);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalErrors, setModalErrors] = useState<{ title?: string; description?: string } | null>(null);

  // ===== URL 参数
  const qParam = (searchParams.get("q") || "").trim();
  const currentPage = useMemo(() => {
    const p = parseInt(searchParams.get("page") || "1", 10);
    return Number.isFinite(p) && p > 0 ? p : 1;
  }, [searchParams]);

  // 输入框双向绑定
  const [qInput, setQInput] = useState("");
  useEffect(() => setQInput(mode === "availableWithSearch" || mode === "searchOnly" ? (searchQuery || qParam) : ""), [searchQuery, qParam, mode]);

  // ===== 数据加载
  const load = useCallback(async () => {
    setListLoading(true);
    try {
      if (mode === "availableWithSearch") {
        if (qParam) {
          dispatch(setSearchQueryAction(qParam));
          await dispatch(searchGroups({ q: qParam, page: currentPage, per_page: pageSize }));
        } else {
          dispatch(clearSearchAction());
          await dispatch(fetchAvailableGroups({ page: currentPage, per_page: pageSize }));
        }
      } else if (mode === "user") {
        await dispatch(fetchUserGroups({ page: currentPage, per_page: pageSize }));
      } else if (mode === "all") {
        await dispatch(fetchAllGroups({ page: currentPage, per_page: pageSize }));
      } else { // searchOnly
        const q = qParam || searchQuery;
        await dispatch(searchGroups({ q: q || "", page: currentPage, per_page: pageSize }));
      }
    } finally {
      setListLoading(false);
    }
  }, [dispatch, mode, qParam, searchQuery, currentPage, pageSize]);

  useEffect(() => { void load(); }, [load]);

  // ===== 选择当前展示的 rows + pagination
  const rows: GroupApi[] = useMemo(() => {
    if (mode === "availableWithSearch") return qParam ? searchResults : availableGroups;
    if (mode === "user") return userGroups;
    if (mode === "all") return availableGroups; // 这里也可维护一个 allGroups 列表；若已在 slice 中区分，则替换为 s.groups.allGroups
    return searchResults; // searchOnly
  }, [mode, qParam, availableGroups, userGroups, searchResults]);

  const pagination: GroupListPaginationApi | null = useMemo(() => {
    if (mode === "availableWithSearch") return qParam ? searchPagination : availablePagination;
    if (mode === "user") return userPagination;
    if (mode === "all") return availablePagination; // 同上说明
    return searchPagination;
  }, [mode, qParam, availablePagination, userPagination, searchPagination]);

  const totalPages = useMemo(() => {
    if (typeof (pagination as any)?.pages === "number") {
      return Math.max(1, (pagination as any).pages as number);
    }
    const total = Number(pagination?.total ?? 0);
    const per = Number(pagination?.per_page ?? pageSize);
    return Math.max(1, Math.ceil(total / Math.max(1, per)));
  }, [pagination, pageSize]);

  // ===== URL builder + 路由跳转
  const buildHref = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    return `${basePath}${params.toString() ? `?${params.toString()}` : ""}`;
  }, [searchParams, basePath]);

  const onPageChange = useCallback((page: number) => {
    router.push(buildHref(page));
  }, [router, buildHref]);

  // 仅刷新数据（不动 URL）
  const refreshPage = useCallback(async (page: number) => {
    if (mode === "availableWithSearch") {
      if (qParam) {
        await dispatch(searchGroups({ q: qParam, page, per_page: pageSize }));
      } else {
        await dispatch(fetchAvailableGroups({ page, per_page: pageSize }));
      }
    } else if (mode === "user") {
      await dispatch(fetchUserGroups({ page, per_page: pageSize }));
    } else if (mode === "all") {
      await dispatch(fetchAllGroups({ page, per_page: pageSize }));
    } else {
      const q = qParam || searchQuery || "";
      await dispatch(searchGroups({ q, page, per_page: pageSize }));
    }
  }, [dispatch, mode, qParam, searchQuery, pageSize]);

  // ===== 搜索
  const submitSearch = useCallback((e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault?.();
    const params = new URLSearchParams(searchParams.toString());
    const val = qInput.trim();
    if (val) params.set("q", val);
    else params.delete("q");
    // 搜索默认回到 page=1
    params.delete("page");
    router.push(`${basePath}${params.toString() ? `?${params}` : ""}`);
  }, [qInput, searchParams, router, basePath]);

  const clearSearch = useCallback(() => {
    setQInput("");
    dispatch(clearSearchAction());
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("page");
    router.push(`${basePath}${params.toString() ? `?${params}` : ""}`);
  }, [dispatch, searchParams, router, basePath]);

  // ===== 权限/订阅/编辑/删除
  const canEditGroup = useCallback((g: GroupApi) => g.is_creator, []);
  const isUserSubscribed = useCallback((g: GroupApi) => g.is_member === true, []);

  const toggleSubscription = useCallback(async (group: GroupApi) => {
    setToggling(true);
    const action = group.is_member ? await dispatch(leaveGroup(group.id)) : await dispatch(joinGroup(group.id));
    setToggling(false);

    if (leaveGroup.rejected.match(action) || joinGroup.rejected.match(action)) {
      alert(
        (action.payload as string) ||
        (group.is_member ? "Leave group failed" : "Join group failed")
      );
      return false;
    }
    void refreshPage(currentPage);
    return true;
  }, [dispatch, currentPage, refreshPage]);

  const openNew = useCallback(() => {
    if (!canCreate) {
      alert("Only admins can create groups.");
      return;
    }
    setSelectedGroup(undefined);
    setIsNew(true);
    setModalErrors(null);
    setIsModalOpen(true);
  }, [canCreate]);

  const openEdit = useCallback((group: GroupApi) => {
    setSelectedGroup(group);
    setIsNew(false);
    setModalErrors(null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const saveGroup = useCallback(async (updated: GroupApi) => {
    setModalErrors(null);
    setModalSaving(true);

    const body: CreateOrUpdateGroupBody = {
      name: updated.name.trim(),
      description: updated.description,
      isPrivate: !!updated.isPrivate,
    };

    if (isNew) {
      const action = await dispatch(createGroup(body));
      setModalSaving(false);

      if (createGroup.fulfilled.match(action)) {
        // 成功后刷新回第一页
        if (mode === "availableWithSearch" && qParam) {
          dispatch(clearSearchAction());
          router.push(`${basePath}?page=1`);
        } else if (currentPage !== 1) {
          router.push(buildHref(1));
        } else {
          await refreshPage(1);
        }
        setIsModalOpen(false);
      } else {
        const msg = (action.payload as string) ?? "Create group failed";
        const fieldErrors = mapApiErrorToFields(msg);
        if (fieldErrors.title || fieldErrors.description) setModalErrors(fieldErrors);
        else alert(msg);
      }
    } else {
      const action = await dispatch(updateGroupThunk({ groupId: updated.id, body }));
      setModalSaving(false);

      if (updateGroupThunk.fulfilled.match(action)) {
        await refreshPage(currentPage);
        setIsModalOpen(false);
      } else {
        const msg = (action.payload as string) ?? "Update group failed";
        const fieldErrors = mapApiErrorToFields(msg);
        if (fieldErrors.title || fieldErrors.description) setModalErrors(fieldErrors);
        else alert(msg);
      }
    }
  }, [dispatch, isNew, currentPage, buildHref, refreshPage, qParam, mode, basePath, router]);

  const deleteGroup = useCallback(async (id: number) => {
    setDeleting(true);
    const action = await dispatch(deleteGroupThunk(id));
    setDeleting(false);

    if (deleteGroupThunk.fulfilled.match(action)) {
      // 删完后，若当前页被删空则回上一页
      const prevTotal = Number(pagination?.total ?? 0);
      const newTotal = Math.max(0, prevTotal - 1);
      const newLastPage = Math.max(1, Math.ceil(newTotal / pageSize));
      const targetPage = Math.min(currentPage, newLastPage);

      if (targetPage !== currentPage) {
        router.push(buildHref(targetPage));
      } else {
        await refreshPage(currentPage);
      }
      return true;
    } else {
      alert((action.payload as string) || "Delete group failed");
      return false;
    }
  }, [dispatch, pagination, pageSize, currentPage, router, buildHref, refreshPage]);

  // ===== 覆盖文案
  const overlayText =
    saving ? "Saving…" :
      deleting ? "Deleting…" :
        toggling ? "Updating membership…" :
          undefined;

  const pageLoading = listLoading && rows.length === 0;

  return {
    // 数据
    rows,
    listLoading,
    pageLoading,
    currentPage,
    totalPages,

    // 搜索
    qInput,
    setQInput,
    searchQuery,
    submitSearch,
    clearSearch,

    // 导航
    buildHref,
    onPageChange,
    refreshPage,

    // 权限/操作
    canCreate,
    canEditGroup,
    isUserSubscribed,
    toggleSubscription,

    // Modal（新建/编辑）
    isModalOpen,
    isNew,
    selectedGroup,
    modalSaving,
    modalErrors,
    openNew,
    openEdit,
    closeModal,
    saveGroup,

    // 删除
    deleteGroup,

    // 其他状态
    saving,
    deleting,
    toggling,
    overlayText,
  };
}
