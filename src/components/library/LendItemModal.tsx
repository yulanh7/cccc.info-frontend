"use client";

import React, { useState } from "react";
import { useAppDispatch } from "@/app/features/hooks";
import { borrowLibraryItem } from "@/app/features/library/slice";
import type { LibraryBorrower, LibraryItem, LibraryBorrowResult } from "@/app/types/library";
import Button from "@/components/ui/Button";
import LibraryModal from "@/components/library/LibraryModal";
import BorrowerPicker from "@/components/library/BorrowerPicker";

/** 代借：选借阅人 → 借这一件（带 user_id，不带 any_copy）；默认借阅人是管理员自己 */
export default function LendItemModal({
  item,
  defaultBorrower = null,
  onClose,
  onLent,
}: {
  item: Pick<LibraryItem, "id" | "call_number" | "title">;
  defaultBorrower?: LibraryBorrower | null;
  onClose: () => void;
  onLent: (res: LibraryBorrowResult) => void;
}) {
  const dispatch = useAppDispatch();
  const [borrower, setBorrower] = useState<LibraryBorrower | null>(defaultBorrower);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onConfirm = async () => {
    if (!borrower) return;
    setSaving(true);
    setError(null);
    try {
      const res = await dispatch(borrowLibraryItem({ itemId: item.id, user_id: borrower.id })).unwrap();
      onLent(res);
    } catch (e: any) {
      setError(typeof e === "string" ? e : e?.message || "Lend failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <LibraryModal
      title="Lend item"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={onConfirm} disabled={!borrower} loading={saving} loadingText="Lending…">
            Lend
          </Button>
        </>
      }
    >
      <p className="mb-3 text-sm text-dark-gray">
        {item.call_number && <span className="font-mono mr-1">{item.call_number}</span>}
        <span className="font-medium">{item.title}</span>
      </p>
      <p className="mb-1 text-sm font-medium text-dark-gray">Borrower</p>
      <BorrowerPicker selected={borrower} onSelect={setBorrower} autoFocus />
      {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
    </LibraryModal>
  );
}
