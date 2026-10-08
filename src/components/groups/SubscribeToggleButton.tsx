// components/groups/SubscribeToggle.tsx
"use client";

import React from "react";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import { joinGroup, leaveGroup } from "@/app/features/groups/slice";
import { withdrawJoinRequest } from "@/app/features/groups/joinRequestSlice";
import type { JoinRequestError } from "@/app/features/groups/joinRequestSlice";
import type { JoinPolicy, MyJoinRequest } from "@/app/types/group";
import JoinRequestModal from "./JoinRequestModal";
import Button from "@/components/ui/Button";
import Spinner from "@/components/feedback/Spinner";
import ConfirmModal from "@/components/ConfirmModal";
import {
  BellIcon,
  XMarkIcon,
  UserPlusIcon,
  CheckIcon,
  ClockIcon,
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

  /** 加入方式：request 组的非成员显示 Request to join / Requested；private 组的非成员不显示按钮 */
  joinPolicy?: JoinPolicy;
  myJoinRequest?: MyJoinRequest | null;
  /** 申请弹窗里显示的组名 */
  groupName?: string;
  /** 申请状态和页面上的不一致（例如刚被批准）时通知父级刷新 */
  onStale?: () => void;
  /** 发出 / 撤回申请后通知父级（列表页的数据不在 store 里，要自己更新） */
  onJoinRequestChange?: (request: MyJoinRequest | null) => void;
  /** 放在深色背景上（小组页顶部）：描边按钮加白底，免得看不清 */
  onDark?: boolean;
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
  joinPolicy,
  myJoinRequest,
  groupName,
  onStale,
  onDark = false,
  onJoinRequestChange,
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

  // ===== request 组：申请 / 撤回。撤回时发现申请已经不在了（被处理了），本地先改成没申请，再让父级刷新
  const [showRequestModal, setShowRequestModal] = React.useState(false);
  const [showWithdraw, setShowWithdraw] = React.useState(false);
  const [localPending, setLocalPending] = React.useState<boolean | null>(null);
  React.useEffect(() => setLocalPending(null), [myJoinRequest?.id]);
  const requested = localPending ?? !!myJoinRequest;

  const performWithdraw = async () => {
    setBusy(true);
    try {
      await dispatch(withdrawJoinRequest(groupId)).unwrap();
      onJoinRequestChange?.(null);
    } catch (e: any) {
      const err = e as JoinRequestError;
      if (err?.code === 404) {
        setLocalPending(false);
        onJoinRequestChange?.(null);
        onStale?.();
      }
      alert(err?.message || "Failed to withdraw the request");
    } finally {
      setBusy(false);
      setShowWithdraw(false);
    }
  };

  // 退出 request / private 组：提醒再加入没那么容易
  const leaveMsg =
    joinPolicy === "request"
      ? `${defaults.confirmMsg} To join again, you'll need to send a request and wait for a leader to approve it.`
      : joinPolicy === "private"
      ? `${defaults.confirmMsg} To join again, a leader will need to add you or send you an invite link.`
      : defaults.confirmMsg;

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
    if (isMember) performLeave();
    else performJoin();
  };

  // 默认渲染
  const common = {
    size: size,
    onClick: handleToggle,
    disabled: disabled || busy,
    className,
  } as const;

  if (!isMember && joinPolicy === "private") return null;

  if (!isMember && joinPolicy === "request") {
    return (
      <>
        {requested ? (
          <Button
            size={size}
            className={`${className ?? ""} ${onDark ? "bg-white" : ""}`}
            variant="outline"
            disabled={disabled || busy}
            onClick={() => setShowWithdraw(true)}
            title="Your request is waiting for a leader. Click to withdraw it."
            leftIcon={busy ? <Spinner className="h-4 w-4" /> : <ClockIcon className="h-4 w-4" />}
          >
            {busy ? "Withdrawing…" : "Requested"}
          </Button>
        ) : (
          <Button
            size={size}
            className={className}
            variant={variantWhenUnsubbed}
            disabled={disabled || busy}
            onClick={() => setShowRequestModal(true)}
            leftIcon={<UserPlusIcon className="h-4 w-4" />}
          >
            Request to join
          </Button>
        )}

        {showRequestModal && (
          <JoinRequestModal
            groupId={groupId}
            groupName={groupName ?? "this group"}
            onClose={() => setShowRequestModal(false)}
            onSent={(r) => {
              setLocalPending(true);
              setShowRequestModal(false);
              onJoinRequestChange?.(r);
            }}
          />
        )}

        <ConfirmModal
          isOpen={showWithdraw}
          onConfirm={performWithdraw}
          onCancel={() => setShowWithdraw(false)}
          onClose={() => setShowWithdraw(false)}
          title="Withdraw your request?"
          message="The leaders will no longer see it. You can send a new request later."
          confirmLabel="Withdraw"
          cancelLabel="Cancel"
          confirmVariant="danger"
          cancelVariant="outline"
        />
      </>
    );
  }

  return (
    <>
      {isMember ? (
        <Button
          {...common}
          variant={variantWhenSubbed}
          tone="brand"
          className={`${className ?? ""} ${onDark ? "bg-white" : ""}`}
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
          message={leaveMsg}
          confirmLabel={defaults.confirmBtn}
          cancelLabel="Cancel"
          confirmVariant="danger"
          cancelVariant="outline"
        />
      )}
    </>
  );
}
