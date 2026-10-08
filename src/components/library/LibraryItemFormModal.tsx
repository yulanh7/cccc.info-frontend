"use client";

import React, { useMemo, useState } from "react";
import { useAppDispatch } from "@/app/features/hooks";
import { createLibraryItem, updateLibraryItem } from "@/app/features/library/slice";
import { LIBRARY_ITEM_TYPES } from "@/app/types/library";
import type { LibraryItem, LibraryItemInput, LibraryItemType } from "@/app/types/library";
import Button from "@/components/ui/Button";
import LibraryModal from "@/components/library/LibraryModal";
import { errorMessage } from "@/app/lib/errors";

type FieldKey = Exclude<keyof LibraryItemInput, "item_type">;
type FieldDef = { key: FieldKey; label: string; required?: boolean; type?: string; placeholder?: string };

/** 书 / 影音各自的栏位（影音的 creator / publisher 是讲员 / 制作单位） */
const COMMON_HEAD: FieldDef[] = [
  { key: "title", label: "Title", required: true },
  { key: "category", label: "Category", required: true },
  { key: "call_number", label: "No.", placeholder: "e.g. C200" },
];
const BOOK_FIELDS: FieldDef[] = [
  { key: "creator", label: "Author" },
  { key: "publisher", label: "Publisher" },
  { key: "publish_place", label: "Place of publication" },
  { key: "year", label: "Year" },
];
const MEDIA_FIELDS: FieldDef[] = [
  { key: "creator", label: "Speaker" },
  { key: "publisher", label: "Producer" },
  { key: "language", label: "Language" },
  { key: "subtitles", label: "Subtitles" },
  { key: "disc_count", label: "Discs", type: "number" },
  { key: "duration", label: "Duration" },
];
const COMMON_TAIL: FieldDef[] = [
  { key: "catalog_date", label: "Catalogued", type: "date" },
  { key: "barcode", label: "Barcode" },
];
const ALL_KEYS: FieldKey[] = [
  "title", "category", "call_number", "creator", "publisher", "publish_place", "year",
  "language", "subtitles", "disc_count", "duration", "catalog_date", "barcode",
];

type FormState = { item_type: LibraryItemType } & Record<FieldKey, string>;

const toForm = (item?: LibraryItem | null): FormState => {
  const f = { item_type: item?.item_type ?? "book" } as FormState;
  ALL_KEYS.forEach((k) => {
    const v = item ? (item as unknown as Record<FieldKey, unknown>)[k] : null;
    f[k] = v === null || v === undefined ? "" : String(v);
  });
  return f;
};

export default function LibraryItemFormModal({
  item,
  categories,
  onClose,
  onSaved,
}: {
  /** 不传 = 新增 */
  item?: LibraryItem | null;
  /** 已有分类，用于输入提示 */
  categories: string[];
  onClose: () => void;
  onSaved: (saved: LibraryItem) => void;
}) {
  const dispatch = useAppDispatch();
  const isNew = !item;
  const initial = useMemo(() => toForm(item), [item]);
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBook = form.item_type === "book";
  const fields = [...COMMON_HEAD, ...(isBook ? BOOK_FIELDS : MEDIA_FIELDS), ...COMMON_TAIL];
  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const buildBody = (): LibraryItemInput => {
    const body: LibraryItemInput = {};
    const fieldsOut = body as Record<string, string | number>;
    const visible = new Set(fields.map((f) => f.key));
    if (isNew || form.item_type !== initial.item_type) body.item_type = form.item_type;
    ALL_KEYS.forEach((k) => {
      const v = form[k].trim();
      if (isNew) {
        // 新增：只传当前类型显示的、有值的栏位
        if (visible.has(k) && v) fieldsOut[k] = k === "disc_count" ? Number(v) : v;
      } else if (v !== initial[k].trim()) {
        // 编辑：只传改过的；空字符串 = 清空
        fieldsOut[k] = k === "disc_count" && v ? Number(v) : v;
      }
    });
    return body;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.category.trim()) {
      setError("Title and category are required.");
      return;
    }
    const body = buildBody();
    if (!isNew && Object.keys(body).length === 0) {
      onClose();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = isNew
        ? await dispatch(createLibraryItem(body)).unwrap()
        : await dispatch(updateLibraryItem({ id: item!.id, body })).unwrap();
      onSaved(saved);
    } catch (err) {
      setError(errorMessage(err, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const formId = "library-item-form";

  return (
    <LibraryModal
      title={isNew ? "Add item" : "Edit item"}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" type="submit" form={formId} loading={saving} loadingText="Saving…">
            {isNew ? "Add" : "Save"}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="font-medium text-dark-gray">Type</span>
          <select
            value={form.item_type}
            onChange={(e) => set("item_type", e.target.value)}
            className="rounded-sm border border-border bg-white p-1.5"
          >
            {LIBRARY_ITEM_TYPES.map((t) => (
              <option key={t} value={t}>{t === "book" ? "Book" : t.toUpperCase()}</option>
            ))}
          </select>
        </label>

        {fields.map((f) => (
          <label key={f.key} className={`flex flex-col gap-1 ${f.key === "title" ? "sm:col-span-2" : ""}`}>
            <span className="font-medium text-dark-gray">
              {f.label}
              {f.required && <span className="text-red-600"> *</span>}
            </span>
            <input
              type={f.type ?? "text"}
              min={f.type === "number" ? 0 : undefined}
              value={form[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              list={f.key === "category" ? "library-category-options" : undefined}
              className="rounded-sm border border-border bg-white px-2 py-1.5"
            />
          </label>
        ))}
        <datalist id="library-category-options">
          {categories.map((c) => <option key={c} value={c} />)}
        </datalist>

        {error && <p className="sm:col-span-2 text-sm text-red-600" role="alert">{error}</p>}
      </form>
    </LibraryModal>
  );
}
