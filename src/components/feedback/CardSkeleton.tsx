import React from "react";

type Props = {
  lines?: number;
  showActions?: boolean;
};

export default function CardSkeleton({ lines = 2, showActions = true }: Props) {
  return (
    <div className="card p-3">
      <div className="h-5 w-36 bg-gray-200 rounded animate-pulse mb-2" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
      ))}
      <div className="flex justify-between">
        <div className="h-8 w-28 bg-gray-200 rounded animate-pulse" />
        {showActions && <div className="h-7 w-7 bg-gray-200 rounded-full animate-pulse" />}
      </div>
    </div>
  );
}
