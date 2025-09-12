// components/SubscribeToggleButton.tsx
"use client";

import React from "react";
import Button from "@/components/ui/Button";
import Spinner from "@/components/feedback/Spinner";
import { BellIcon, XMarkIcon } from "@heroicons/react/24/outline"; // ⬅️ 移除 CheckCircleIcon

type Props = {
  subbed: boolean;
  toggling: boolean;
  disabled?: boolean;
  onClick: () => void; // 外面仍然用 onToggleSubscription(g)
};

export default function SubscribeToggleButton({
  subbed,
  toggling,
  disabled,
  onClick,
}: Props) {
  if (!subbed) {
    // 未订阅：主行动（黄）
    return (
      <Button
        variant="primary"
        size="sm"
        disabled={disabled || toggling}
        aria-pressed={false}
        aria-label="Subscribe"
        leftIcon={
          toggling ? <Spinner className="h-4 w-4" /> : <BellIcon className="h-4 w-4" />
        }
        onClick={onClick}
      >
        {toggling ? "Subscribing…" : "Subscribe"}
      </Button>
    );
  }

  // 已订阅：直接显示 Unsubscribe（移动端/桌面一致）
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled || toggling}
      aria-pressed={true}
      aria-label="Unsubscribe"
      leftIcon={
        toggling ? <Spinner className="h-4 w-4" /> : <XMarkIcon className="h-4 w-4" />
      }
      onClick={onClick}
    >
      {toggling ? "Unsubscribing…" : "Unsubscribe"}
    </Button>
  );
}
