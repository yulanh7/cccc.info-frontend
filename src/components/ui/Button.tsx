"use client";
import React, { forwardRef } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "warning" | "outline" | "ghost" | "danger";
type Size = "sm" | "md";
type Tone = "default" | "brand" | "danger";

// 继承原生 button 的所有 attributes，这样 aria-*、title 等都类型安全
type ButtonOwnProps = {
  loading?: boolean;
  loadingText?: React.ReactNode;
  blockWhileLoading?: boolean;
  variant?: Variant;
  size?: Size;
  className?: string;
  active?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  hoverOverlay?: boolean;
  /** 统一控制文字/边框色（只对 outline/ghost 真正生效） */
  tone?: Tone;
  fullWidth?: boolean;
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonOwnProps;

const base =
  "inline-flex items-center justify-center rounded-sm transition-colors font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border disabled:opacity-50 disabled:cursor-not-allowed";

const sizes: Record<Size, string> = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-3 py-2 text-sm",
};

const variants: Record<Variant, string> = {
  primary: "bg-yellow text-dark-gray border border-transparent",
  secondary: "bg-dark-green text-white hover:bg-green border border-transparent",
  warning: "bg-yellow text-dark-gray hover:bg-yellow/90 border border-transparent",
  outline: "border",
  ghost: "bg-transparent text-foreground hover:bg-white/5 border border-transparent",
  danger: "border border-red/50 text-red hover:bg-red/10",
};

function toneClasses(variant: Variant, tone: Tone) {
  if (tone === "default") {
    return variant === "outline" ? "text-dark-yellow border-dark-yellow" : "";
  }

  if (variant === "outline") {
    if (tone === "brand") return "text-dark-green border-dark-green";
    if (tone === "danger") return "text-red border-red";
  }
  if (variant === "ghost") {
    if (tone === "brand") return "text-dark-green";
    if (tone === "danger") return "text-red";
  }
  return "";
}


function Spinner({ size = "md" as Size }: { size?: Size }) {
  const dim = size === "sm" ? "h-3 w-3 border" : "h-4 w-4 border-2";
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block rounded-full border-current border-t-transparent animate-spin", dim)}
    />
  );
}

// ✅ 用 forwardRef 把 ref 透传到真正的 <button>
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    onClick,
    type = "button",
    disabled,
    loading = false,
    loadingText,
    blockWhileLoading = true,
    variant = "outline",
    size = "md",
    className,
    active,
    leftIcon,
    rightIcon,
    title,
    hoverOverlay = true,
    tone = "default",
    fullWidth = false,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading;

  const activeClass = active ? (variant === "outline" ? "bg-white/5" : "") : "";

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

  const widthClass = fullWidth ? "w-full" : "";

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (blockWhileLoading && loading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick?.(e);
  };

  const showLeft = loading ? <Spinner size={size} /> : leftIcon;
  const label = loading ? (loadingText ?? children) : children;

  return (
    <button
      ref={ref}
      type={type}
      onClick={handleClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      className={cn(
        base,
        sizes[size],
        variants[variant],
        activeClass,
        overlayClass,
        toneClasses(variant, tone),
        widthClass,
        loading ? "cursor-wait" : "",
        className
      )}
      title={title}
      {...rest}
    >
      {showLeft ? <span className="mr-1.5">{showLeft}</span> : null}
      <span className="inline-flex items-center">{label}</span>
      {rightIcon && !loading ? <span className="ml-1.5">{rightIcon}</span> : null}
    </button>
  );
});

export default Button;
