"use client";

import React, { useState } from "react";
import { useAppDispatch } from "@/app/features/hooks";
import { sendJoinRequest, withdrawJoinRequest } from "@/app/features/groups/joinRequestSlice";
import type { JoinRequestError } from "@/app/features/groups/joinRequestSlice";
import { JOIN_REQUEST_MESSAGE_MAX } from "@/app/types/group";
import type { MyJoinRequest } from "@/app/types/group";
import Button from "@/components/ui/Button";
import LibraryModal from "@/components/library/LibraryModal";

/**
 * 申请加入 request 小组：可选留言（最多 200 字），发出后组长批准。
 * pending = 已经申请过：只说明在等组长处理，可以撤回。
 */
export default function JoinRequestModal({
  groupId,
  groupName,
  pending = false,
  onClose,
  onSent,
  onWithdrawn,
}: {
  groupId: number;
  groupName: string;
  pending?: boolean;
  onClose: () => void;
  onSent: (request: MyJoinRequest) => void;
  /** 撤回成功，或发现申请已经不在了（被处理过） */
  onWithdrawn?: () => void;
}) {
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tooLong = message.length > JOIN_REQUEST_MESSAGE_MAX;

  const send = async () => {
    if (tooLong) return;
    setBusy(true);
    setError(null);
    try {
      const { join_request: r } = await dispatch(sendJoinRequest({ groupId, message })).unwrap();
      onSent({ id: r.id, status: "pending", created_at: r.created_at, message: r.message });
    } catch (e: any) {
      setError((e as JoinRequestError)?.message || "Failed to send the request");
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    setBusy(true);
    setError(null);
    try {
      await dispatch(withdrawJoinRequest(groupId)).unwrap();
      onWithdrawn?.();
    } catch (e: any) {
      const err = e as JoinRequestError;
      setError(err?.message || "Failed to withdraw the request");
      if (err?.code === 404) onWithdrawn?.();
    } finally {
      setBusy(false);
    }
  };

  if (pending) {
    return (
      <LibraryModal
        title="Request sent"
        onClose={onClose}
        footer={
          <>
            <Button variant="danger" onClick={withdraw} loading={busy} loadingText="Withdrawing…">
              Withdraw request
            </Button>
            <Button variant="primary" onClick={onClose} disabled={busy}>OK</Button>
          </>
        }
      >
        <p className="text-sm text-dark-gray">
          Your request to join <strong className="break-words">{groupName}</strong> is waiting for a group leader to
          approve it. You&apos;ll get a notification when it&apos;s handled.
        </p>
        {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
      </LibraryModal>
    );
  }

  return (
    <LibraryModal
      title="Request to join"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" onClick={send} disabled={tooLong} loading={busy} loadingText="Sending…">
            Send request
          </Button>
        </>
      }
    >
      <p className="text-sm text-dark-gray">
        <strong className="break-words">{groupName}</strong> is open to members only. To join, send a request and a
        group leader will approve it.
      </p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Tell the leaders who you are (optional)"
        aria-label="Message to the group leaders"
        rows={4}
        className={`mt-3 w-full rounded-sm border bg-white p-2 text-[16px] ${tooLong ? "border-red-500" : "border-border"}`}
        autoFocus
      />
      <div className={`text-right text-xs ${tooLong ? "text-red-600" : "text-dark-gray/70"}`} aria-live="polite">
        {message.length}/{JOIN_REQUEST_MESSAGE_MAX}
      </div>
      {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
    </LibraryModal>
  );
}
