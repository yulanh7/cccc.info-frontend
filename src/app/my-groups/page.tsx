"use client";
import { Suspense } from "react";
import React, { useMemo, useState } from "react";
import PageTitle from "@/components/layout/PageTitle";
import LoadingOverlay from "@/components/feedback/LoadingOverLay";
import GroupModal from "@/components/groups/GroupModal";
import ConfirmModal from "@/components/ConfirmModal";
import GroupListView from "@/components/groups/GroupListView";
import { formatDate } from "@/app/ultility";
import { useConfirm } from "@/hooks/useConfirm";
import { useGroupListController } from "@/hooks/useGroupListController";

const PER_PAGE = 9;
const MY_GROUPS_PATH = "/my-groupss"; // 你也可以改成 /groups/mine

export default function MyGroupsPage() {
  return (
    <Suspense fallback={<LoadingOverlay show text="Loading group…" />}>
      <MyGroupsPageInner />
    </Suspense>
  );
}

function MyGroupsPageInner() {
  const {
    // 数据（来自已订阅）
    rows,
    listLoading,
    pageLoading,
    currentPage,
    totalPages,

    // 分页
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
    overlayText,
  } = useGroupListController({
    mode: "user",         // ✅ 只拉取用户订阅的群组
    pageSize: PER_PAGE,
    basePath: MY_GROUPS_PATH,
  });



  // ========== 本地搜索（仅过滤已订阅群组） ==========
  const [qInput, setQInput] = useState("");
  const filteredRows = useMemo(() => {
    const q = qInput.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(g => {
      const hay = `${g.name} ${g.creator_name ?? ""} ${g.description ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, qInput]);

  // 删除确认
  const confirmGroupDelete = useConfirm<number>("Are you sure you want to delete this group?");

  return (
    <>
      <LoadingOverlay show={pageLoading} text="Loading group…" />
      <PageTitle title="My Groups" showPageTitle />
      <div className="mx-auto w-full p-4 min-h-screen lg:container">
        <GroupListView
          // title="My Groups"
          rows={filteredRows}
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
          isUserSubscribed={isUserSubscribed}              // 已订阅列表里恒为 true，但保持一致接口
          onToggleSubscription={toggleSubscription}        // 允许在此页退订
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
