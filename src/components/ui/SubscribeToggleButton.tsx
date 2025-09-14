// components/groups/SubscribeToggle.tsx
"use client";

import React from "react";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import { joinGroup, leaveGroup } from "@/app/features/groups/slice";
import Button from "@/components/ui/Button";
import Spinner from "@/components/feedback/Spinner";
import {
  BellIcon,
  XMarkIcon,
  UserPlusIcon,
  CheckIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

/**
 * 三种语义模式：
 * - "join"：加入/退出群组（影响成员权限）。推荐用于需要成员资格的页面。
 * - "follow"：关注/取消关注（仅信息流，不改变权限）。如果你的后端也是 join/leave，可先复用。
 * - "subscribe"：订阅/取消订阅（强调通知语义）。默认模式。
 */
type Mode = "subscribe" | "follow" | "join";

type Props = {
  groupId: number;
  mode?: Mode;

  /** 首屏兜底：在 store 尚未有该 groupId 的 membership 时临时显示 */
  isMemberHint?: boolean;

  className?: string;
  confirmOnLeave?: boolean;
  disabled?: boolean;

  /** 可覆盖的文案与样式 */
  labelSubscribe?: string;
  labelUnsubscribe?: string;
  size?: "sm" | "md" | "lg";
  variantWhenSubbed?: "outline" | "ghost";
  variantWhenUnsubbed?: "primary" | "warning";

  /** 高级：完全自定义渲染（受控于内部状态） */
  render?: (opts: {
    isMember: boolean;
    busy: boolean;
    toggle: () => void;
    disabled: boolean;
  }) => React.ReactNode;
};

export default function SubscribeToggle({
  groupId,
  mode = "subscribe",
  isMemberHint,
  className,
  confirmOnLeave = false,
  disabled = false,

  labelSubscribe,
  labelUnsubscribe,
  size = "sm",
  variantWhenSubbed = "outline",
  variantWhenUnsubbed = "primary",

  render,
}: Props) {
  const dispatch = useAppDispatch();

  // 单一真相来自 store（Record<number, boolean>）；若还没加载到，用 hint 兜底一次
  const fromStore = useAppSelector((s) => s.groups.userMembership[groupId]);
  const isMember = typeof fromStore === "boolean" ? fromStore : !!isMemberHint;

  const [busy, setBusy] = React.useState(false);

  // 不同模式的默认文案与图标（可被 props 覆盖）
  const defaults = React.useMemo(() => {
    if (mode === "join") {
      return {
        onLabel: "Leave",
        offLabel: "Join group",
        onIcon: <CheckIcon className="h-4 w-4" />,
        offIcon: <UserPlusIcon className="h-4 w-4" />,
        confirmText: "Leave this group?",
        busyOn: "Leaving…",
        busyOff: "Joining…",
      };
    }
    if (mode === "follow") {
      return {
        onLabel: "Following",
        offLabel: "Follow",
        onIcon: <CheckIcon className="h-4 w-4" />,
        offIcon: <UserPlusIcon className="h-4 w-4" />,
        confirmText: "Unfollow this group?",
        busyOn: "Unfollowing…",
        busyOff: "Following…",
      };
    }
    // subscribe（默认）
    return {
      onLabel: "Unsubscribe",
      offLabel: "Subscribe",
      onIcon: <XMarkIcon className="h-4 w-4" />,
      offIcon: <BellIcon className="h-4 w-4" />,
      confirmText: "Unsubscribe from this group?",
      busyOn: "Unsubscribing…",
      busyOff: "Subscribing…",
    };
  }, [mode]);

  const finalOnLabel = labelUnsubscribe ?? defaults.onLabel;
  const finalOffLabel = labelSubscribe ?? defaults.offLabel;

  const toggle = async () => {
    if (disabled || busy) return;

    if (isMember && confirmOnLeave) {
      const ok = window.confirm(defaults.confirmText);
      if (!ok) return;
    }

    setBusy(true);
    try {
      if (isMember) {
        await dispatch(leaveGroup(groupId)).unwrap();
      } else {
        await dispatch(joinGroup(groupId)).unwrap();
      }
      // 成功后 UI 会随 groups.userMembership[groupId] 的变化自动刷新
    } catch (e: any) {
      alert(typeof e === "string" ? e : e?.message || "Toggle failed");
    } finally {
      setBusy(false);
    }
  };

  // 自定义渲染出口
  if (render) {
    return <>{render({ isMember, busy, toggle, disabled })}</>;
  }

  // 默认渲染
  const common = {
    size: "sm",
    onClick: toggle,
    disabled: disabled || busy,
    className,
  } as const;

  if (!isMember) {
    return (
      <Button
        {...common}
        variant={variantWhenUnsubbed}
        aria-pressed={false}
        aria-label={finalOffLabel}
        leftIcon={busy ? <Spinner className="h-4 w-4" /> : defaults.offIcon}
      >
        {busy ? defaults.busyOff : finalOffLabel}
      </Button>
    );
  }

  return (
    <Button
      {...common}
      variant={variantWhenSubbed}
      aria-pressed={true}
      aria-label={finalOnLabel}
      leftIcon={busy ? <Spinner className="h-4 w-4" /> : defaults.onIcon}
    >
      {busy ? defaults.busyOn : finalOnLabel}
    </Button>
  );
}
