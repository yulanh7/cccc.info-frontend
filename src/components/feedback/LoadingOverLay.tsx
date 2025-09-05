import React from "react";
import Spinner from "@/components/feedback/Spinner";

type Props = {
  show: boolean;
  text?: string;
  blur?: boolean;
};

export default function LoadingOverlay({ show, text = "Loading…", blur = true }: Props) {
  if (!show) return null;
  return (
    <div className={`fixed inset-0 z-50 ${blur ? "bg-white backdrop-blur-[1px]" : ""} flex items-center justify-center`}>
      <div className="flex items-center gap-3 rounded-md bg-white px-4 py-3 shadow-md">
        <Spinner />
        <span className="text-sm text-dark-gray">{text}</span>
      </div>
    </div>
  );
}
