"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { UsersIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import { fetchInvite, joinByInvite } from "@/app/features/groups/inviteSlice";
import type { InvitePreview } from "@/app/types/group";
import CustomHeader from "@/components/layout/CustomHeader";
import PageTitle from "@/components/layout/PageTitle";
import Button from "@/components/ui/Button";

type View =
  | { kind: "loading" }
  | { kind: "ready"; preview: InvitePreview }
  | { kind: "invalid" }
  | { kind: "error"; message: string };

const INVALID_TEXT = "This invite link is no longer valid. Ask a group leader for a new link.";

/** 用邀请链接加入私密小组；没登录时登录守卫会先跳去 /auth?next=…，登录后回到这里 */
export default function JoinByInvitePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [view, setView] = useState<View>({ kind: "loading" });
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !code) return;
    let cancelled = false;
    dispatch(fetchInvite(code))
      .unwrap()
      .then((preview) => !cancelled && setView({ kind: "ready", preview }))
      .catch((e: any) => {
        if (cancelled) return;
        setView(e?.code === 404 ? { kind: "invalid" } : { kind: "error", message: e?.message || "Something went wrong" });
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, code, user]);

  const join = async () => {
    setJoining(true);
    setJoinError(null);
    try {
      const res = await dispatch(joinByInvite(code)).unwrap();
      router.push(`/groups/${res.group.id}`);
    } catch (e: any) {
      if (e?.code === 404) setView({ kind: "invalid" });
      else setJoinError(e?.message || "Join failed");
    } finally {
      setJoining(false);
    }
  };

  return (
    <>
      <CustomHeader pageTitle="Join group" showLogo={true} />
      <PageTitle title="Join group" showPageTitle />
      <div className="mx-auto w-full max-w-md p-4 min-h-screen mt-0 md:mt-16">
        {view.kind === "loading" && <p className="text-sm text-dark-gray">Loading…</p>}

        {view.kind === "invalid" && <p className="text-sm text-dark-gray">{INVALID_TEXT}</p>}

        {view.kind === "error" && <p className="text-sm text-red-600" role="alert">{view.message}</p>}

        {view.kind === "ready" && (
          <div className="rounded-md border border-border bg-white p-4">
            <h1 className="text-lg font-semibold text-dark-gray break-words">{view.preview.group.name}</h1>
            {view.preview.group.description && (
              <p className="mt-2 text-sm text-dark-gray whitespace-pre-line break-words">{view.preview.group.description}</p>
            )}
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-dark-gray/70">
              <UsersIcon className="h-4 w-4" />
              {view.preview.group.subscriber_count} {view.preview.group.subscriber_count === 1 ? "member" : "members"}
            </p>

            <div className="mt-4">
              {view.preview.is_member ? (
                <>
                  <p className="mb-3 text-sm text-dark-gray">You&apos;re already a member of this group.</p>
                  <Link
                    href={`/groups/${view.preview.group.id}`}
                    className="inline-flex h-10 items-center rounded-sm border border-dark-green px-4 text-sm text-dark-green hover:bg-dark-green/5"
                  >
                    Go to group
                  </Link>
                </>
              ) : (
                <Button variant="primary" onClick={join} loading={joining} loadingText="Joining…">
                  Join group
                </Button>
              )}
              {joinError && <p className="mt-3 text-sm text-red-600" role="alert">{joinError}</p>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
