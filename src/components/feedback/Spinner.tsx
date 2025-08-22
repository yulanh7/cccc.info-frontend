import React from "react";

type Props = {
  className?: string;
  ariaLabel?: string;
};

export default function Spinner({
  className = "h-5 w-5 text-dark-green",
  ariaLabel = "Loading",
}: Props) {
  return (
    <svg
      className={`animate-spin ${className}`}
      role="status"
      aria-label={ariaLabel}
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
      />
    </svg>
  );
}
