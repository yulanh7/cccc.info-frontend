"use client";

import React, { useState } from "react";
import { useAppDispatch } from "@/app/features/hooks";
import { setGroupInvite, resetGroupInvite } from "@/app/features/groups/inviteSlice";
import { inviteUrl } from "@/app/types/group";
import type { GroupInviteState } from "@/app/types/group";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ConfirmModal";
import { errorMessage } from "@/app/lib/errors";

/** 私密小组的邀请链接：开关和重新生成都直接调接口，不跟着“保存小组”提交 */
export default function GroupInviteSection({ groupId, initial }: { groupId: number; initial: GroupInviteState }) {
  const dispatch = useAppDispatch();
  const [state, setState] = useState<GroupInviteState>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const url = state.invite_enabled && state.invite_code ? inviteUrl(state.invite_code, window.location.origin) : null;

  const run = async (action: () => Promise<GroupInviteState>) => {
    setBusy(true);
    setError(null);
    setCopied(false);
    try {
      setState(await action());
    } catch (e) {
      setError(errorMessage(e, "Something went wrong"));
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!url) return;
    setError(null);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setError("Couldn't copy. Please select the link and copy it.");
    }
  };

  return (
    <div className="mt-3">
      <p className="block text-sm font-medium mb-1">Invite link</p>
      <label className={`flex items-center ${busy ? "opacity-60" : "cursor-pointer"}`}>
        <input
          type="checkbox"
          className="mr-2"
          checked={state.invite_enabled}
          disabled={busy}
          onChange={(e) => run(() => dispatch(setGroupInvite({ groupId, enabled: e.target.checked })).unwrap())}
        />
        <span className="text-sm text-dark-gray">Allow joining with a link</span>
      </label>

      {url && (
        <>
          <div className="mt-2 flex items-center gap-2">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-sm border border-border bg-white p-2 text-sm"
              aria-label="Invite link"
            />
            <Button type="button" size="sm" variant="outline" tone="brand" onClick={copy} disabled={busy}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <button
            type="button"
            className="mt-1 text-xs text-dark-gray underline underline-offset-2 hover:text-dark-green"
            disabled={busy}
            onClick={() => setConfirmReset(true)}
          >
            Reset link
          </button>
        </>
      )}

      {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}

      <ConfirmModal
        isOpen={confirmReset}
        title="Reset invite link"
        message="Reset the invite link? The current link will stop working."
        confirmLabel="Reset"
        confirmVariant="danger"
        cancelLabel="Cancel"
        cancelVariant="outline"
        onCancel={() => setConfirmReset(false)}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false);
          void run(() => dispatch(resetGroupInvite(groupId)).unwrap());
        }}
      />
    </div>
  );
}
