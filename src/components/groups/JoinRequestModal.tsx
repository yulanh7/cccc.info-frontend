"use client";

import React, { useState } from "react";
import { useAppDispatch } from "@/app/features/hooks";
import { sendJoinRequest } from "@/app/features/groups/joinRequestSlice";
import type { JoinRequestError } from "@/app/features/groups/joinRequestSlice";
import { JOIN_REQUEST_MESSAGE_MAX } from "@/app/types/group";
import Button from "@/components/ui/Button";
import LibraryModal from "@/components/library/LibraryModal";

/** 申请加入 request 小组：可选留言（最多 200 字），发出后组长批准 */
export default function JoinRequestModal({
  groupId,
  groupName,
  onClose,
  onSent,
}: {
  groupId: number;
  groupName: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tooLong = message.length > JOIN_REQUEST_MESSAGE_MAX;

  const send = async () => {
    if (tooLong) return;
    setSending(true);
    setError(null);
    try {
      await dispatch(sendJoinRequest({ groupId, message })).unwrap();
      onSent();
    } catch (e: any) {
      setError((e as JoinRequestError)?.message || "Failed to send the request");
    } finally {
      setSending(false);
    }
  };

  return (
    <LibraryModal
      title="Request to join"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={sending}>Cancel</Button>
          <Button variant="primary" onClick={send} disabled={tooLong} loading={sending} loadingText="Sending…">
            Send request
          </Button>
        </>
      }
    >
      <p className="text-sm text-dark-gray">
        Ask to join <strong className="break-words">{groupName}</strong>. A group leader will review your request.
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
