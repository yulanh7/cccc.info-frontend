"use client";

import React from "react";

export default function StepDot({
  active,
  label,
}: {
  active: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-green" : "bg-gray-300"}`} />
      <span className={`text-sm ${active ? "text-green font-medium" : "text-gray-600"}`}>{label}</span>
    </div>
  );
}
