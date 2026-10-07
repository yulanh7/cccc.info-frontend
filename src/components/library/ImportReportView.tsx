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
  warning: "Notes",
};

const rowKey = (r: LibraryImportRow, i: number) => `${r.sheet}:${r.row ?? "sheet"}:${i}`;

type Tone = "error" | "warning" | "update" | "plain";
const TONE_CLASSES: Record<Tone, string> = {
  error: "border-red-300 bg-red-50",
  warning: "border-amber-300 bg-amber-50",
  update: "border-sky-300 bg-sky-50",
  plain: "border-border bg-white",
};

function RowLine({ r, tone }: { r: LibraryImportRow; tone: Tone }) {
  const toneClass = TONE_CLASSES[tone];
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

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** 报告顶部的白话总结，根据 summary 生成；预览用将来时，导入完成用过去时 */
export function importSummarySentence(summary: LibraryImportReport["summary"], mode: "preview" | "done"): string {
  const done = mode === "done";
  const created = summary.created ?? 0;
  const updated = summary.updated ?? 0;
  const errors = summary.error ?? 0;
  const already = (summary.unchanged ?? 0) + (summary.merged ?? 0);
  const sentences: string[] = [];

  if (created === 0 && updated === 0 && errors === 0) {
    sentences.push(
      done
        ? `All ${plural(already, "row was", "rows were")} already in the library. Nothing was changed.`
        : `All ${plural(already, "row is", "rows are")} already in the library. Nothing will change.`
    );
  } else {
    const parts: string[] = [];
    if (created > 0) parts.push(`${plural(created, "new item", "new items")} ${done ? (created === 1 ? "was" : "were") : "will be"} added`);
    if (updated > 0) parts.push(`${plural(updated, "existing item", "existing items")} ${done ? (updated === 1 ? "was" : "were") : "will be"} updated`);
    if (already > 0) parts.push(`${already} ${done ? (already === 1 ? "was" : "were") : (already === 1 ? "is" : "are")} already in the library`);
    if (parts.length > 0) {
      const text = parts.join(", ");
      sentences.push(text.charAt(0).toUpperCase() + text.slice(1) + ".");
    }
  }
  if (errors > 0) {
    const verb = done ? (errors === 1 ? "was not imported" : "were not imported") : "will not be imported";
    sentences.push(`${plural(errors, "row has", "rows have")} errors and ${verb}.`);
  }
  return sentences.join(" ");
}

function Group({
  title,
  rows,
  tone,
  titleClass,
  collapsed,
}: {
  title: string;
  rows: LibraryImportRow[];
  tone: Tone;
  titleClass?: string;
  collapsed?: boolean;
}) {
  if (rows.length === 0) return null;
  const list = (
    <ul className={`space-y-1 ${collapsed ? "p-2" : ""}`}>
      {rows.map((r, i) => <RowLine key={rowKey(r, i)} r={r} tone={tone} />)}
    </ul>
  );
  const heading = `${title} (${rows.length})`;
  return collapsed ? (
    <details className="rounded-sm border border-border bg-white">
      <summary className="cursor-pointer px-3 py-2 text-sm text-dark-gray">{heading}</summary>
      {list}
    </details>
  ) : (
    <section>
      <h3 className={`mb-1 text-sm font-medium ${titleClass ?? "text-dark-gray"}`}>{heading}</h3>
      {list}
    </section>
  );
}

/** 导入报告：顶部白话总结 + 摘要数字；每一行只出现在一个组里：
 *  错误 → 有说明的行 → 会更新的行（以上默认展开）→ 新增 → 已在馆内 → 跳过（以上默认折叠） */
export default function ImportReportView({ report, mode }: { report: LibraryImportReport; mode: "preview" | "done" }) {
  const { summary, rows } = report;
  const noMsg = (r: LibraryImportRow) => r.messages.length === 0;
  const errors = rows.filter((r) => r.status === "error");
  const notes = rows.filter((r) => r.status !== "error" && r.status !== "ignored" && !noMsg(r));
  const updated = rows.filter((r) => r.status === "updated" && noMsg(r));
  const created = rows.filter((r) => r.status === "created" && noMsg(r));
  const already = rows.filter((r) => (r.status === "unchanged" || r.status === "merged") && noMsg(r));
  const skipped = rows.filter((r) => r.status === "ignored");

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-dark-gray">{importSummarySentence(summary, mode)}</p>

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

      <Group title="Errors — not imported" rows={errors} tone="error" titleClass="text-red-700" />
      <Group title="Notes" rows={notes} tone="warning" titleClass="text-amber-800" />
      <Group
        title={mode === "preview" ? "Will update existing items" : "Updated existing items"}
        rows={updated}
        tone="update"
        titleClass="text-sky-800"
      />
      <Group title="New items" rows={created} tone="plain" collapsed />
      <Group title="Already in the library" rows={already} tone="plain" collapsed />
      <Group title="Skipped — no title" rows={skipped} tone="plain" collapsed />
    </div>
  );
}
