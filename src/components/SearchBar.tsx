import React from "react";
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from "@/components/ui/Button";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClear: () => void;
  placeholder?: string;
  sticky?: boolean;
  showResultHint?: boolean;
  resultHint?: React.ReactNode;
  /** lg：输入框和按钮同高；不显示放大镜；输入文字 16px（避免 iOS 聚焦时自动放大），提示文字 14px 以便在手机上放得下。
   *  用 px 而不是 text-base / text-sm：本站根字号是 20px，rem 字号会偏大 */
  size?: "md" | "lg";
};

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = "Search…",
  sticky = true,
  showResultHint = false,
  resultHint,
  size = "md",
}: Props) {
  const lg = size === "lg";
  return (
    <div className={`${sticky ? "sticky top-0 bg-bg" : ""} `}>
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          {!lg && <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />}
          <input
            name="q"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full border border-border rounded-sm ${lg
              ? `h-10 pl-3 text-[16px] placeholder:text-[14px] ${value ? "pr-10" : "pr-3"}`
              : "pl-10 pr-10 py-2"}`}
            aria-label="Search"
          />
          {value && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-dark-gray"
              aria-label="Clear search"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* 用通用 Button；保持提交逻辑不变 */}
        <Button
          type="submit"
          variant="outline"
          size="md"
          className={`rounded-sm ${lg ? "h-10 py-0 text-[16px]!" : ""}`}
          aria-label="Search"
        >
          Search
        </Button>
      </form>

      {showResultHint && resultHint}
    </div>
  );
}
