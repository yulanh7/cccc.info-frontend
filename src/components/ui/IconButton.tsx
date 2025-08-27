"use client";
import React from "react";
import { cn } from "./cn";

type Variant = "primary" | "warning" | "outline" | "ghost" | "danger";
type Size = "xs" | "sm" | "md";
type Tone = "default" | "brand" | "danger";

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  "aria-label"?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  size?: Size;
  className?: string;
  active?: boolean;
  rounded?: "md" | "full";
  hoverOverlay?: boolean;
  /** 统一控制文字/边框色（只对 outline/ghost 真正生效） */
  tone?: Tone;
};

const boxBase =
  "inline-flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border disabled:opacity-50 disabled:cursor-not-allowed";

const sizeBox: Record<Size, string> = {
  xs: "h-5 w-5",
  sm: "h-6 w-6",
  md: "h-9 w-9",
};

const variants: Record<Variant, string> = {
  warning: "bg-[#FBD402] text-[#1F2937] border border-transparent",
  primary: "bg-yellow text-dark-gray hover:bg-yellow/90 border border-transparent",
  outline: "border border-border text-foreground hover:bg-white/5 bg-transparent",
  ghost: "bg-transparent text-foreground hover:bg-white/5 border border-transparent",
  danger: "border border-red/50 text-red hover:bg-red/10 bg-transparent",
};

function toneClasses(variant: Variant, tone: Tone) {
  if (tone === "default") return "";
  if (variant === "outline") {
    if (tone === "brand") return "text-yellow border-yellow";
    if (tone === "danger") return "text-red-600 border-red-600";
  }
  if (variant === "ghost") {
    if (tone === "brand") return "text-dark-yellow";
    if (tone === "danger") return "text-red-600";
  }
  return "";
}

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
  hoverOverlay = true,
  tone = "default",
  ...rest
}: Props) {
  const radius = rounded === "full" ? "rounded-full" : "rounded-md";
  const activeClass = active
    ? variant === "outline"
      ? "bg-white/5"
      : ""
    : "";
  const overlayClass = hoverOverlay
    ? [
      "relative overflow-hidden",
      "after:content-[''] after:absolute after:inset-0",
      "after:bg-black/10",
      "after:origin-bottom-left after:scale-0",
      "hover:after:scale-100",
      "after:transition-transform after:duration-300 after:ease-out",
      "after:pointer-events-none",
      "disabled:hover:after:scale-0",
    ].join(" ")
    : "";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={cn(
        boxBase, sizeBox[size], variants[variant], radius, activeClass, overlayClass,
        toneClasses(variant, tone),
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
