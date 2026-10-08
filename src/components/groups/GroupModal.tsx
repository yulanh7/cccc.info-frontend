"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { mockUsers } from '@/app/data/mockData';
import type { GroupApi, PostPolicy, CommentPolicy, JoinPolicy } from '@/app/types/group';
import {
  DEFAULT_POST_POLICY, DEFAULT_COMMENT_POLICY, COMMENT_POLICY_LABELS,
  DEFAULT_JOIN_POLICY, JOIN_POLICY_OPTIONS, joinPolicyOf,
} from '@/app/types/group';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from "@/components/ui/Button";
import SaveConfirmModal from "../SaveConfirmModal";
import GroupInviteSection from "./GroupInviteSection";

const MIN_NAME = 2;
const MAX_NAME = 50;
const MAX_DESC = 500;

type GroupEditModalProps = {
  group?: GroupApi | any;
  isNew?: boolean;
  onSave: (updatedGroup: GroupApi) => void | Promise<void>;
  onClose: () => void;
  saving?: boolean;
  externalErrors?: { name?: string; description?: string } | null;
};

export default function GroupEditModal({
  group = {},
  isNew = false,
  onSave,
  onClose,
  saving = false,
  externalErrors = null,
}: GroupEditModalProps) {
  const defaultItem: GroupApi = {
    id: isNew ? Date.now() : (group?.id as number) || 0,
    name: '',
    description: '',
    time: new Date().toISOString(),
    creator: (mockUsers[1]?.id as number) ?? 0,
    creator_name: mockUsers[1]?.firstName ?? '',
    subscriber_count: 0,
    is_member: false,
    is_creator: true,
    isPrivate: false,
    join_policy: DEFAULT_JOIN_POLICY,
    post_policy: DEFAULT_POST_POLICY,
    comment_policy: DEFAULT_COMMENT_POLICY,
  };
  const postPolicyOptions: Array<{ value: PostPolicy; label: string }> = [
    { value: "members", label: "All members can post" },
    { value: "leaders_only", label: "Only group leaders can post, edit and delete posts" },
  ];
  const commentPolicyOptions = (Object.keys(COMMENT_POLICY_LABELS) as CommentPolicy[]).map((value) => ({
    value,
    label: COMMENT_POLICY_LABELS[value],
  }));

  // 旧响应可能没有 join_policy：按 isPrivate 补上，表单只用 join_policy
  const withJoinPolicy = (g: GroupApi): GroupApi => ({ ...g, join_policy: joinPolicyOf(g) });
  const [editedItem, setEditedItem] = useState<GroupApi>(
    isNew ? defaultItem : withJoinPolicy(group as GroupApi)
  );

  // ---- 确认弹窗控制 & 锚点
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [placement, setPlacement] = useState<"above" | "below">("below");

  // ---- 校验 & 聚焦
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const nameTrimmed = (editedItem.name ?? "").trim();
  const nameLen = nameTrimmed.length;
  const descLen = (editedItem.description ?? "").length;

  const overNameMax = Math.max(0, nameLen - MAX_NAME);
  const underNameMin = Math.max(0, MIN_NAME - nameLen);
  const overDesc = Math.max(0, descLen - MAX_DESC);

  const displayErrors = useMemo(
    () => ({
      name: externalErrors?.name ?? errors.name,
      description: externalErrors?.description ?? errors.description,
    }),
    [externalErrors, errors]
  );

  const handleChange = (field: keyof GroupApi, value: any) => {
    setEditedItem((prev) => ({ ...prev, [field]: value }));
    if (field === "name" && errors.name) setErrors((e) => ({ ...e, name: undefined }));
    if (field === "description" && errors.description) setErrors((e) => ({ ...e, description: undefined }));
  };

  // ---- 校验
  const validate = () => {
    const next: { name?: string; description?: string } = {};

    if (!nameTrimmed) {
      next.name = "Name is required";
    } else if (nameLen < MIN_NAME) {
      next.name = `Group name must be at least ${MIN_NAME} characters`;
    } else if (nameLen > MAX_NAME) {
      next.name = `Group name cannot exceed ${MAX_NAME} characters.`;
    }

    if (!editedItem.description?.trim()) {
      next.description = "Description is required";
    } else if (descLen > MAX_DESC) {
      next.description = `Group description cannot exceed ${MAX_DESC} characters.`;
    }

    setErrors(next);
    if (next.name && nameRef.current) nameRef.current.focus();
    else if (next.description && descRef.current) descRef.current.focus();
    return Object.keys(next).length === 0;
  };

  // ---- 保存
  const handleSave = async () => {
    if (!validate()) return;
    const cleaned: GroupApi = {
      ...editedItem,
      name: nameTrimmed.replace(/\s+/g, " "),
      description: (editedItem.description ?? "").replace(/\r\n/g, "\n"),
    };
    await onSave(cleaned);
    // 保存后更新初始快照，避免马上点关闭又提示
    initialSnapshotRef.current = serialize(cleaned);
  };

  // ------------------------------
  // 变化检测：初始快照 vs 当前状态
  // ------------------------------
  const baseItem = isNew ? defaultItem : (group as GroupApi);

  // 稳定序列化（只挑重要字段，避免不相关属性波动误报）
  const serialize = (it: GroupApi) =>
    JSON.stringify({
      id: it.id ?? 0,
      name: (it.name ?? "").trim(),
      description: (it.description ?? ""),
      join_policy: joinPolicyOf(it),
      post_policy: it.post_policy ?? null,
      comment_policy: it.comment_policy ?? null,
    });

  const initialSnapshotRef = useRef<string>(serialize(baseItem));
  useEffect(() => {
    // 当传入的 group 变化或 isNew 变化时，重置表单和快照
    setEditedItem(isNew ? defaultItem : withJoinPolicy(group as GroupApi));
    initialSnapshotRef.current = serialize(isNew ? defaultItem : (group as GroupApi));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, group?.id]);

  const hasChanges = useMemo(() => {
    try {
      return serialize(editedItem) !== initialSnapshotRef.current;
    } catch {
      return true;
    }
  }, [editedItem]);

  // ---- 关闭入口
  const handleCloseClick = () => {
    if (hasChanges) {
      setAnchorEl(closeButtonRef.current);
      setPlacement("below");
      setIsConfirmOpen(true);
    } else {
      onClose();
    }
  };

  const handleCancelClick = () => {
    setAnchorEl(cancelButtonRef.current);
    setPlacement("above");
    setIsConfirmOpen(true);
  };

  const confirmSaveAndClose = async () => {
    if (!validate()) return;
    const cleaned: GroupApi = {
      ...editedItem,
      name: nameTrimmed.replace(/\s+/g, " "),
      description: (editedItem.description ?? "").replace(/\r\n/g, "\n"),
    };
    await onSave(cleaned);
    initialSnapshotRef.current = serialize(cleaned);
    setIsConfirmOpen(false);
    onClose();
  };

  const confirmCloseWithoutSaving = () => {
    setIsConfirmOpen(false);
    onClose();
  };

  const confirmCancel = () => setIsConfirmOpen(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseClick();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasChanges]); // eslint-disable-line

  const nameId = "group-name";
  const descId = "group-description";

  // 已保存的加入方式，和待处理申请数（只有管理者的响应里有）
  const savedJoinPolicy: JoinPolicy = isNew ? DEFAULT_JOIN_POLICY : joinPolicyOf(group as GroupApi);
  const pendingCount: number = isNew ? 0 : (group?.pending_request_count ?? 0);
  const pendingWarning = (() => {
    if (pendingCount <= 0 || editedItem.join_policy === savedJoinPolicy) return null;
    const n = `${pendingCount} pending join request${pendingCount === 1 ? "" : "s"}`;
    if (editedItem.join_policy === "open") return `${n} will be approved automatically when you save.`;
    if (editedItem.join_policy === "private") return `${n} will be cancelled when you save. The people who asked will be told their request was not approved.`;
    return null;
  })();

  const isNameInvalid = Boolean(
    displayErrors.name ||
    nameLen < MIN_NAME ||
    nameLen > MAX_NAME
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-gray bg-opacity-50 flex items-center justify-center "
      role="dialog"
    >
      <div className="absolute inset-0" onClick={handleCloseClick} aria-hidden />
      <div
        className="bg-white w-[95vw] md:max-w-3xl rounded-md shadow-lg relative flex flex-col max-h-[min(95vh,800px)] p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          onClick={handleCloseClick}
          className="absolute top-6 right-4 text-dark-gray hover:text-dark-green focus:outline-none"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-xl mb-4">{isNew ? "Add New Group" : "Edit Group"}</h2>

        <div className="md:max-w-[80vw] max-h-[90vh] overflow-y-auto">
          {/* Name */}
          <label htmlFor={nameId} className="block text-sm font-medium mb-1">
            Name
          </label>
          <input
            id={nameId}
            ref={nameRef}
            type="text"
            value={editedItem.name}
            onChange={(e) => handleChange("name", e.target.value)}
            aria-invalid={isNameInvalid}
            aria-describedby={`${nameId}-help`}
            className={`w-full p-2 mb-1 border rounded-sm ${isNameInvalid ? "border-red-500" : "border-border"}`}
          />
          <div id={`${nameId}-help`} className={`text-xs mb-1 ${isNameInvalid ? "text-red-600" : "text-dark-gray"}`}>
            {nameLen}/{MAX_NAME} {`(min ${MIN_NAME})`}
          </div>
          {displayErrors.name && <p className="text-red-600 text-sm mb-3">{displayErrors.name}</p>}

          {/* Who can join */}
          <fieldset className="mb-4">
            <legend className="block text-sm font-medium mb-1">Who can join</legend>
            {JOIN_POLICY_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-start mb-1">
                <input
                  type="radio"
                  name="group-join-policy"
                  value={opt.value}
                  checked={editedItem.join_policy === opt.value}
                  onChange={() => handleChange("join_policy", opt.value)}
                  className="mr-2 mt-1"
                />
                <span className="text-sm text-dark-gray">
                  {opt.label}
                  <span className="block text-xs text-dark-gray/70">{opt.hint}</span>
                </span>
              </label>
            ))}

            {/* 有待处理的申请时，改成 open / private 前先说清楚会发生什么 */}
            {pendingWarning && (
              <div
                role="note"
                aria-live="polite"
                className="mt-2 flex items-start gap-1 rounded-sm border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
              >
                <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
                <p>{pendingWarning}</p>
              </div>
            )}

            {/* 邀请链接：编辑时、request / private 组才有；响应里有 invite_enabled（= 能管理）才显示 */}
            {!isNew && editedItem.join_policy !== "open" && typeof group?.invite_enabled === "boolean" && (
              savedJoinPolicy !== "open" ? (
                <GroupInviteSection
                  groupId={group.id}
                  initial={{ invite_enabled: group.invite_enabled, invite_code: group.invite_code ?? null }}
                />
              ) : (
                <p className="mt-2 text-xs text-dark-gray/70">Save first, then you can turn on an invite link here.</p>
              )
            )}
          </fieldset>

          {/* Post permission */}
          <fieldset className="mb-4">
            <legend className="block text-sm font-medium mb-1">Who can post</legend>
            {postPolicyOptions.map((opt) => (
              <label key={opt.value} className="flex items-center mb-1">
                <input
                  type="radio"
                  name="group-post-policy"
                  value={opt.value}
                  checked={editedItem.post_policy === opt.value}
                  onChange={() => handleChange("post_policy", opt.value)}
                  className="mr-2"
                />
                <span className="text-sm text-dark-gray">{opt.label}</span>
              </label>
            ))}
          </fieldset>

          {/* Comment permission：帖子可单独覆盖，这里是小组默认值 */}
          <fieldset className="mb-4">
            <legend className="block text-sm font-medium mb-1">Who can comment</legend>
            {commentPolicyOptions.map((opt) => (
              <label key={opt.value} className="flex items-center mb-1">
                <input
                  type="radio"
                  name="group-comment-policy"
                  value={opt.value}
                  checked={editedItem.comment_policy === opt.value}
                  onChange={() => handleChange("comment_policy", opt.value)}
                  className="mr-2"
                />
                <span className="text-sm text-dark-gray">{opt.label}</span>
              </label>
            ))}
          </fieldset>

          {/* Description */}
          <label htmlFor={descId} className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            id={descId}
            ref={descRef}
            value={editedItem.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className={`w-full p-2 mb-1 border rounded-sm ${displayErrors.description ? "border-red-500" : "border-border"}`}
            rows={5}
          />
          <div className={`text-xs mb-1 ${overDesc ? "text-red-600" : "text-dark-gray"}`}>
            {descLen}/{MAX_DESC}
          </div>
          {displayErrors.description && <p className="text-red-600 text-sm mb-3">{displayErrors.description}</p>}

        </div>

        {/* Actions */}
        <div className="mt-5 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelClick}
            ref={cancelButtonRef}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={
              saving ||
              nameLen < MIN_NAME ||
              nameLen > MAX_NAME ||
              !nameTrimmed ||
              !editedItem.description?.trim() ||
              descLen > MAX_DESC
            }
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>

        {/* 确认弹窗：使用锚点 + 方位 */}
        <SaveConfirmModal
          onConfirm={confirmSaveAndClose}
          onCancel={confirmCloseWithoutSaving}
          onOutsideClick={confirmCancel}
          isOpen={isConfirmOpen}
          anchorEl={anchorEl}
          placement={placement}
          align="end"
          offset={8}
        />
      </div>
    </div>
  );
}
