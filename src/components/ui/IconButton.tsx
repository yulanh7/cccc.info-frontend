"use client";

import React from "react";
import { cn } from "./cn";

type Variant = "primary" | "warning" | "outline" | "ghost" | "danger";
type Size = "sm" | "md";

type Props = {
  children: React.ReactNode; // 放 Heroicons
  onClick?: () => void;
  title?: string;
  "aria-label"?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  size?: Size;
  className?: string;
  active?: boolean;
  rounded?: "md" | "full"; // 需要圆形图标时用 full
};

const boxBase =
  "inline-flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border disabled:opacity-50 disabled:cursor-not-allowed";

const sizeBox: Record<Size, string> = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
};

const variants: Record<Variant, string> = {
  primary: "bg-green text-white hover:bg-dark-green border border-transparent",
  warning:
    "bg-yellow text-dark-gray hover:bg-yellow/90 border border-transparent",
  outline: "border border-border text-foreground hover:bg-white/5 bg-transparent",
  ghost: "bg-transparent text-foreground hover:bg-white/5 border border-transparent",
  danger: "border border-red/50 text-red hover:bg-red/10 bg-transparent",
};

export default function IconButton({
  children,
  onClick,
  title,
  disabled,
  loading,
  variant = "outline",
  size = "md",
  className,
  active,
  rounded = "md",
  ...rest
}: Props) {
  const radius = rounded === "full" ? "rounded-full" : "rounded-md";
  const activeClass = active
    ? variant === "outline"
      ? "bg-white/5"
      : ""
    : "";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={cn(boxBase, sizeBox[size], variants[variant], radius, activeClass, className)}
      {...rest}
    >
      {children}
    </button>
  );
}
