"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { PencilSquareIcon, TrashIcon, ArrowRightCircleIcon, PlusIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import PageTitle from '@/components/PageTitle';
import GroupModal from '@/components/GroupModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { useAppDispatch, useAppSelector } from '@/app/features/hooks';
import {
  createGroup, fetchAvailableGroups, updateGroup, deleteGroup, searchGroups,
  setSearchQuery, clearSearch,
} from '@/app/features/groups/slice';
import type { CreateOrUpdateGroupBody } from '@/app/types/group';
import type { GroupProps } from '@/app/types';
import { useRouter, useSearchParams } from 'next/navigation';
import Pagination from "@/components/Pagination";
import { formatDate } from '@/app/ultility';

const PER_PAGE = 10;
const STICKY_OFFSET = 80; // approximate sticky header height

// simple media query hook
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

  // Mobile infinite scroll state
  const [mobileItems, setMobileItems] = useState<GroupProps[]>([]);
  const [mobilePage, setMobilePage] = useState<number>(1);
  const [mobileHasMore, setMobileHasMore] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const isAppendingRef = useRef(false); // prevent overwrite during append
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // scroll anchoring refs (mobile)
  const lastScrollYRef = useRef(0);
  const anchorIdRef = useRef<number | null>(null);
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    const q = (searchParams.get('q') || '').trim();
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

    if (q) {
      dispatch(setSearchQuery(q));
      dispatch(searchGroups({ q, page, per_page: PER_PAGE }));
    } else {
      dispatch(clearSearch());
      dispatch(fetchAvailableGroups({ page, per_page: PER_PAGE }));
    }
  }, [searchParams, dispatch]);

  useEffect(() => {
    setQInput(searchQuery);
  }, [searchQuery]);

  // Derived
  const listToRender = searchQuery ? searchResults : availableGroups;

  const currentPage = useMemo(() => {
    const p = parseInt(searchParams.get("page") || "1", 10);
    return Number.isFinite(p) && p > 0 ? p : 1;
  }, [searchParams]);

  const totalPages = useMemo(() => {
    // prefer API's total pages if your slice stores it as `pages`
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

  const refreshPage = async (page: number) => {
    if (searchQuery) {
      await dispatch(searchGroups({ q: searchQuery, page, per_page: PER_PAGE }));
    } else {
      await dispatch(fetchAvailableGroups({ page, per_page: PER_PAGE }));
    }
  };

  // ===== Mobile infinite scroll wiring =====
  // init/reset only when not appending
  useEffect(() => {
    if (!isMobile) return;
    if (isAppendingRef.current) return;
    setMobileItems(listToRender);
    setMobilePage(currentPage);
  }, [isMobile, listToRender, currentPage]);

  // recompute hasMore
  useEffect(() => {
    if (!isMobile) return;
    setMobileHasMore(mobilePage < totalPages);
  }, [isMobile, mobilePage, totalPages]);

  // append when new page arrives
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
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isMobile, loadMore]);

  // ===== Scroll restore after edit/delete (mobile) =====
  useEffect(() => {
    if (!isMobile) return;
    const id = anchorIdRef.current;
    if (id == null) return;
    const el = itemRefs.current[id];
    if (el) {
      const rect = el.getBoundingClientRect();
      const targetTop = Math.max(0, window.scrollY + rect.top - STICKY_OFFSET);
      window.scrollTo({ top: targetTop, behavior: 'auto' });
    } else {
      // fallback to prior Y if anchor not found (e.g., last item deleted)
      window.scrollTo({ top: lastScrollYRef.current, behavior: 'auto' });
    }
    anchorIdRef.current = null;
  }, [isMobile, mobileItems]); // mobileItems changes after refresh/append

  // ===== Handlers =====
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
      const action = await dispatch(createGroup(body));
      if (createGroup.fulfilled.match(action)) {
        await refreshPage(1);
        if (currentPage !== 1) router.push(buildHref(1));
      } else {
        alert((action.payload as string) ?? 'Create group failed');
      }
    } else {
      // anchor to the edited item (mobile)
      if (isMobile) {
        lastScrollYRef.current = window.scrollY;
        anchorIdRef.current = updatedGroup.id;
      }
      const action = await dispatch(updateGroup({ groupId: updatedGroup.id, body }));
      if (updateGroup.fulfilled.match(action)) {
        await refreshPage(currentPage); // stay on current page
        setMobileItems((prev) =>
          prev.map((g) => (g.id === updatedGroup.id ? { ...g, ...updatedGroup } as GroupProps : g))
        );
      } else {
        alert((action.payload as string) ?? 'Update group failed');
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

    // pre-compute anchor: next item if possible, else previous
    if (isMobile) {
      const rows = mobileItems;
      const idx = rows.findIndex((g) => g.id === groupToDelete);
      const nextId = rows[idx + 1]?.id ?? rows[idx - 1]?.id ?? null;
      lastScrollYRef.current = window.scrollY;
      anchorIdRef.current = nextId;
    }

    const prevTotal = Number(pagination?.total ?? 0);
    const newTotal = Math.max(0, prevTotal - 1);
    const newLastPage = Math.max(1, Math.ceil(newTotal / PER_PAGE));
    const targetPage = Math.min(currentPage, newLastPage);

    const action = await dispatch(deleteGroup(groupToDelete));
    if (deleteGroup.fulfilled.match(action)) {
      await refreshPage(targetPage);
      setIsDeleteConfirmOpen(false);
      setGroupToDelete(null);
      if (targetPage !== currentPage) router.push(buildHref(targetPage));
      setMobileItems((prev) => prev.filter((g) => g.id !== action.meta.arg));
    } else {
      alert((action.payload as string) || 'Delete group failed');
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

  const onClearSearch = () => {
    setQInput('');
    dispatch(clearSearch());
    router.push('/groups');
  };

  // choose data source per layout
  const desktopRows = listToRender;
  const mobileRows = isMobile ? mobileItems : listToRender;

  return (
    <>
      <PageTitle title="Groups" showPageTitle={true} />

      <button
        onClick={handleAdd}
        className="fixed md:hidden bottom-8  z-20 left-1/2 -translate-x-1/2 bg-yellow px-3 py-3 rounded-[50%]">
        <PlusIcon className="h-7 w-7 text-white" />
      </button>

      <div className="mx-auto w-full p-4 min-h-screen lg:container">
        <div className=" mb-4 lg:p-4 sticky top-0 bg-bg">
          <form onSubmit={onSubmitSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
              <input
                name="q"
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Search groups…"
                className="w-full pl-10 pr-10 py-2 border border-border rounded-sm"
                aria-label="Search groups"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-dark-gray"
                  aria-label="Clear search"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            <button type="submit" className="px-4 py-2 bg-dark-green text-white rounded-sm hover:bg-green">
              Search
            </button>
          </form>

          {searchQuery && (
            <p className="text-sm text-gray mt-2">
              Showing results for <span className="text-dark-green">“{searchQuery}”</span>
            </p>
          )}
        </div>

        <div className='hidden md:flex justify-start ml-4'>
          <button
            onClick={handleAdd}
            className="mb-4 flex items-center px-4 py-2 bg-dark-green text-white rounded-sm hover:bg-green"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Group
          </button>
        </div>

        {/* Desktop table + numeric pagination */}
        <div className="hidden md:block overflow-x-auto p-4">
          <table className="min-w-full bg-bg shadow-lg">
            <thead>
              <tr className="bg-light-gray text-dark-gray">
                <th className="py-2 px-4 text-left">Title</th>
                <th className="py-2 px-4 text-left">Description</th>
                <th className="py-2 px-4 text-left">Created Date</th>
                <th className="py-2 px-4 text-left">Creator</th>
                <th className="py-2 px-4 text-left">Membership</th>
                <th className="py-2 px-4 text-left">View</th>
                <th className="py-2 px-4 text-left">Manage</th>
              </tr>
            </thead>
            <tbody>
              {desktopRows.map((group, index) => {
                const subbed = isUserSubscribed(group);
                return (
                  <tr key={group.id} className={`${index % 2 === 0 ? '' : 'bg-gray-50'}`}>
                    <td className="py-2 px-4 text-gray">{group.title}</td>
                    <td className="py-2 px-4 text-gray">{group.description}</td>
                    <td className="py-2 px-4 text-gray">{formatDate(group.createdDate)}</td>
                    <td className="py-2 px-4 text-gray">{group.creator.firstName}</td>
                    <td className="py-2 px-4">
                      <button
                        className={`w-28 py-1 rounded-md text-white ${subbed ? 'bg-yellow hover:bg-dark-yellow' : 'bg-green hover:bg-dark-green'}`}
                      >
                        {subbed ? 'Unsubscribe' : 'Subscribe'}
                      </button>
                    </td>
                    <td className="py-2 px-4">
                      <Link href={`/groups/${group.id}`}>
                        <ArrowRightCircleIcon className="h-7 w-7 text-green hover:text-dark-green cursor-pointer" />
                      </Link>
                    </td>
                    <td className="py-2 px-4">
                      {canEdit(group) && (
                        <div className="flex items-center gap-2">
                          <PencilSquareIcon className="h-5 w-5 text-green hover:text-dark-green cursor-pointer" onClick={() => handleEdit(group)} />
                          <TrashIcon className="h-5 w-5 text-green hover:text-dark-green cursor-pointer" onClick={() => handleDeleteClick(group.id)} />
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="mt-6 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              buildHref={buildHref}
            />
          </div>
        </div>

        {/* Mobile infinite list */}
        <div className="md:hidden space-y-4">
          {mobileRows.map((group) => {
            const subbed = isUserSubscribed(group);
            return (
              <div
                className={`card p-3 ${group.inviteOnly ? 'backdrop-blur-sm bg-opacity-80' : ''}`}
                key={group.id}
                ref={(el) => { itemRefs.current[group.id] = el; }}
              >
                <div className="absolute right-2 t-5 flex space-x-2">
                  {canEdit(group) && (
                    <>
                      <PencilSquareIcon className="h-5 w-5 text-green hover:text-dark-green cursor-pointer" onClick={() => handleEdit(group)} />
                      <TrashIcon className="h-5 w-5 text-green hover:text-dark-green cursor-pointer" onClick={() => handleDeleteClick(group.id)} />
                    </>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-dark-gray mt-5">{group.title}</h2>
                <p className="text-gray text-sm">{group.description}</p>
                <p className="text-xs text-gray mt-1">
                  Created: {formatDate(group.createdDate)} by {group.creator.firstName}
                  {group.inviteOnly && <span className="text-dark-green"> (Invite Only)</span>}
                </p>
                <div className="mt-2 flex justify-between items-center">
                  <button
                    className={`min-w-28 px-3 py-1 rounded-md ${subbed
                      ? 'bg-white text-dark-gray border border-border'
                      : 'text-white bg-green hover:bg-dark-green'
                      }`}
                  >
                    {subbed ? 'Unsubscribe' : 'Subscribe'}
                  </button>
                  <Link href={`/groups/${group.id}`}>
                    <ArrowRightCircleIcon className="h-7 w-7 text-green hover:text-dark-green cursor-pointer" />
                  </Link>
                </div>
              </div>
            )
          })}

          <div className="flex justify-center">
            {mobileHasMore ? (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-4 py-2 border border-border rounded-sm text-dark-gray"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            ) : (
              <span className="text-sm text-gray">No more results</span>
            )}
          </div>
          <div ref={sentinelRef} aria-hidden className="h-1" />
        </div>
      </div>

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
