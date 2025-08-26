"use client";

import React from "react";
import { cn } from "./cn";

type Variant = "primary" | "warning" | "outline" | "ghost" | "danger";
type Size = "sm" | "md";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  size?: Size;
  className?: string;
  /** 可切换按钮（比如 Select 开关） */
  active?: boolean;
  /** 图标（放在文字左侧） */
  leftIcon?: React.ReactNode;
  /** 图标（放在文字右侧） */
  rightIcon?: React.ReactNode;
  title?: string;
  "aria-label"?: string;
};

const base =
  "inline-flex items-center justify-center rounded-md transition-colors font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border disabled:opacity-50 disabled:cursor-not-allowed";

const sizes: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-sm",
  md: "px-3 py-2 text-sm",
};

const variants: Record<Variant, string> = {
  primary: "bg-green text-white hover:bg-dark-green border border-transparent",
  warning:
    "bg-yellow text-dark-gray hover:bg-yellow/90 border border-transparent",
  outline: "border border-border text-foreground hover:bg-white/5",
  ghost: "bg-transparent text-foreground hover:bg-white/5 border border-transparent",
  danger: "border border-red/50 text-red hover:bg-red/10",
};

export default function Button({
  children,
  onClick,
  type = "button",
  disabled,
  loading,
  variant = "outline",
  size = "md",
  className,
  active,
  leftIcon,
  rightIcon,
  title,
  ...rest
}: ButtonProps) {
  // 可切换按钮的「active」对 warning/primary 常用；也能给 outline/ghost 叠加样式
  const activeClass = active
    ? variant === "outline"
      ? "bg-white/5"
      : "" // warning/primary 自带实底
    : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(base, sizes[size], variants[variant], activeClass, className)}
      title={title}
      {...rest}
    >
      {leftIcon ? <span className="mr-1.5">{leftIcon}</span> : null}
      {children}
      {rightIcon ? <span className="ml-1.5">{rightIcon}</span> : null}
    </button>
  );
}
