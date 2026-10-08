"use client";

import React from "react";
import { LockClosedIcon, LockOpenIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import type { JoinPolicy } from "@/app/types/group";

const BADGES: Record<JoinPolicy, { label: string; title: string; Icon: typeof LockOpenIcon; iconClass: string }> = {
  open: { label: "Open", title: "Anyone can find and join", Icon: LockOpenIcon, iconClass: "text-dark-green" },
  request: { label: "By request", title: "Anyone can find it; leaders approve requests", Icon: UserPlusIcon, iconClass: "text-yellow" },
  private: { label: "Private", title: "Hidden; invite or invite link only", Icon: LockClosedIcon, iconClass: "text-red" },
};

/** 小组的加入方式标签（列表卡片 / 小组页顶部） */
export default function JoinPolicyBadge({ policy, onDark = false }: { policy: JoinPolicy; onDark?: boolean }) {
  const { label, title, Icon, iconClass } = BADGES[policy];
  return (
    <span className={`inline-flex items-center gap-1 ${onDark ? "text-white" : "text-dark-gray/80"}`} title={title}>
      <Icon className={`h-4 w-4 ${onDark && policy === "open" ? "text-green" : iconClass}`} />
      <span className="text-[11px]">{label}</span>
    </span>
  );
}
