"use client";
import React, { useEffect, useMemo, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";
import PageTitle from "@/components/layout/PageTitle";
import GroupModal from "@/components/groups/GroupModal";
import ConfirmModal from "@/components/ConfirmModal";
import LoadingOverlay from "@/components/feedback/LoadingOverLay";
import MobileSearchHeader from "@/components/layout/MobileSearchHeader";
import SearchBar from "@/components/SearchBar";
import GroupsDesktopTable from "@/components/groups/GroupsDesktopTable";
import GroupsMobileList from "@/components/groups/GroupsMobileList";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import {
  createGroup,
  fetchAvailableGroups,
  updateGroup,
  deleteGroup,
  searchGroups,
  setSearchQuery,
  clearSearch,
  joinGroup,
  leaveGroup,
} from "@/app/features/groups/slice";
import type { GroupApi } from "@/app/types";
import type { CreateOrUpdateGroupBody } from "@/app/types/group";
import { formatDate, mapApiErrorToFields } from "@/app/ultility";
import { useConfirm } from "@/hooks/useConfirm";
import Button from "@/components/ui/Button";
import { canEditGroup } from "@/app/types/group";

const PER_PAGE = 9;

export default function GroupsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirmGroupDelete = useConfirm<number>("Are you sure you want to delete this group?");

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
  const [selectedGroup, setSelectedGroup] = useState<GroupApi | undefined>(undefined);
  const [qInput, setQInput] = useState("");
  const [modalSaving, setModalSaving] = useState(false);
  const [modalErrors, setModalErrors] = useState<{ title?: string; description?: string } | null>(null);

  const canCreate = !!user?.admin;


  // Loading states
  const [listLoading, setListLoading] = useState(true); // 首次或换页/搜索时的整页加载
  const [saving, setSaving] = useState(false); // 新建/编辑
  const [deleting, setDeleting] = useState(false); // 删除
  const [toggling, setToggling] = useState(false); // 订阅/退订

  // ===== 解析 URL 参数
  const currentPage = useMemo(() => {
    const p = parseInt(searchParams.get("page") || "1", 10);
    return Number.isFinite(p) && p > 0 ? p : 1;
  }, [searchParams]);
  const q = (searchParams.get("q") || "").trim();

  // ===== 拉取数据（当 q 或 page 变化）
  useEffect(() => {
    (async () => {
      setListLoading(true);
      if (q) {
        dispatch(setSearchQuery(q));
        await dispatch(searchGroups({ q, page: currentPage, per_page: PER_PAGE }));
      } else {
        dispatch(clearSearch());
        await dispatch(fetchAvailableGroups({ page: currentPage, per_page: PER_PAGE }));
      }
      setListLoading(false);
    })();
  }, [dispatch, q, currentPage]);

  // 输入框双向
  useEffect(() => setQInput(searchQuery), [searchQuery]);

  // 派生要渲染的数据
  const rows: GroupApi[] = searchQuery ? searchResults : availableGroups;

  const totalPages = useMemo(() => {
    if (typeof (pagination as any)?.pages === "number") {
      return Math.max(1, (pagination as any).pages as number);
    }
    const total = Number(pagination?.total ?? 0);
    const per = Number(pagination?.per_page ?? PER_PAGE);
    return Math.max(1, Math.ceil(total / Math.max(1, per)));
  }, [pagination]);

  // ===== URL builder（用于分页导航）
  const buildHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    return `/groups${params.toString() ? `?${params.toString()}` : ""}`;
  };

  // ===== 仅数据刷新（不显示整页 loading）
  const refreshPage = async (page: number) => {
    if (searchQuery) {
      await dispatch(searchGroups({ q: searchQuery, page, per_page: PER_PAGE }));
    } else {
      await dispatch(fetchAvailableGroups({ page, per_page: PER_PAGE }));
    }
  };

  // ===== Handlers
  const handleAdd = () => {
    if (!canCreate) {
      alert("Only admins can create groups.");
      return;
    }
    setSelectedGroup(undefined);
    setIsNew(true);
    setSelectedGroup(undefined);
    setIsNew(true);
    setModalErrors(null);
    setIsModalOpen(true);
  };

  const handleEdit = (group: GroupApi) => {
    setSelectedGroup(group);
    setIsNew(false);
    setModalErrors(null);
    setIsModalOpen(true);
  };


  const handleSave = async (updatedGroup: GroupApi) => {
    setModalErrors(null);
    setModalSaving(true);

    const body: CreateOrUpdateGroupBody = {
      name: updatedGroup.name.trim(),
      description: updatedGroup.description,
      isPrivate: !!updatedGroup.isPrivate,
    };

    if (isNew) {
      const action = await dispatch(createGroup(body));
      setModalSaving(false);

      if (createGroup.fulfilled.match(action)) {
        // 成功后再关闭
        if (searchQuery) {
          dispatch(clearSearch());
          router.push("/groups?page=1");
        } else if (currentPage !== 1) {
          router.push(buildHref(1));
        } else {
          await refreshPage(1);
        }
        setIsModalOpen(false);
      } else {
        // 失败：展示到表单字段
        const msg = (action.payload as string) ?? "Create group failed";
        const fieldErrors = mapApiErrorToFields(msg);
        if (fieldErrors.title || fieldErrors.description) {
          setModalErrors(fieldErrors);
        } else {
          // 不是长度类错误，才用 alert
          alert(msg);
        }
      }
    } else {
      const action = await dispatch(updateGroup({ groupId: updatedGroup.id, body }));
      setModalSaving(false);

      if (updateGroup.fulfilled.match(action)) {
        await refreshPage(currentPage);
        // 成功后再关闭
        setIsModalOpen(false);
      } else {
        const msg = (action.payload as string) ?? "Update group failed";
        const fieldErrors = mapApiErrorToFields(msg);
        if (fieldErrors.title || fieldErrors.description) {
          setModalErrors(fieldErrors);
        } else {
          alert(msg);
        }
      }
    }
  };


  const handleDeleteClick = (id: number) => {
    confirmGroupDelete.ask(id);
  };

  const isUserSubscribed = (g: GroupApi) => g.is_member === true;

  const onSubmitSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const q = qInput.trim();
    if (q) params.set("q", q);
    // 搜索默认回到 page=1
    router.push(`/groups${params.toString() ? `?${params}` : ""}`);
  };

  const onClearSearch = () => {
    setQInput("");
    dispatch(clearSearch());
    router.push("/groups");
  };

  const handleToggleSubscription = async (group: GroupApi) => {
    setToggling(true);
    const action = group.is_member ? await dispatch(leaveGroup(group.id)) : await dispatch(joinGroup(group.id));
    setToggling(false);

    if (leaveGroup.rejected.match(action) || joinGroup.rejected.match(action)) {
      alert(
        (action.payload as string) ||
        (group.is_member ? "Leave group failed" : "Join group failed")
      );
      return;
    }
    // 静默刷新
    void refreshPage(currentPage);
  };

  const overlayText =
    saving ? "Saving…" :
      deleting ? "Deleting…" :
        toggling ? "Updating membership…" :
          undefined;

  const pageLoading = listLoading && rows.length === 0;

  return (
    <>
      <PageTitle title="Groups" showPageTitle />

      {/* Mobile 顶部搜索 */}
      <MobileSearchHeader
        value={qInput}
        onChange={setQInput}
        onSubmit={onSubmitSearch}
        onClear={onClearSearch}
        placeholder="Search groups…"
      />

      {/* ✅ 移动端悬浮新增（IconButton，黄底圆形） */}
      {canCreate && (
        <button
          onClick={handleAdd}
          className="fixed md:hidden bottom-20 z-10 right-10 bg-yellow p-2  rounded-[50%]"
        >
          <PlusIcon className="h-5 w-5 text-white" />
        </button>
      )}


      <div className="mx-auto w-full p-4 min-h-screen lg:container">
        <div className="hidden md:flex justify-between my-6">
          {canCreate && (
            <Button
              onClick={handleAdd}
              className="mr-4"
              variant="secondary"
              size="sm"
              leftIcon={<PlusIcon className="h-5 w-5" />}
            >
              New Group
            </Button>
          )}
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
        </div>

        {/* 桌面表格 */}
        <GroupsDesktopTable
          rows={rows}
          listLoading={listLoading}
          canEdit={canEditGroup}
          isUserSubscribed={isUserSubscribed}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onToggleSubscription={handleToggleSubscription}
          currentPage={currentPage}
          totalPages={totalPages}
          buildHref={buildHref}
          saving={saving}
          deleting={deleting}
          toggling={toggling}
          formatDate={formatDate}
        />

        {/* 移动卡片列表 */}
        <GroupsMobileList
          rows={rows}
          listLoading={listLoading}
          canEdit={canEditGroup}
          isUserSubscribed={isUserSubscribed}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onToggleSubscription={handleToggleSubscription}
          saving={saving}
          deleting={deleting}
          toggling={toggling}
          currentPage={currentPage}
          totalPages={totalPages}
          buildHref={buildHref}
          formatDate={formatDate}
        />
      </div>

      {/* 整页 Overlay：仅在首次/切页加载时出现 */}
      <LoadingOverlay show={pageLoading} text="Loading groups…" />

      {/* 通用二次操作时的轻 Overlay（保持，不挡住页面滚动） */}
      <LoadingOverlay show={Boolean(saving || deleting || toggling)} text={overlayText} />

      {/* 新建/编辑弹窗 */}
      {isModalOpen && (
        <GroupModal
          group={selectedGroup}
          isNew={isNew}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
          saving={modalSaving}
          externalErrors={modalErrors}
        />
      )}

      {/* 删除确认（用 useConfirm 驱动） */}
      <ConfirmModal
        isOpen={confirmGroupDelete.open}
        message={confirmGroupDelete.message}
        onCancel={confirmGroupDelete.cancel}
        onConfirm={confirmGroupDelete.confirm(async (id) => {
          if (id == null) return;

          // 预计算删除后的目标页（若当前页被删空，则回上一页）
          const prevTotal = Number(pagination?.total ?? 0);
          const newTotal = Math.max(0, prevTotal - 1);
          const newLastPage = Math.max(1, Math.ceil(newTotal / PER_PAGE));
          const targetPage = Math.min(currentPage, newLastPage);

          setDeleting(true);
          const action = await dispatch(deleteGroup(id));
          setDeleting(false);

          if (deleteGroup.fulfilled.match(action)) {
            if (targetPage !== currentPage) {
              router.push(buildHref(targetPage)); // 切页 -> 会触发整页加载
            } else {
              await refreshPage(currentPage); // 同页 -> 静默刷新
            }
          } else {
            alert((action.payload as string) || "Delete group failed");
          }
        })}
      />
    </>
  );
}
