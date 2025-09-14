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
}: Props) {
  return (
    <div className={`${sticky ? "sticky top-0 bg-bg" : ""} `}>
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
          <input
            name="q"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-2 border border-border rounded-sm"
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
          className="rounded-sm"
          aria-label="Search"
        >
          Search
        </Button>
      </form>

      {showResultHint && resultHint}
    </div>
  );
}
