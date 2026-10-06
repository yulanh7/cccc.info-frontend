"use client";

import React from "react";
import type { LibraryImportReport, LibraryImportRow, LibraryImportStatus } from "@/app/types/library";

const STATUS_LABELS: Record<LibraryImportStatus, string> = {
  created: "New",
  updated: "Updated",
  unchanged: "Unchanged",
  merged: "Merged",
  ignored: "Ignored",
  error: "Error",
};

/** 摘要顺序；warning 和其他数字有重叠，单独显示 */
const SUMMARY_KEYS: Array<LibraryImportStatus | "warning"> = [
  "created", "updated", "unchanged", "merged", "ignored", "error", "warning",
];
const SUMMARY_LABELS: Record<LibraryImportStatus | "warning", string> = {
  ...STATUS_LABELS,
  warning: "Warnings",
};

const rowKey = (r: LibraryImportRow, i: number) => `${r.sheet}:${r.row ?? "sheet"}:${i}`;

function RowLine({ r, tone }: { r: LibraryImportRow; tone: "error" | "warning" | "plain" }) {
  const toneClass =
    tone === "error" ? "border-red-300 bg-red-50" : tone === "warning" ? "border-amber-300 bg-amber-50" : "border-border bg-white";
  const where = r.row === null ? `${r.sheet} (whole sheet)` : `${r.sheet} row ${r.row}`;
  return (
    <li className={`rounded-sm border px-3 py-2 text-sm ${toneClass}`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-dark-gray border border-border">
          {STATUS_LABELS[r.status]}
        </span>
        <span className="text-dark-gray/80">{where}</span>
        {r.call_number && <span className="font-mono text-xs">· {r.call_number}</span>}
        {r.title && <span className="break-words">· {r.title}</span>}
      </div>
      {r.messages.length > 0 && (
        <ul className="mt-1 list-disc pl-5 text-dark-gray">
          {r.messages.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      )}
    </li>
  );
}

/** 导入报告：摘要在最上面；错误、提醒置顶并高亮；忽略和普通行默认折叠 */
export default function ImportReportView({ report }: { report: LibraryImportReport }) {
  const { summary, rows } = report;
  const errors = rows.filter((r) => r.status === "error");
  const warnings = rows.filter((r) => r.status !== "error" && r.status !== "ignored" && r.messages.length > 0);
  const ignored = rows.filter((r) => r.status === "ignored");
  const plain = rows.filter((r) => r.status !== "error" && r.status !== "ignored" && r.messages.length === 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SUMMARY_KEYS.map((k) => (
          <span
            key={k}
            className={`rounded-sm border px-2 py-1 text-xs ${
              k === "error" && summary.error > 0
                ? "border-red-300 bg-red-50 text-red-700"
                : k === "warning" && summary.warning > 0
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : "border-border bg-white text-dark-gray"
            }`}
          >
            {SUMMARY_LABELS[k]} <strong>{summary[k] ?? 0}</strong>
          </span>
        ))}
      </div>

      {errors.length > 0 && (
        <section>
          <h3 className="mb-1 text-sm font-medium text-red-700">Errors ({errors.length})</h3>
          <ul className="space-y-1">{errors.map((r, i) => <RowLine key={rowKey(r, i)} r={r} tone="error" />)}</ul>
        </section>
      )}

      {warnings.length > 0 && (
        <section>
          <h3 className="mb-1 text-sm font-medium text-amber-800">Warnings ({warnings.length})</h3>
          <ul className="space-y-1">{warnings.map((r, i) => <RowLine key={rowKey(r, i)} r={r} tone="warning" />)}</ul>
        </section>
      )}

      {ignored.length > 0 && (
        <details className="rounded-sm border border-border bg-white">
          <summary className="cursor-pointer px-3 py-2 text-sm text-dark-gray">Ignored rows ({ignored.length})</summary>
          <ul className="space-y-1 p-2">{ignored.map((r, i) => <RowLine key={rowKey(r, i)} r={r} tone="plain" />)}</ul>
        </details>
      )}

      {plain.length > 0 && (
        <details className="rounded-sm border border-border bg-white">
          <summary className="cursor-pointer px-3 py-2 text-sm text-dark-gray">Other rows ({plain.length})</summary>
          <ul className="space-y-1 p-2">{plain.map((r, i) => <RowLine key={rowKey(r, i)} r={r} tone="plain" />)}</ul>
        </details>
      )}
    </div>
  );
}
