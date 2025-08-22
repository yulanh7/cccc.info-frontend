"use client";

import Logo from "@/components/Logo";
import SearchBar from "@/components/SearchBar";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClear: () => void;
  placeholder?: string;
};

export default function MobileSearchHeader({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = "Search…",
}: Props) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 bg-bg border-b border-border px-3 py-2 md:hidden">
      <Logo isScrolled={false} />
      <div className="flex-1">
        <SearchBar
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          onClear={onClear}
          placeholder={placeholder}
          sticky={false}
          showResultHint={false}
        />
      </div>
    </header>
  );
}
