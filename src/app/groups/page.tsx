"use client";
import { Suspense } from "react";
import React, { useMemo, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import PageTitle from "@/components/layout/PageTitle";
import SearchBar from "@/components/SearchBar";
import LoadingOverlay from "@/components/feedback/LoadingOverLay";
import GroupModal from "@/components/groups/GroupModal";
import ConfirmModal from "@/components/ConfirmModal";
import GroupListView from "@/components/groups/GroupListView";
import { formatDate } from "@/app/ultility";
import { useConfirm } from "@/hooks/useConfirm";
import { useGroupListController } from "@/hooks/useGroupListController";
import { GROUPS_PER_PAGE } from "@/app/constants";
import { MagnifyingGlassIcon, XMarkIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";

export default function GroupsPage() {
  return (
    <Suspense fallback={<LoadingOverlay show text="Loading groups…" />}>
      <GroupsPageInner />
    </Suspense>
  );
}

function GroupsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // tab
  const tab = useMemo(() => {
    const t = (searchParams.get("tab") || "all").toLowerCase();
    return t === "subscribed" ? "subscribed" : "all";
  }, [searchParams]);

  // controller mode
  const mode = tab === "subscribed" ? "subscribed" : "visibleWithSearch";

  const {
    // data
    rows,
    listLoading,
    pageLoading,
    currentPage,
    totalPages,
    // search
    qInput,
    setQInput,
    searchQuery,
    submitSearch,
    clearSearch,
    // paging
    onPageChange,
    // perms & actions
    canCreate,
    canEditGroup,
    isUserSubscribed,
    toggleSubscription,
    // modal
    isModalOpen,
    saveGroup: innerSaveGroup,
    isNew,
    selectedGroup,
    modalSaving,
    modalErrors,
    openNew,
    openEdit,
    closeModal,
    saveGroup,
    // delete
    deleteGroup,
    // states
    saving,
    deleting,
    toggling,
    buildHref,

  } = useGroupListController({
    mode,
    pageSize: GROUPS_PER_PAGE,
    basePath: "/groups",
  });

  const confirmGroupDelete = useConfirm<number>("Are you sure you want to delete this group?");

  const switchTab = (nextTab: "all" | "subscribed") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nextTab);
    params.delete("page");
    if (nextTab === "subscribed") params.delete("q");
    router.push(`/groups?${params.toString()}`);
  };

  // --- Mobile search header state ---
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (mobileSearchOpen) mobileInputRef.current?.focus();
  }, [mobileSearchOpen]);



  return (
    <>
      <LoadingOverlay show={pageLoading} text="Loading groups…" />

      {/* Desktop page title */}
      <div className="hidden md:block">
        <PageTitle title="Groups" showPageTitle />
      </div>

      {/* ===== MOBILE HEADER (inline, no external components) ===== */}
      <div className="md:hidden sticky top-0 z-40 bg-bg/90 backdrop-blur border-b-1 border-border">
        <div className="relative h-14 flex items-center justify-between px-3">
          {/* Left: Logo (常态) / Back (搜索态)  */}
          {!mobileSearchOpen ? (
            <button
              className="flex items-center gap-2"
              onClick={() => router.push("/")}
              aria-label="Home"
            >
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={28}
                height={28}
                className="h-7 w-7"
                priority
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              aria-label="Cancel search"
              className="p-2 -ml-1"
            >
              <ChevronLeftIcon className="h-6 w-6 text-dark-gray" />
            </button>
          )}

          {/* Center: Tabs（始终可见，居中） */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <div
              role="tablist"
              className="inline-flex rounded-sm border border-border overflow-hidden"
            >
              {[
                { key: "all", label: "All" },
                { key: "subscribed", label: "Subscribed" },
              ].map(({ key, label }) => {
                const active = tab === key;
                return (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => switchTab(key as "all" | "subscribed")}
                    className={[
                      "px-3 py-1.5 text-sm transition-colors outline-none",
                      active
                        ? "bg-yellow-300 text-dark font-medium"
                        : "bg-bg text-dark-gray hover:bg-yellow-100 hover:text-dark",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 搜索态覆盖层（保持在 header 内部，提交后也不关闭） */}
          {mobileSearchOpen && (
            <div className="z-10 bg-white flex-1">
              <form
                id="mobile-search-form"
                onSubmit={(e) => {
                  // 只提交，不关闭；用户必须点左侧返回键才退出搜索模式
                  submitSearch(e);
                }}
                className="h-10 relative"
              >
                <input
                  ref={mobileInputRef}
                  name="q"
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                  placeholder="Search all groups…"
                  className="w-full py-2 pl-2 pr-7 border border-border rounded-sm"
                  aria-label="Search groups"
                />
                {qInput && (
                  <button
                    type="button"
                    onClick={() => {
                      clearSearch();
                      mobileInputRef.current?.focus();
                    }}
                    className="absolute right-1 top-2.5 text-gray-400 hover:text-dark-gray"
                    aria-label="Clear search"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}

              </form>
            </div>
          )}

          {/* Right: 常态是搜索图标；搜索态变为“Search”按钮 */}

          {/* Right side: only show on "all" tab */}
          {tab === "all" && (
            !mobileSearchOpen ? (
              <button
                className="p-2 -mr-1"
                aria-label="Open search"
                onClick={() => setMobileSearchOpen(true)}
              >
                <MagnifyingGlassIcon className="h-6 w-6 text-dark-gray" />
              </button>
            ) : (
              <button
                form="mobile-search-form"
                type="submit"
                className="text-sm px-2 py-2 font-medium"
                aria-label="Submit search"
              >
                Search
              </button>
            )
          )}

        </div>
      </div>
      {/* ===== END MOBILE HEADER ===== */}

      {/* Desktop tabs */}
      <div className="mx-auto w-full lg:container px-4 mt-2 md:mt-18 hidden md:flex justify-center">
        <div role="tablist" className="inline-flex rounded-sm border border-border overflow-hidden">
          {[
            { key: "all", label: "All Groups" },
            { key: "subscribed", label: "My Subscribed" },
          ].map(({ key, label }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={active}
                onClick={() => switchTab(key as "all" | "subscribed")}
                className={[
                  "px-4 py-2 text-sm transition-colors outline-none",
                  active
                    ? "bg-yellow-300 text-dark font-medium"
                    : "bg-bg text-dark-gray hover:bg-yellow-100 hover:text-dark",
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto w-full p-4 min-h-screen lg:container">
        {/* Desktop search bar (unchanged logic; your SearchBar component stays the same) */}
        {tab === "all" && (
          <div className="hidden md:block my-6 max-w-[400px] ml-auto">
            <SearchBar
              value={qInput}
              onChange={setQInput}
              onSubmit={submitSearch}
              onClear={clearSearch}
              placeholder="Search groups…"
              sticky
              showResultHint={Boolean(searchQuery)}
              resultHint={
                searchQuery ? (
                  <p className="text-sm text-gray mt-2">
                    Showing results for <span className="text-dark-green">“{searchQuery}”</span>
                  </p>
                ) : null
              }
            />
          </div>
        )}

        <GroupListView
          title={tab === "subscribed" ? "My Subscribed Groups" : "Groups"}
          rows={rows}
          listLoading={listLoading}
          pageLoading={pageLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onAdd={openNew}
          canCreate={canCreate}
          onEdit={openEdit}
          onDelete={(id) => confirmGroupDelete.ask(id)}
          canEdit={canEditGroup}
          isUserSubscribed={isUserSubscribed}
          onToggleSubscription={toggleSubscription}
          saving={saving}
          deleting={deleting}
          toggling={toggling}
          formatDate={formatDate}
        />
      </div>

      {/* New/Edit Modal */}
      {isModalOpen && (
        <GroupModal
          group={selectedGroup}
          isNew={isNew}
          onSave={saveGroup}
          onClose={closeModal}
          saving={modalSaving}
          externalErrors={modalErrors}
        />
      )}

      {/* Delete Confirm Modal (fixed id typo) */}
      <ConfirmModal
        isOpen={confirmGroupDelete.open}
        message={confirmGroupDelete.message}
        onCancel={confirmGroupDelete.cancel}
        onConfirm={confirmGroupDelete.confirm(async (id) => {
          if (id == null) return;
          await deleteGroup(id);
        })}
      />
    </>
  );
}
