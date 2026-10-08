"use client";

import React, { useState } from "react";
import { useAppDispatch } from "@/app/features/hooks";
import { setUserActive } from "@/app/features/admin/usersSlice";
import type { UserProps } from "@/app/types/user";
import Button from "@/components/ui/Button";
import LibraryModal from "@/components/library/LibraryModal";
import { errorMessage } from "@/app/lib/errors";

/**
 * 恢复一个停用期间还保留小组成员关系的用户：列出这些小组，默认全部勾上（回去当普通成员）。
 * 取消勾选了任何小组时，确认前再问一次他会退出哪些组。组长身份一律不恢复。
 */
export default function ReactivateUserModal({
  user,
  onClose,
  onDone,
}: {
  user: UserProps;
  onClose: () => void;
  onDone: (updated: UserProps, leftGroups: string[]) => void;
}) {
  const dispatch = useAppDispatch();
  const groups = user.member_groups ?? [];
  const [keep, setKeep] = useState<Set<number>>(() => new Set(groups.map((g) => g.id)));
  const [confirmLeaving, setConfirmLeaving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const leaving = groups.filter((g) => !keep.has(g.id));

  const toggle = (id: number) =>
    setKeep((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await dispatch(
        setUserActive({ userId: user.id, active: true, keep_groups: groups.filter((g) => keep.has(g.id)).map((g) => g.id) })
      ).unwrap();
      onDone(updated, leaving.map((g) => g.name));
    } catch (e) {
      setError(errorMessage(e, "Reactivate failed"));
      setConfirmLeaving(false);
    } finally {
      setSaving(false);
    }
  };

  // 有取消勾选的小组：先再确认一次
  const onReactivate = () => (leaving.length > 0 && !confirmLeaving ? setConfirmLeaving(true) : submit());

  return (
    <LibraryModal
      title="Reactivate account"
      onClose={onClose}
      footer={
        <>
          <Button
            variant="outline"
            onClick={confirmLeaving ? () => setConfirmLeaving(false) : onClose}
            disabled={saving}
          >
            {confirmLeaving ? "Back" : "Cancel"}
          </Button>
          <Button variant="primary" onClick={onReactivate} loading={saving} loadingText="Reactivating…">
            {confirmLeaving ? "Continue" : "Reactivate"}
          </Button>
        </>
      }
    >
      {confirmLeaving ? (
        <p className="text-sm text-dark-gray" role="alert">
          {user.firstName} will leave {leaving.length} group{leaving.length === 1 ? "" : "s"}:{" "}
          <strong className="break-words">{leaving.map((g) => g.name).join(", ")}</strong>. Continue?
        </p>
      ) : (
        <>
          <p className="text-sm text-dark-gray">
            Reactivate <strong>{user.firstName}</strong>&apos;s account? They will be able to log in again.
          </p>
          <p className="mt-3 text-sm font-medium text-dark-gray">Keep them in these groups:</p>
          <ul className="mt-1 space-y-1">
            {groups.map((g) => (
              <li key={g.id}>
                <label className="flex items-start gap-2 text-sm text-dark-gray cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={keep.has(g.id)}
                    disabled={saving}
                    onChange={() => toggle(g.id)}
                  />
                  <span className="break-words">{g.name}</span>
                </label>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-dark-gray/70">
            They rejoin as a regular member. Leader roles are not restored. Unticked groups are left.
          </p>
        </>
      )}

      {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
    </LibraryModal>
  );
}
