"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellIcon as BellOutline } from "@heroicons/react/24/outline";
import { BellIcon as BellSolid } from "@heroicons/react/24/solid";
import { useAppSelector } from "@/app/features/hooks";
import { badgeText } from "@/app/types/notification";

/** 通知铃铛 + 未读角标；variant=top 用在桌面顶部导航，bottom 用在手机底部导航（带文字） */
export default function NotificationBell({ variant }: { variant: "top" | "bottom" }) {
  const pathname = usePathname();
  const unread = useAppSelector((s) => s.notifications.unread);
  const active = pathname === "/notifications";
  const badge = badgeText(unread);
  const Icon = active ? BellSolid : BellOutline;
  const label = unread > 0 ? `Notifications, ${unread} unread` : "Notifications";

  const dot = badge && (
    <span className="absolute -top-1.5 left-1/2 ml-1 min-w-[18px] rounded-full bg-red px-1 text-center text-[11px] font-semibold leading-[18px] text-white">
      {badge}
    </span>
  );

  if (variant === "bottom") {
    return (
      <Link
        href="/notifications"
        aria-label={label}
        className={`flex flex-col items-center ${active ? "text-dark-green" : "text-dark-gray"} hover:text-dark-green`}
      >
        <span className="relative">
          <Icon className="h-6 w-6" />
          {dot}
        </span>
        <span className="text-xs">Alerts</span>
      </Link>
    );
  }

  return (
    <Link
      href="/notifications"
      aria-label={label}
      title="Notifications"
      className={`relative inline-flex ${active ? "text-dark-green" : "text-dark-gray"} hover:text-dark-green`}
    >
      <Icon className="h-6 w-6" />
      {dot}
    </Link>
  );
}
