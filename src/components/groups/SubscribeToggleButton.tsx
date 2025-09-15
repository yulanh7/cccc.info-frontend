// components/groups/SubscribeToggle.tsx
"use client";

import React from "react";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import { joinGroup, leaveGroup } from "@/app/features/groups/slice";
import Button from "@/components/ui/Button";
import Spinner from "@/components/feedback/Spinner";
import ConfirmModal from "@/components/ConfirmModal";
import {
  BellIcon,
  XMarkIcon,
  UserPlusIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

type Mode = "subscribe" | "follow" | "join";

type Props = {
  groupId: number;
  mode?: Mode;
  /** store 未加载时的兜底：临时显示成员态 */
  isMemberHint?: boolean;

  className?: string;
  disabled?: boolean;
  /** 仅当从“成员”切换到“非成员”时弹确认弹窗 */
  confirmOnLeave?: boolean;

  /** 可覆盖文案 */
  labelSubscribe?: string;   // 非成员态按钮文案
  labelUnsubscribe?: string; // 成员态按钮文案

  size?: "sm" | "md";
  variantWhenSubbed?: "outline" | "ghost";
  variantWhenUnsubbed?: "primary" | "warning";
};

export default function SubscribeToggle({
  groupId,
  mode = "follow",
  isMemberHint,
  className,
  disabled = false,
  confirmOnLeave = true,
  labelSubscribe,
  labelUnsubscribe,
  size = "sm",
  variantWhenSubbed = "outline",
  variantWhenUnsubbed = "primary",
}: Props) {
  const dispatch = useAppDispatch();
  // 单一真相来自 store；若尚未加载，用 hint 兜底
  const fromStore = useAppSelector((s) => s.groups.userMembership[groupId]);
  const isMember = typeof fromStore === "boolean" ? fromStore : !!isMemberHint;

  const [busy, setBusy] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  // 模式驱动的默认文案 & 图标
  const defaults = React.useMemo(() => {
    if (mode === "join") {
      return {
        onLabel: "Leave",
        offLabel: "Join group",
        onIcon: <CheckIcon className="h-4 w-4" />,
        offIcon: <UserPlusIcon className="h-4 w-4" />,
        confirmTitle: "Leave this group?",
        confirmMsg: "You will lose member-only access.",
        busyOn: "Leaving…",
        busyOff: "Joining…",
        confirmBtn: "Leave",
      };
    }
    if (mode === "follow") {
      return {
        onLabel: "Following",
        offLabel: "Follow",
        onIcon: <CheckIcon className="h-4 w-4" />,
        offIcon: <UserPlusIcon className="h-4 w-4" />,
        confirmTitle: "Unfollow this group?",
        confirmMsg: "You will stop seeing its updates in your feed.",
        busyOn: "Unfollowing…",
        busyOff: "Following…",
        confirmBtn: "Unfollow",
      };
    }
    // subscribe（默认）
    return {
      onLabel: "Unsubscribe",
      offLabel: "Subscribe",
      onIcon: <XMarkIcon className="h-4 w-4" />,
      offIcon: <BellIcon className="h-4 w-4" />,
      confirmTitle: "Unsubscribe from this group?",
      confirmMsg: "You will stop receiving updates on the Home page.",
      busyOn: "Unsubscribing…",
      busyOff: "Subscribing…",
      confirmBtn: "Unsubscribe",
    };
  }, [mode]);

  const finalOnLabel = labelUnsubscribe ?? defaults.onLabel;
  const finalOffLabel = labelSubscribe ?? defaults.offLabel;

  const performJoin = async () => {
    setBusy(true);
    try {
      await dispatch(joinGroup(groupId)).unwrap();
    } catch (e: any) {
      alert(typeof e === "string" ? e : e?.message || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const performLeave = async () => {
    setBusy(true);
    try {
      await dispatch(leaveGroup(groupId)).unwrap();
    } catch (e: any) {
      alert(typeof e === "string" ? e : e?.message || "Action failed");
    } finally {
      setBusy(false);
      setShowConfirm(false);
    }
  };

  const handleToggle = () => {
    if (disabled || busy) return;
    if (isMember && confirmOnLeave) {
      setShowConfirm(true); // 内嵌弹窗，不需要父级处理
      return;
    }
    isMember ? performLeave() : performJoin();
  };

  // 默认渲染
  const common = {
    size: size,
    onClick: handleToggle,
    disabled: disabled || busy,
    className,
  } as const;

  return (
    <>
      {isMember ? (
        <Button
          {...common}
          variant={variantWhenSubbed}
          aria-pressed
          aria-label={finalOnLabel}
          leftIcon={busy ? <Spinner className="h-4 w-4" /> : defaults.onIcon}
        >
          {busy ? defaults.busyOn : finalOnLabel}
        </Button>
      ) : (
        <Button
          {...common}
          variant={variantWhenUnsubbed}
          aria-pressed={false}
          aria-label={finalOffLabel}
          leftIcon={busy ? <Spinner className="h-4 w-4" /> : defaults.offIcon}
        >
          {busy ? defaults.busyOff : finalOffLabel}
        </Button>
      )}

      {confirmOnLeave && isMember && (
        <ConfirmModal
          isOpen={showConfirm}
          onConfirm={performLeave}
          onCancel={() => setShowConfirm(false)}
          onClose={() => setShowConfirm(false)}
          title={defaults.confirmTitle}
          message={defaults.confirmMsg}
          confirmLabel={defaults.confirmBtn}
          cancelLabel="Cancel"
          confirmVariant="danger"
          cancelVariant="outline"
        />
      )}
    </>
  );
}
