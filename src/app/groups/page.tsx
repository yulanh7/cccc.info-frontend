"use client";

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

const PER_PAGE = 9;

export default function GroupsPage() {
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
    deleting,
    toggling,
  } = useGroupListController({
    mode: "availableWithSearch",
    pageSize: PER_PAGE,
    basePath: "/groups",
  });

  // 删除确认
  const confirmGroupDelete = useConfirm<number>("Are you sure you want to delete this group?");

  return (
    <>
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

        {/* 通用列表视图 */}
        <GroupListView
          title="Groups"
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
          deleting={deleting}
          toggling={toggling}
          formatDate={formatDate}
        />
      </div>

      {/* 首次加载页遮罩 */}
      <LoadingOverlay show={pageLoading} text="Loading groups…" />
      {/* 次级操作遮罩 */}
      <LoadingOverlay show={Boolean(deleting || toggling)} />

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
