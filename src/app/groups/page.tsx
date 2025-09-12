"use client";
import { Suspense } from "react";
import React, { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageTitle from "@/components/layout/PageTitle";
import MobileSearchHeader from "@/components/layout/MobileSearchHeader";
import CustomHeader from "@/components/layout/CustomHeader";
import SearchBar from "@/components/SearchBar";
import LoadingOverlay from "@/components/feedback/LoadingOverLay";
import GroupModal from "@/components/groups/GroupModal";
import ConfirmModal from "@/components/ConfirmModal";
import GroupListView from "@/components/groups/GroupListView";
import { formatDate } from "@/app/ultility";
import { useConfirm } from "@/hooks/useConfirm";
import { useGroupListController } from "@/hooks/useGroupListController";
import { GROUPS_PER_PAGE } from "@/app/constants";


// ⬅️ 外层只负责提供 Suspense 边界
export default function GroupsPage() {
  return (
    <Suspense fallback={<LoadingOverlay show text="Loading groups…" />}>
      <GroupsPageInner />
    </Suspense>
  );
}

// ⬅️ 把原来所有逻辑搬进来：在这个内部组件里调用 hook
function GroupsPageInner() {


  const router = useRouter();
  const searchParams = useSearchParams();

  // 读取 URL 的 tab，默认 all
  const tab = useMemo(() => {
    const t = (searchParams.get("tab") || "all").toLowerCase();
    return t === "subscribed" ? "subscribed" : "all";
  }, [searchParams]);

  // 根据 tab 选择 controller 的 mode
  const mode = tab === "subscribed" ? "subscribed" : "visibleWithSearch";

  const {
    // 数据
    rows,
    listLoading,
    pageLoading,
    currentPage,
    totalPages,
    // 搜索相关
    qInput,
    setQInput,
    searchQuery,
    submitSearch,
    clearSearch,
    // 分页/刷新
    onPageChange,
    // 权限 & 操作
    canCreate,
    canEditGroup,
    isUserSubscribed,
    toggleSubscription,
    // 新建/编辑 Modal
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
    // 状态文案
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

  return (
    <>
      <LoadingOverlay show={pageLoading} text="Loading groups…" />
      <PageTitle title="Groups" showPageTitle />

      {/* Mobile 顶部搜索：仅 all tab 显示 */}
      {tab === "all" && (
        <MobileSearchHeader
          value={qInput}
          onChange={setQInput}
          onSubmit={submitSearch}
          onClear={clearSearch}
          placeholder="Search groups…"
        />
      )}

      {tab === "subscribed" && (
        <CustomHeader
          pageTitle="Groups"
          showLogo={true}
        />
      )}
      {/* Tabs */}
      <div className="mx-auto  w-full lg:container px-4 mt-2 md:mt-18 flex justify-center">
        <div
          role="tablist"
          className="inline-flex rounded-2xl border border-border overflow-hidden"
        >
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
                    ? "bg-yellow-300 text-dark font-medium" // 激活：黄色背景
                    : "bg-bg text-dark-gray hover:bg-yellow-100 hover:text-dark" // 未激活：悬浮微黄
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mx-auto w-full p-4 min-h-screen lg:container">
        {/* 桌面搜索条：仅 all tab 显示 */}
        {tab === "all" && (
          <div className="hidden md:block my-6">
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



      {/* 新建/编辑弹窗 */}
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

      {/* 删除确认弹窗 */}
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
