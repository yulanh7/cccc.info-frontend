"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import PageTitle from '@/components/layout/PageTitle';
import GroupModal from '@/components/GroupModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { useAppDispatch, useAppSelector } from '@/app/features/hooks';
import {
  createGroup, fetchAvailableGroups, updateGroup, deleteGroup, searchGroups,
  setSearchQuery, clearSearch, joinGroup, leaveGroup,
} from '@/app/features/groups/slice';
import type { CreateOrUpdateGroupBody } from '@/app/types/group';
import type { GroupProps } from '@/app/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDate } from '@/app/ultility';
import LoadingOverlay from "@/components/feedback/LoadingOverLay";

import SearchBar from "@/components/SearchBar";
import GroupsDesktopTable from "@/components/groups/GroupsDesktopTable";
import GroupsMobileList from "@/components/groups/GroupsMobileList";

const PER_PAGE = 10;
const STICKY_OFFSET = 80;

/** media query */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}

/** lock body scroll when overlaying */
function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    const { body } = document;
    if (!body) return;
    const prev = body.style.overflow;
    if (locked) body.style.overflow = 'hidden';
    return () => { body.style.overflow = prev; };
  }, [locked]);
}

export default function GroupsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  // Redux data
  const availableGroups = useAppSelector((s) => s.groups.availableGroups);
  const searchQuery = useAppSelector((s) => s.groups.searchQuery);
  const searchResults = useAppSelector((s) => s.groups.searchResults);
  const user = useAppSelector((s) => s.auth.user);
  const availablePagination = useAppSelector((s) => s.groups.availableGroupsPagination);
  const searchPagination = useAppSelector((s) => s.groups.searchPagination);
  const pagination = searchQuery ? searchPagination : availablePagination;

  // UI state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupProps | undefined>(undefined);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<number | null>(null);
  const [qInput, setQInput] = useState('');


  // Loading states
  const [listLoading, setListLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [restoring, setRestoring] = useState(false); // overlay during restore/optimistic reconcile
  const [toggling, setToggling] = useState(false);
  useBodyScrollLock(Boolean(saving || deleting || restoring || toggling));

  // Mobile infinite
  const [mobileItems, setMobileItems] = useState<GroupProps[]>([]);
  const [mobilePage, setMobilePage] = useState<number>(1);
  const [mobileHasMore, setMobileHasMore] = useState<boolean>(false);
  const isAppendingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Scroll anchor (mobile)
  const lastScrollYRef = useRef(0);
  const anchorIdRef = useRef<number | null>(null);
  const anchorRelOffsetRef = useRef<number>(0);
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // lock body scroll whenever overlay visible
  useBodyScrollLock(Boolean(saving || deleting || restoring));

  // ===== helpers: anchor snapshot / set before action / restore =====
  const getAnchorSnapshot = useCallback(() => {
    const topLine = STICKY_OFFSET;
    let bestId: number | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    let bestRel = 0;
    for (const [idStr, el] of Object.entries(itemRefs.current)) {
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const rel = rect.top - topLine;
      const dist = Math.abs(rel);
      if (dist < bestDist) {
        bestDist = dist; bestRel = rel; bestId = Number(idStr);
      }
    }
    return { id: bestId, relOffset: bestRel, scrollY: window.scrollY };
  }, []);

  const setAnchorBeforeAction = useCallback((preferredId?: number | null) => {
    const snap = getAnchorSnapshot();
    lastScrollYRef.current = snap.scrollY;
    if (preferredId && itemRefs.current[preferredId]) {
      const el = itemRefs.current[preferredId]!;
      const rect = el.getBoundingClientRect();
      anchorIdRef.current = preferredId;
      anchorRelOffsetRef.current = rect.top - STICKY_OFFSET;
    } else {
      anchorIdRef.current = preferredId ?? snap.id;
      anchorRelOffsetRef.current = snap.relOffset;
    }
    setRestoring(true);
  }, [getAnchorSnapshot]);

  const restoreToAnchor = useCallback(() => {
    const id = anchorIdRef.current;
    const rel = anchorRelOffsetRef.current || 0;
    if (id == null) {
      window.scrollTo({ top: lastScrollYRef.current, behavior: 'auto' });
      return;
    }
    const el = itemRefs.current[id];
    if (!el) {
      window.scrollTo({ top: lastScrollYRef.current, behavior: 'auto' });
      return;
    }
    const rect = el.getBoundingClientRect();
    const delta = rect.top - (STICKY_OFFSET + rel);
    const targetTop = Math.max(0, window.scrollY + delta);
    window.scrollTo({ top: targetTop, behavior: 'auto' });
  }, []);

  // fetch on URL change
  useEffect(() => {
    const q = (searchParams.get('q') || '').trim();
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

    (async () => {
      setListLoading(true);
      if (q) {
        dispatch(setSearchQuery(q));
        await dispatch(searchGroups({ q, page, per_page: PER_PAGE }));
      } else {
        dispatch(clearSearch());
        await dispatch(fetchAvailableGroups({ page, per_page: PER_PAGE }));
      }
      setListLoading(false);
    })();
  }, [searchParams, dispatch]);

  useEffect(() => setQInput(searchQuery), [searchQuery]);

  // Derived
  const listToRender = searchQuery ? searchResults : availableGroups;

  const currentPage = useMemo(() => {
    const p = parseInt(searchParams.get("page") || "1", 10);
    return Number.isFinite(p) && p > 0 ? p : 1;
  }, [searchParams]);

  const totalPages = useMemo(() => {
    if (typeof (pagination as any)?.pages === 'number') {
      return Math.max(1, (pagination as any).pages as number);
    }
    const total = Number(pagination?.total ?? 0);
    const per = Number(pagination?.per_page ?? PER_PAGE);
    return Math.max(1, Math.ceil(total / Math.max(1, per)));
  }, [pagination]);

  const buildHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    return `/groups${params.toString() ? `?${params.toString()}` : ""}`;
  };

  const refreshPage = async (page: number, withLoading = false) => {
    if (withLoading) setListLoading(true);
    if (searchQuery) {
      await dispatch(searchGroups({ q: searchQuery, page, per_page: PER_PAGE }));
    } else {
      await dispatch(fetchAvailableGroups({ page, per_page: PER_PAGE }));
    }
    if (withLoading) setListLoading(false);
  };

  // Mobile infinite wiring
  useEffect(() => {
    if (!isMobile) return;
    if (isAppendingRef.current) return;
    setMobileItems(listToRender);
    setMobilePage(currentPage);
  }, [isMobile, listToRender, currentPage]);

  useEffect(() => {
    if (!isMobile) return;
    setMobileHasMore(mobilePage < totalPages);
  }, [isMobile, mobilePage, totalPages]);

  useEffect(() => {
    if (!isMobile) return;
    if (!isAppendingRef.current) return;
    setMobileItems((prev) => {
      const next = [...prev, ...listToRender];
      const seen = new Set<number>();
      return next.filter((g) => (seen.has(g.id) ? false : (seen.add(g.id), true)));
    });
    isAppendingRef.current = false;
  }, [isMobile, listToRender]);

  const loadMore = useCallback(async () => {
    if (!isMobile || loadingMore || !mobileHasMore) return;
    setLoadingMore(true);
    const nextPage = mobilePage + 1;
    isAppendingRef.current = true;
    await refreshPage(nextPage);
    setMobilePage(nextPage);
    setLoadingMore(false);
  }, [isMobile, loadingMore, mobileHasMore, mobilePage]);

  // auto-trigger on scroll to sentinel
  useEffect(() => {
    if (!isMobile) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { root: null, rootMargin: "200px", threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isMobile, loadMore]);

  // Restore after DOM stable
  useEffect(() => {
    if (!isMobile) return;
    if (anchorIdRef.current == null && lastScrollYRef.current === 0) return;
    const r1 = requestAnimationFrame(() => {
      const r2 = requestAnimationFrame(() => {
        restoreToAnchor();
        anchorIdRef.current = null;
        anchorRelOffsetRef.current = 0;
        setRestoring(false);
      });
      (restoreToAnchor as any).__r2 = r2;
    });
    (restoreToAnchor as any).__r1 = r1;
    return () => {
      if ((restoreToAnchor as any).__r1) cancelAnimationFrame((restoreToAnchor as any).__r1);
      if ((restoreToAnchor as any).__r2) cancelAnimationFrame((restoreToAnchor as any).__r2);
    };
  }, [isMobile, mobileItems, restoreToAnchor]);

  // Handlers
  const handleEdit = (group: GroupProps) => {
    setSelectedGroup(group);
    setIsNew(false);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedGroup(undefined);
    setIsNew(true);
    setIsModalOpen(true);
  };

  const handleSave = async (updatedGroup: GroupProps) => {
    const body: CreateOrUpdateGroupBody = {
      name: updatedGroup.title.trim(),
      description: updatedGroup.description.trim(),
      isPrivate: updatedGroup.inviteOnly,
    };

    if (isNew) {
      setSaving(true);
      const action = await dispatch(createGroup(body));
      setSaving(false);
      if (createGroup.fulfilled.match(action)) {
        // 新建后回到第一页（置顶）
        await refreshPage(1, true);
        if (currentPage !== 1) router.push(buildHref(1));
      } else {
        alert((action.payload as string) ?? 'Create group failed');
      }
    } else {
      // 移动端：乐观就地更新，后台静默校准；桌面端保持原逻辑
      if (isMobile) {
        // 记录锚点（使用当前卡片），但不立刻整页刷新
        setAnchorBeforeAction(updatedGroup.id);
        setSaving(true);
        const action = await dispatch(updateGroup({ groupId: updatedGroup.id, body }));
        setSaving(false);
        if (updateGroup.fulfilled.match(action)) {
          // 就地打补丁（不改变顺序，避免重排）
          setMobileItems((prev) =>
            prev.map((g) => (g.id === updatedGroup.id ? { ...g, ...updatedGroup } as GroupProps : g))
          );
          // 后台静默校准（不走 listLoading），不替换本地数组（避免闪动）
          void refreshPage(currentPage, false);
          // 立即执行一次恢复（几乎无位移）
          const r = requestAnimationFrame(() => {
            restoreToAnchor();
            cancelAnimationFrame(r);
            setRestoring(false);
          });
        } else {
          setRestoring(false);
          alert((action.payload as string) ?? 'Update group failed');
        }
      } else {
        // 桌面：保持你原先的刷新逻辑
        setSaving(true);
        const action = await dispatch(updateGroup({ groupId: updatedGroup.id, body }));
        setSaving(false);
        if (updateGroup.fulfilled.match(action)) {
          await refreshPage(currentPage, true);
        } else {
          alert((action.payload as string) ?? 'Update group failed');
        }
      }
    }
    setIsModalOpen(false);
  };

  const handleDeleteClick = (id: number) => {
    setGroupToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (groupToDelete === null) return;

    if (isMobile) {
      // 找相邻项作为锚点（优先），并准备滚动补偿
      const rows = mobileItems;
      const idx = rows.findIndex((g) => g.id === groupToDelete);
      const neighborId = rows[idx + 1]?.id ?? rows[idx - 1]?.id ?? null;
      const toDeleteEl = itemRefs.current[groupToDelete];
      const delHeight = toDeleteEl?.getBoundingClientRect().height ?? 0;

      setAnchorBeforeAction(neighborId); // 同时记录相对偏移，Overlay 打开
      // 乐观本地移除并做滚动补偿（避免视图上跳）
      setMobileItems((prev) => prev.filter((g) => g.id !== groupToDelete));
      if (delHeight > 0) {
        // 直接补偿位移，让视口看起来完全不动
        window.scrollBy({ top: -delHeight, behavior: 'auto' });
      }

      setDeleting(true);
      const action = await dispatch(deleteGroup(groupToDelete));
      setDeleting(false);

      if (deleteGroup.fulfilled.match(action)) {
        // 后台静默校准（不置 listLoading）
        void refreshPage(currentPage, false);
        // 轻触恢复（基本不会有位移，因为我们已做高度补偿）
        const r = requestAnimationFrame(() => {
          restoreToAnchor();
          cancelAnimationFrame(r);
          setRestoring(false);
        });
        setIsDeleteConfirmOpen(false);
        setGroupToDelete(null);
      } else {
        // 回滚：把项加回列表并撤销位移
        setMobileItems((prev) => {
          const original = rows; // 旧的 rows 就是未删前的顺序
          return original;
        });
        if (delHeight > 0) {
          window.scrollBy({ top: delHeight, behavior: 'auto' });
        }
        setRestoring(false);
        alert((action.payload as string) || 'Delete group failed');
      }
    } else {
      // 桌面：保持原逻辑
      const prevTotal = Number(pagination?.total ?? 0);
      const newTotal = Math.max(0, prevTotal - 1);
      const newLastPage = Math.max(1, Math.ceil(newTotal / PER_PAGE));
      const targetPage = Math.min(currentPage, newLastPage);

      setDeleting(true);
      const action = await dispatch(deleteGroup(groupToDelete));
      setDeleting(false);

      if (deleteGroup.fulfilled.match(action)) {
        await refreshPage(targetPage, true);
        setIsDeleteConfirmOpen(false);
        setGroupToDelete(null);
        if (targetPage !== currentPage) router.push(buildHref(targetPage));
      } else {
        alert((action.payload as string) || 'Delete group failed');
      }
    }
  };

  const canEdit = (g: GroupProps) => !!user && (user.admin || g.editable === true);
  const isUserSubscribed = (g: GroupProps) => g.subscribed === true;

  const onSubmitSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = qInput.trim();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    router.push(`/groups${params.toString() ? `?${params}` : ''}`);
  };

  const handleToggleSubscription = async (group: GroupProps) => {
    setToggling(true);
    const action = group.subscribed ? await dispatch(leaveGroup(group.id))
      : await dispatch(joinGroup(group.id));
    setToggling(false);

    if (leaveGroup.rejected.match(action) || joinGroup.rejected.match(action)) {
      alert((action.payload as string) || (group.subscribed ? 'Leave group failed' : 'Join group failed'));
      return;
    }

    // 可选：静默刷新当前页，确保与服务器完全一致（顺序不变基本不会闪动）
    void refreshPage(currentPage, false);
  };
  const onClearSearch = () => {
    setQInput('');
    dispatch(clearSearch());
    router.push('/groups');
  };

  const desktopRows = listToRender;
  const mobileRows = isMobile ? mobileItems : listToRender;

  const overlayText =
    saving ? "Saving…" :
      deleting ? "Deleting…" :
        restoring ? "Updating view…" :
          toggling ? "Updating membership…" :
            undefined;

  return (
    <>
      <PageTitle title="Groups" showPageTitle={true} />

      <button
        onClick={handleAdd}
        className="fixed md:hidden bottom-8 z-20 left-1/2 -translate-x-1/2 bg-yellow px-3 py-3 rounded-[50%]">
        <PlusIcon className="h-7 w-7 text-white" />
      </button>

      <div className="mx-auto w-full p-4 min-h-screen lg:container">
        <SearchBar
          value={qInput}
          onChange={setQInput}
          onSubmit={onSubmitSearch}
          onClear={onClearSearch}
          placeholder="Search groups…"
          sticky
          showResultHint={Boolean(searchQuery)}
          resultHint={
            <p className="text-sm text-gray mt-2">
              Showing results for <span className="text-dark-green">“{searchQuery}”</span>
            </p>
          }
        />

        <div className='hidden md:flex justify-start ml-4'>
          <button
            onClick={handleAdd}
            className="mb-4 flex items-center px-4 py-2 bg-dark-green text-white rounded-sm hover:bg-green"
            disabled={saving || deleting || restoring}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Group
          </button>
        </div>

        <GroupsDesktopTable
          rows={desktopRows}
          listLoading={listLoading}
          canEdit={canEdit}
          isUserSubscribed={isUserSubscribed}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onToggleSubscription={handleToggleSubscription}
          currentPage={currentPage}
          totalPages={totalPages}
          buildHref={buildHref}
          saving={saving || restoring}
          deleting={deleting || restoring}
          toggling={toggling}
          formatDate={formatDate}
        />

        <GroupsMobileList
          rows={mobileRows}
          listLoading={listLoading}
          canEdit={canEdit}
          isUserSubscribed={isUserSubscribed}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onToggleSubscription={handleToggleSubscription}
          saving={saving || restoring}
          deleting={deleting || restoring}
          toggling={toggling}
          mobileHasMore={mobileHasMore}
          loadMore={loadMore}
          loadingMore={loadingMore}
          setItemRef={(id, el) => { itemRefs.current[id] = el; }}
          sentinelRef={sentinelRef}
          formatDate={formatDate}
        />
      </div>

      <LoadingOverlay show={Boolean(saving || deleting || restoring)} text={overlayText} />

      {isModalOpen && (
        <GroupModal
          group={selectedGroup}
          isNew={isNew}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onConfirm={confirmDelete}
        onCancel={() => { setIsDeleteConfirmOpen(false); setGroupToDelete(null); }}
        message="Are you sure you want to delete this group?"
      />
    </>
  );
}
