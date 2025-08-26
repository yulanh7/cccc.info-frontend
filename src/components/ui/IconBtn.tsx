"use client";

import React from "react";

export default function IconBtn({
  title,
  children,
  onClick,
  disabled = false,
  intent = "default",
}: {
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  intent?: "default" | "danger";
}) {
  const base =
    "inline-flex items-center justify-center rounded-md border px-2.5 py-2 transition-colors";
  const color =
    intent === "danger"
      ? "border-red/50 hover:bg-red/10 text-red"
      : "border-border hover:bg-white/5 text-foreground";
  const state = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";
  return (
    <button
      type="button"
      aria-label={title}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${color} ${state}`}
    >
      {children}
    </button>
  );
}
