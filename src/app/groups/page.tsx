"use client";
import { Suspense } from "react";
import React from "react";
import PageTitle from "@/components/layout/PageTitle";
import MobileSearchHeader from "@/components/layout/MobileSearchHeader";
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
  const {
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
  } = useGroupListController({
    mode: "availableWithSearch",
    pageSize: GROUPS_PER_PAGE,
    basePath: "/groups",
  });

  const confirmGroupDelete = useConfirm<number>("Are you sure you want to delete this group?");

  return (
    <>
      <LoadingOverlay show={pageLoading} text="Loading groups…" />
      <PageTitle title="Groups" showPageTitle />

      {/* Mobile 顶部搜索 */}
      <MobileSearchHeader
        value={qInput}
        onChange={setQInput}
        onSubmit={submitSearch}
        onClear={clearSearch}
        placeholder="Search groups…"
      />

      <div className="mx-auto w-full p-4 min-h-screen lg:container">
        {/* 桌面搜索条 */}
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

        <GroupListView
          title="Groups"
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
