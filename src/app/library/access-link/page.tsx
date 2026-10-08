"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { ChevronLeftIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import { fetchAccessLink, setAccessLinkEnabled, resetAccessLink } from "@/app/features/library/slice";
import { libraryAccessUrl } from "@/app/features/library/access";
import { canManageLibrary } from "@/app/types/library";
import type { LibraryAccessLink } from "@/app/types/library";
import { formatDate } from "@/app/ultility";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import PageTitle from "@/components/layout/PageTitle";
import CustomHeader from "@/components/layout/CustomHeader";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ConfirmModal";
import { errorMessage } from "@/app/lib/errors";

/** 图书管理员：图书馆访问链接 + 可打印的二维码。普通用户只能通过它进入图书馆 */
export default function LibraryAccessLinkPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const goBack = useBackNavigation("/library");
  const [mounted, setMounted] = useState(false);
  const [link, setLink] = useState<LibraryAccessLink | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  useEffect(() => setMounted(true), []);

  const canAccess = canManageLibrary(user);
  const url = link && mounted ? libraryAccessUrl(link.code, window.location.origin) : null;

  const run = async (action: () => Promise<LibraryAccessLink>) => {
    setBusy(true);
    setError(null);
    setCopied(false);
    try {
      setLink(await action());
    } catch (e) {
      setError(errorMessage(e, "Something went wrong"));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!mounted || !canAccess) return;
    void run(() => dispatch(fetchAccessLink()).unwrap());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, canAccess]);

  // 二维码随链接变化重新生成（打印用较高分辨率）
  useEffect(() => {
    if (!url) return setQr(null);
    QRCode.toDataURL(url, { width: 600, margin: 1, errorCorrectionLevel: "M" })
      .then(setQr)
      .catch(() => setQr(null));
  }, [url]);

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
    <>
      <div className="print:hidden">
        <CustomHeader pageTitle="Library link" backHref="/library" backText="Library" backLabel="Back to library" />
        <PageTitle title="Library link & QR code" showPageTitle />
      </div>

      <div className="mx-auto w-full max-w-2xl p-4 min-h-screen mt-0 md:mt-16 print:mt-0">
        <Link href="/library" onClick={goBack} className="hidden md:inline-flex print:hidden items-center gap-1 text-sm text-dark-gray hover:text-dark-green mb-3">
          <ChevronLeftIcon className="h-4 w-4" />
          Back to library
        </Link>

        {mounted && !canAccess ? (
          <p className="text-sm text-dark-gray">Only library managers can manage the library link.</p>
        ) : (
          <>
            {/* 管理区（打印时隐藏） */}
            <section className="print:hidden rounded-md border border-border bg-white p-4 space-y-3 text-sm">
              <p className="text-dark-gray">
                Members can only open the library with this link or its QR code. Put the printed QR code in the library;
                each visit lasts until the browser tab is closed.
              </p>
              <label className={`flex items-center gap-2 ${busy ? "opacity-60" : "cursor-pointer"}`}>
                <input
                  type="checkbox"
                  checked={!!link?.enabled}
                  disabled={busy || !link}
                  onChange={(e) => run(() => dispatch(setAccessLinkEnabled(e.target.checked)).unwrap())}
                />
                <span className="text-dark-gray">Library link is on</span>
              </label>
              {link && !link.enabled && (
                <p className="text-amber-800">The link and QR code are turned off. Members can&apos;t open the library until you turn it back on.</p>
              )}
              {url && (
                <div className="flex items-center gap-2">
                  <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Library link" className="min-w-0 flex-1 rounded-sm border border-border bg-white p-2 text-[14px]" />
                  <Button size="sm" variant="outline" tone="brand" onClick={copy} disabled={busy}>
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="primary" leftIcon={<PrinterIcon className="h-4 w-4" />} onClick={() => window.print()} disabled={!qr}>
                  Print QR code
                </Button>
                {qr && (
                  <a href={qr} download="library-qr-code.png" className="text-sm text-dark-gray underline underline-offset-2 hover:text-dark-green">
                    Download image
                  </a>
                )}
                <button type="button" className="ml-auto text-sm text-red underline underline-offset-2" disabled={busy || !link} onClick={() => setConfirmReset(true)}>
                  Reset link
                </button>
              </div>
              {error && <p className="text-red-600" role="alert">{error}</p>}
            </section>

            {/* 打印区：说明 + 二维码 + 生效日期 */}
            {link && qr && (
              <section className="mt-4 rounded-md border border-border bg-white p-6 text-center print:mt-0 print:border-0">
                <h2 className="text-xl font-semibold text-dark-gray">Church Library</h2>
                <p className="mt-2 text-sm text-dark-gray">
                  Scan this QR code with your phone and log in to browse, borrow and return books.
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="Library QR code" className="mx-auto mt-4 h-64 w-64 print:h-80 print:w-80" />
                <p className="mt-3 break-all text-xs text-dark-gray/70">{url}</p>
                <p className="mt-2 text-sm text-dark-gray">Valid from {formatDate(link.created_at)}</p>
                {!link.enabled && <p className="mt-1 text-sm text-red print:hidden">Currently turned off</p>}
              </section>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmReset}
        title="Reset library link"
        message="Reset the library link? The current link and printed QR codes will stop working immediately."
        confirmLabel="Reset"
        confirmVariant="danger"
        cancelLabel="Cancel"
        cancelVariant="outline"
        onCancel={() => setConfirmReset(false)}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false);
          void run(() => dispatch(resetAccessLink()).unwrap());
        }}
      />
    </>
  );
}
