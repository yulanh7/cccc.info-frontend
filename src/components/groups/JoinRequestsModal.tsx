"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useAppDispatch } from "@/app/features/hooks";
import {
  fetchJoinRequests,
  approveJoinRequest,
  declineJoinRequest,
} from "@/app/features/groups/joinRequestSlice";
import type { JoinRequestError } from "@/app/features/groups/joinRequestSlice";
import { setPendingRequestCount } from "@/app/features/groups/detailSlice";
import type { JoinRequest } from "@/app/types/group";
import { formatDate } from "@/app/ultility";
import Button from "@/components/ui/Button";
import LibraryModal from "@/components/library/LibraryModal";
import { errorMessage } from "@/app/lib/errors";

/**
 * 管理者看待处理的加入申请（旧的在前），逐条 Approve / Decline。
 * 409 = 别的组长已经处理过（或申请人撤回了）：显示后端的话，并把这一条从列表拿掉。
 */
export default function JoinRequestsModal({ groupId, onClose }: { groupId: number; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const [requests, setRequests] = useState<JoinRequest[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setRequests(await dispatch(fetchJoinRequests(groupId)).unwrap());
    } catch (e) {
      setLoadError((e as JoinRequestError)?.message || "Failed to load join requests");
    }
  }, [dispatch, groupId]);

  useEffect(() => {
    load();
  }, [load]);

  // 小组页上的 "Join requests (N)" 跟着列表走（别的组长处理过的也会被去掉）
  useEffect(() => {
    if (requests) dispatch(setPendingRequestCount({ groupId, count: requests.length }));
  }, [requests, groupId, dispatch]);

  const handle = async (r: JoinRequest, action: "approve" | "decline") => {
    setBusyId(r.id);
    setNotice(null);
    const name = r.user?.firstName ?? "This person";
    try {
      const thunk = action === "approve" ? approveJoinRequest : declineJoinRequest;
      await dispatch(thunk({ groupId, requestId: r.id })).unwrap();
      setRequests((list) => list?.filter((x) => x.id !== r.id) ?? null);
      setNotice({ text: action === "approve" ? `${name} is now a member.` : `${name}'s request was declined.` });
    } catch (e) {
      const err = e as JoinRequestError;
      // 已被处理 / 已经不存在：列表里这一条过时了
      if (err?.code === 409 || err?.code === 404) {
        setRequests((list) => list?.filter((x) => x.id !== r.id) ?? null);
      }
      setNotice({ text: errorMessage(err, "Action failed"), error: true });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <LibraryModal title="Join requests" onClose={onClose} wide>
      {notice && (
        <p
          className={`mb-3 rounded-sm border p-2 text-sm ${notice.error ? "border-red-300 bg-red-50 text-red-700" : "border-border bg-gray-50 text-dark-gray"}`}
          role={notice.error ? "alert" : "status"}
        >
          {notice.text}
        </p>
      )}

      {loadError && (
        <p className="text-sm text-red-600" role="alert">
          {loadError}{" "}
          <button type="button" className="underline" onClick={load}>Retry</button>
        </p>
      )}
      {!loadError && requests === null && <p className="text-sm text-dark-gray/70">Loading…</p>}
      {requests?.length === 0 && <p className="text-sm text-dark-gray">No pending requests.</p>}

      {!!requests?.length && (
        <ul className="divide-y divide-border">
          {requests.map((r) => (
            <li key={r.id} className="py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{r.user?.firstName ?? "Unknown"}</span>{" "}
                    <span className="break-all text-dark-gray/70">{r.user?.email}</span>
                  </p>
                  <p className="text-xs text-dark-gray/60">{formatDate(r.created_at, true)}</p>
                  {r.message && <p className="mt-1 whitespace-pre-line break-words text-sm text-dark-gray">{r.message}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => handle(r, "decline")} disabled={busyId !== null}>
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handle(r, "approve")}
                    disabled={busyId !== null}
                    loading={busyId === r.id}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </LibraryModal>
  );
}
