// components/SubscribeToggleButton.tsx
"use client";

import React from "react";
import Button from "@/components/ui/Button";
import Spinner from "@/components/feedback/Spinner";
import { CheckCircleIcon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";

type Props = {
  subbed: boolean;
  toggling: boolean;
  disabled?: boolean;
  onClick: () => void;         // 外面仍然用 onToggleSubscription(g)
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

  // 已订阅：次行动（绿）+ hover 显示“Unsubscribe”危险提示
  return (
    <div className="group">
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || toggling}
        aria-pressed={true}
        aria-label="Unsubscribe"
        // hover 提示变“取消订阅”的危险态（轻量，不突兀）
        className="
          transition-colors
          group-hover:bg-red-50 group-hover:text-red group-hover:border-red/50
        "
        leftIcon={
          toggling ? (
            <Spinner className="h-4 w-4" />
          ) : (
            // hover 时图标也切换
            <>
              <CheckCircleIcon className="h-4 w-4 group-hover:hidden" />
              <XMarkIcon className="h-4 w-4 hidden group-hover:block" />
            </>
          )
        }
        onClick={onClick}
      >
        {/* 文案跟随 hover 切换 */}
        <span className="group-hover:hidden">{toggling ? "…" : "Subscribed"}</span>
        <span className="hidden group-hover:inline">{toggling ? "…" : "Unsubscribe"}</span>
      </Button>
    </div>
  );
}
