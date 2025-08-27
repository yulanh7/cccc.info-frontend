"use client";
import React from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "warning" | "outline" | "ghost" | "danger";
type Size = "sm" | "md";
type Tone = "default" | "brand" | "danger";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  size?: Size;
  className?: string;
  active?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  title?: string;
  "aria-label"?: string;
  hoverOverlay?: boolean;
  /** 统一控制文字/边框色（只对 outline/ghost 真正生效） */
  tone?: Tone;
};

const base =
  "inline-flex items-center justify-center rounded-md transition-colors font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border disabled:opacity-50 disabled:cursor-not-allowed";

const sizes: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-sm",
  md: "px-3 py-2 text-sm",
};

const variants: Record<Variant, string> = {
  primary: "bg-yellow text-dark-gray border border-transparent",
  secondary: "bg-[#4A7502] text-white hover:bg-[#3D6202] border border-transparent",
  warning: "bg-yellow text-dark-gray hover:bg-yellow/90 border border-transparent",
  outline: "border border-dark-yellow text-dark-yellow hover:bg-white/5",
  ghost: "bg-transparent text-foreground hover:bg-white/5 border border-transparent",
  danger: "border border-red/50 text-red hover:bg-red/10",
};

function toneClasses(variant: Variant, tone: Tone) {
  if (tone === "default") return "";
  if (variant === "outline") {
    if (tone === "brand") return "text-[#4A7502] border-[#4A7502]";
    if (tone === "danger") return "text-red-600 border-red-600";
  }
  if (variant === "ghost") {
    if (tone === "brand") return "text-[#4A7502]";
    if (tone === "danger") return "text-red-600";
  }
  return "";
}

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
  hoverOverlay = true,
  tone = "default",
  ...rest
}: ButtonProps) {
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
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        base, sizes[size], variants[variant], activeClass, overlayClass,
        toneClasses(variant, tone),
        className
      )}
      title={title}
      {...rest}
    >
      {leftIcon ? <span className="mr-1.5">{leftIcon}</span> : null}
      {children}
      {rightIcon ? <span className="ml-1.5">{rightIcon}</span> : null}
    </button>
  );
}
