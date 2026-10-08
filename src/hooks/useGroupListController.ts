"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import {
  createGroup,
  fetchVisibleGroups,
  searchVisibleGroups,
  fetchAllGroups,
  fetchUserGroups,
  fetchUserSubscribedGroups,
  updateGroup as updateGroupThunk,
  deleteGroup as deleteGroupThunk,
  setSearchQuery as setSearchQueryAction,
  clearSearch as clearSearchAction,
} from "@/app/features/groups/slice";
import type { GroupApi } from "@/app/types";
import { canCreateGroup } from "@/app/types/user";
import { useCameBack, useScrollRestoration } from "@/hooks/useBackNavigation";
import { appendUnique } from "@/app/lib/infiniteList";
import { canEditGroup as canEditGroupOf, canDeleteGroup as canDeleteGroupOf, joinPolicyOf } from "@/app/types/group";
import type { CreateOrUpdateGroupBody } from "@/app/types/group";
import { mapApiErrorToFields } from "@/app/ultility";

/** 控制器模式：决定数据从哪里来 */
export type GroupListMode =
  | "visibleWithSearch"
  | "user"
  | "subscribed"
  | "all"
  | "searchOnly";

export type UseGroupListControllerOptions = {
  mode?: GroupListMode;
  pageSize?: number;
  basePath?: string;
};

/** 已加载的小组列表（按模式 + 搜索词），通过“返回”回来时沿用；只存在内存里 */
const groupListCache = new Map<string, { items: GroupApi[]; loadedPage: number; pages: number }>();

export function useGroupListController(opts: UseGroupListControllerOptions = {}) {
  const {
    mode = "visibleWithSearch",
    pageSize = 9,
    basePath = "/groups",
  } = opts;

  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  // ===== 从 Redux 取需要的 state
  const user = useAppSelector((s) => s.auth.user);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  // user 由 LayoutClient 在客户端从 localStorage 恢复；挂载前不渲染建组按钮，避免 SSR/hydration 不一致
  const canCreate = mounted && canCreateGroup(user);

  const searchQuery = useAppSelector((s) => s.groups.searchQuery);

  // ===== 本地 UI 状态
  const [listLoading, setListLoading] = useState(true);
  const [saving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // modal 状态（新建/编辑）
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupApi | undefined>(undefined);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalErrors, setModalErrors] = useState<{ title?: string; description?: string } | null>(null);

  // ===== URL 参数
  const qParam = (searchParams.get("q") || "").trim();

  // 输入框双向绑定（仅搜索型模式保留输入）
  const [qInput, setQInput] = useState("");
  useEffect(() => {
    const shouldBind = mode === "visibleWithSearch" || mode === "searchOnly";
    setQInput(shouldBind ? (searchQuery || qParam) : "");
  }, [searchQuery, qParam, mode]);

  // ===== 数据加载（无限滚动）：滚到底追加下一页；通过“返回”回来时沿用已加载的内容
  /** 按当前模式请求某一页，返回这一页的小组和分页 */
  const requestPage = useCallback(async (page: number): Promise<{ groups: GroupApi[]; pages: number } | null> => {
    let action: { error?: unknown; payload?: unknown } | undefined;
    if (mode === "visibleWithSearch") {
      if (qParam) {
        dispatch(setSearchQueryAction(qParam));
        action = await dispatch(searchVisibleGroups({ q: qParam, page, per_page: pageSize }));
      } else {
        dispatch(clearSearchAction());
        action = await dispatch(fetchVisibleGroups({ page, per_page: pageSize }));
      }
    } else if (mode === "user") {
      action = await dispatch(fetchUserGroups({ page, per_page: pageSize }));             // 我创建的
    } else if (mode === "subscribed") {
      action = await dispatch(fetchUserSubscribedGroups({ page, per_page: pageSize }));   // 我订阅的
    } else if (mode === "all") {
      action = await dispatch(fetchAllGroups({ page, per_page: pageSize }));
    } else { // searchOnly
      const q = qParam || searchQuery;
      action = await dispatch(searchVisibleGroups({ q: q || "", page, per_page: pageSize }));
    }
    if (!action || action.error) return null;
    const payload = action.payload as
      | { groups?: GroupApi[]; pagination?: { pages?: number; total?: number; per_page?: number } }
      | undefined;
    const pg = payload?.pagination;
    const pages = typeof pg?.pages === "number"
      ? pg.pages
      : Math.ceil(Number(pg?.total ?? 0) / Math.max(1, Number(pg?.per_page ?? pageSize)));
    return { groups: payload?.groups ?? [], pages: Math.max(1, pages) };
  }, [dispatch, mode, qParam, searchQuery, pageSize]);

  const cacheKey = `${mode}|${qParam}|${pageSize}`;
  const cameBack = useCameBack();
  const firstLoad = useRef(true);
  const [items, setItems] = useState<GroupApi[]>([]);
  const [loadedPage, setLoadedPage] = useState(0);
  const [pages, setPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 记住已加载的内容，返回时直接用
  useEffect(() => {
    if (loadedPage > 0) groupListCache.set(cacheKey, { items, loadedPage, pages });
  }, [cacheKey, items, loadedPage, pages]);

  // 筛选条件变了（或第一次进来）：从第 1 页开始；通过返回进来且有缓存就沿用
  useEffect(() => {
    const cached = groupListCache.get(cacheKey);
    const reuse = firstLoad.current && cameBack && cached;
    firstLoad.current = false;
    if (reuse && cached) {
      setItems(cached.items);
      setLoadedPage(cached.loadedPage);
      setPages(cached.pages);
      setListLoading(false);
      return;
    }
    let cancelled = false;
    setListLoading(true);
    setLoadError(null);
    requestPage(1).then((res) => {
      if (cancelled) return;
      if (res) {
        setItems(res.groups);
        setLoadedPage(1);
        setPages(res.pages);
      } else {
        setLoadError("Failed to load groups");
      }
      setListLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  const hasMore = loadedPage > 0 && loadedPage < pages;
  const loadMore = useCallback(async () => {
    if (loadingMore || listLoading || !hasMore) return;
    setLoadingMore(true);
    setLoadError(null);
    const res = await requestPage(loadedPage + 1);
    if (res) {
      setItems((prev) => appendUnique(prev, res.groups, (g) => g.id));
      setLoadedPage(loadedPage + 1);
      setPages(res.pages);
    } else {
      setLoadError("Failed to load more groups");
    }
    setLoadingMore(false);
  }, [loadingMore, listLoading, hasMore, requestPage, loadedPage]);

  /** 新增 / 编辑 / 删除 / 关注后：重新拿已加载的那几页，列表不跳回顶部 */
  const reloadLoaded = useCallback(async () => {
    const upto = Math.max(1, loadedPage);
    let all: GroupApi[] = [];
    let total = pages;
    for (let p = 1; p <= upto; p++) {
      const res = await requestPage(p);
      if (!res) break;
      all = appendUnique(all, res.groups, (g) => g.id);
      total = res.pages;
      if (p >= res.pages) break;
    }
    setItems(all);
    setLoadedPage(Math.min(upto, total));
    setPages(total);
  }, [loadedPage, pages, requestPage]);

  // 通过返回回到这一页时，滚回离开前的位置
  useScrollRestoration(!listLoading && loadedPage > 0);

  const rows = items;
  const currentPage = loadedPage;
  const totalPages = pages;

  // 兼容旧调用：refreshPage 现在刷新已加载的全部内容
  const refreshPage = useCallback(async (_page?: number) => reloadLoaded(), [reloadLoaded]);

  // ===== 搜索（只对 available/searchOnly 有意义）
  const submitSearch = useCallback((e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault?.();
    const params = new URLSearchParams(searchParams.toString());
    const val = qInput.trim();
    if (val) params.set("q", val);
    else params.delete("q");
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
  const canEditGroup = useCallback((g: GroupApi) => canEditGroupOf(g, user), [user]);
  const canDeleteGroup = useCallback((g: GroupApi) => canDeleteGroupOf(g, user), [user]);

  const openNew = useCallback(() => {
    if (!canCreate) {
      alert("You do not have permission to create groups");
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
      join_policy: joinPolicyOf(updated),
      ...(updated.post_policy ? { post_policy: updated.post_policy } : {}),
      ...(updated.comment_policy ? { comment_policy: updated.comment_policy } : {}),
    };

    if (isNew) {
      const action = await dispatch(createGroup(body));
      setModalSaving(false);

      if (createGroup.fulfilled.match(action)) {
        // 新小组排在最前面：搜索中就清掉搜索，否则重新加载已加载的部分
        if (mode === "visibleWithSearch" && qParam) {
          dispatch(clearSearchAction());
          router.push(basePath);
        } else {
          await reloadLoaded();
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
        await reloadLoaded();
        setIsModalOpen(false);
      } else {
        const msg = (action.payload as string) ?? "Update group failed";
        const fieldErrors = mapApiErrorToFields(msg);
        if (fieldErrors.title || fieldErrors.description) setModalErrors(fieldErrors);
        else alert(msg);
      }
    }
  }, [dispatch, isNew, reloadLoaded, qParam, mode, basePath, router]);

  const deleteGroup = useCallback(async (id: number) => {
    setDeleting(true);
    const action = await dispatch(deleteGroupThunk(id));
    setDeleting(false);

    if (deleteGroupThunk.fulfilled.match(action)) {
      // 从列表里拿掉这一个，位置不变
      setItems((prev) => prev.filter((g) => g.id !== id));
      return true;
    } else {
      alert((action.payload as string) || "Delete group failed");
      return false;
    }
  }, [dispatch]);

  // ===== 覆盖文案
  const overlayText =
    saving ? "Saving…" :
      deleting ? "Deleting…" :
          undefined;

  const pageLoading = !mounted;

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

    // 无限滚动
    hasMore,
    loadMore,
    loadingMore,
    loadError,
    refreshPage,

    // 权限/操作
    canCreate,
    canEditGroup,
    canDeleteGroup,

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
    overlayText,
  };
}
