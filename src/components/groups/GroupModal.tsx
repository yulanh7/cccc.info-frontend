"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { mockUsers } from '@/app/data/mockData';
import { GroupProps, GroupEditModalProps } from '@/app/types';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from "@/components/ui/Button";
import SaveConfirmModal from "../SaveConfirmModal";

const MAX_NAME = 50;
const MAX_DESC = 500;

export default function GroupEditModal({
  group = {},
  isNew = false,
  onSave,
  onClose,
  saving = false,
  externalErrors = null,
}: GroupEditModalProps) {
  const defaultItem: GroupProps = {
    id: isNew ? Date.now() : (group?.id as number) || 0,
    title: '',
    description: '',
    createdDate: new Date().toISOString().split('T')[0],
    creator: mockUsers[1],
    subscribed: false,
    editable: true,
    isPrivate: false,
  };

  const [editedItem, setEditedItem] = useState<GroupProps>(
    isNew ? defaultItem : { ...(group as GroupProps) }
  );

  // ---- 确认弹窗控制 & 锚点
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [placement, setPlacement] = useState<"above" | "below">("below");

  // ---- 校验 & 聚焦
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const titleLen = editedItem.title?.length ?? 0;
  const descLen = editedItem.description?.length ?? 0;
  const overTitle = Math.max(0, titleLen - MAX_NAME);
  const overDesc = Math.max(0, descLen - MAX_DESC);

  const displayErrors = useMemo(
    () => ({
      title: externalErrors?.title ?? errors.title,
      description: externalErrors?.description ?? errors.description,
    }),
    [externalErrors, errors]
  );

  const handleChange = (field: keyof GroupProps, value: any) => {
    setEditedItem((prev) => ({ ...prev, [field]: value }));
    if (field === "title" && errors.title) setErrors((e) => ({ ...e, title: undefined }));
    if (field === "description" && errors.description) setErrors((e) => ({ ...e, description: undefined }));
  };

  // ---- 校验
  const validate = () => {
    const next: { title?: string; description?: string } = {};
    if (!editedItem.title.trim()) next.title = "Title is required";
    if (!editedItem.description.trim()) next.description = "Description is required";
    if (titleLen > MAX_NAME) next.title = `Group name cannot exceed ${MAX_NAME} characters.`;
    if (descLen > MAX_DESC) next.description = `Group description cannot exceed ${MAX_DESC} characters.`;

    setErrors(next);
    if (next.title && titleRef.current) titleRef.current.focus();
    else if (next.description && descRef.current) descRef.current.focus();
    return Object.keys(next).length === 0;
  };

  // ---- 保存
  const handleSave = async () => {
    if (!validate()) return;
    const cleaned: GroupProps = {
      ...editedItem,
      title: editedItem.title.trim(),
      description: (editedItem.description ?? "").replace(/\r\n/g, "\n"),
    };
    await onSave(cleaned);
    // 保存后更新初始快照，避免马上点关闭又提示
    initialSnapshotRef.current = serialize(cleaned);
  };

  // ------------------------------
  // 变化检测：初始快照 vs 当前状态
  // ------------------------------
  const baseItem = isNew ? defaultItem : (group as GroupProps);

  // 稳定序列化（只挑重要字段，避免不相关属性波动误报）
  const serialize = (it: GroupProps) =>
    JSON.stringify({
      id: it.id ?? 0,
      title: (it.title ?? "").trim(),
      description: (it.description ?? ""),
      isPrivate: !!it.isPrivate,
    });

  const initialSnapshotRef = useRef<string>(serialize(baseItem));
  useEffect(() => {
    // 当传入的 group 变化或 isNew 变化时，重置表单和快照
    setEditedItem(isNew ? defaultItem : { ...(group as GroupProps) });
    initialSnapshotRef.current = serialize(isNew ? defaultItem : (group as GroupProps));
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
    // 不管是否有改动，都弹确认（如果你也想只在有改动时弹，改成 if (hasChanges) ... else onClose();）
    setAnchorEl(cancelButtonRef.current);
    setPlacement("above");
    setIsConfirmOpen(true);
  };

  const confirmSaveAndClose = async () => {
    if (!validate()) return;
    const cleaned: GroupProps = {
      ...editedItem,
      title: editedItem.title.trim(),
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

  // ---- ESC 关闭也走确认
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseClick();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasChanges]); // eslint-disable-line

  const nameId = "group-name";
  const descId = "group-description";

  return (
    <div className="fixed inset-0 min-h-screen bg-gray bg-opacity-50 flex items-center justify-center z-20 overflow-y-auto">
      {/* 点击遮罩：有改动才弹确认 */}
      <div className="absolute inset-0" onClick={handleCloseClick} aria-hidden />
      <div
        className="bg-white p-6 rounded-sm shadow-lg w-full  relative"
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


          {/* Title */}
          <label htmlFor={nameId} className="block text-sm font-medium mb-1">
            Title
          </label>
          <input
            id={nameId}
            ref={titleRef}
            type="text"
            value={editedItem.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className={`w-full p-2 mb-1 border rounded-sm ${displayErrors.title ? "border-red-500" : "border-border"}`}
          />
          <div className={`text-xs mb-1 ${overTitle ? "text-red-600" : "text-dark-gray"}`}>
            {titleLen}/{MAX_NAME}
          </div>
          {displayErrors.title && <p className="text-red-600 text-sm mb-3">{displayErrors.title}</p>}

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
            rows={6}
          />
          <div className={`text-xs mb-1 ${overDesc ? "text-red-600" : "text-dark-gray"}`}>
            {descLen}/{MAX_DESC}
          </div>
          {displayErrors.description && <p className="text-red-600 text-sm mb-3">{displayErrors.description}</p>}

          {/* Invite Only */}
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={editedItem.isPrivate}
                onChange={(e) => handleChange("isPrivate", e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-dark-gray">Invite Only</span>
            </label>
          </div>
        </div>
        {/* Actions */}
        <div className="mt-5 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancelClick}
            ref={cancelButtonRef}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
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
