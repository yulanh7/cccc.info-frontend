"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ArrowDownTrayIcon, InformationCircleIcon, DocumentArrowUpIcon } from "@heroicons/react/24/outline";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import { previewLibraryImport, importLibrary, exportLibrary } from "@/app/features/library/slice";
import { canManageLibrary } from "@/app/types/library";
import type { LibraryImportReport } from "@/app/types/library";
import PageTitle from "@/components/layout/PageTitle";
import CustomHeader from "@/components/layout/CustomHeader";
import LoadingOverlay from "@/components/feedback/LoadingOverLay";
import Button from "@/components/ui/Button";
import ImportReportView from "@/components/library/ImportReportView";
import { errorMessage } from "@/app/lib/errors";

type Stage = "pick" | "preview" | "done";

export default function LibraryImportPage() {
  const dispatch = useAppDispatch();
  const goBack = useBackNavigation("/library");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const currentUser = useAppSelector((s) => s.auth.user);
  const canAccess = canManageLibrary(currentUser);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("pick");
  const [report, setReport] = useState<LibraryImportReport | null>(null);
  const [busy, setBusy] = useState<"preview" | "import" | "export" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setReport(null);
    setStage("pick");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const run = async (kind: "preview" | "import" | "export") => {
    setBusy(kind);
    setError(null);
    try {
      if (kind === "export") {
        await dispatch(exportLibrary()).unwrap();
      } else if (file) {
        const res =
          kind === "preview"
            ? await dispatch(previewLibraryImport(file)).unwrap()
            : await dispatch(importLibrary(file)).unwrap();
        setReport(res);
        setStage(kind === "preview" ? "preview" : "done");
      }
    } catch (e) {
      setError(errorMessage(e, "Something went wrong"));
    } finally {
      setBusy(null);
    }
  };

  const errorCount = report?.summary.error ?? 0;

  return (
    <>
      <LoadingOverlay show={!mounted} text="Loading…" />
      <CustomHeader pageTitle="Import / export" backHref="/library" backText="Library" backLabel="Back to library" />
      <PageTitle title="Import / export" showPageTitle />

      <div className="mx-auto w-full max-w-3xl p-4 min-h-screen mt-0 md:mt-16">
        <Link href="/library" onClick={goBack} className="hidden md:inline-flex items-center gap-1 text-sm text-dark-gray hover:text-dark-green mb-3">
          <ChevronLeftIcon className="h-4 w-4" />
          Back to library
        </Link>

        {mounted && !canAccess ? (
          <p className="text-sm text-dark-gray">Only library managers can import or export the library.</p>
        ) : (
          <div className="space-y-5">
            {/* 导出 + 推荐流程 */}
            <section className="rounded-md border border-border bg-white p-4">
              <div className="flex items-start gap-2 text-sm text-dark-gray">
                <InformationCircleIcon className="h-5 w-5 shrink-0 text-dark-green" />
                <p>
                  Tip: Export the current catalogue, edit that file, then import it. The exported file can also be used
                  as a template. Avoid using an older file if you have changed book details in the system, as this may
                  create duplicates for books without call numbers.
                </p>
              </div>
              <Button
                className="mt-3"
                size="sm"
                variant="outline"
                tone="brand"
                leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
                loading={busy === "export"}
                loadingText="Preparing…"
                onClick={() => run("export")}
              >
                Download latest list (.xlsx)
              </Button>
            </section>

            {/* 导入 */}
            <section className="rounded-md border border-border bg-white p-4">
              <h2 className="text-sm font-medium text-dark-gray">Import from Excel</h2>
              <p className="mt-1 text-xs text-dark-gray/70">
                Only .xlsx files. You will see a preview first; nothing is saved until you confirm.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {/* 原生文件控件隐藏，用和网站一致的按钮触发 */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  disabled={busy !== null}
                  onChange={(e) => {
                    setFile(e.target.files?.[0] ?? null);
                    setReport(null);
                    setStage("pick");
                    setError(null);
                  }}
                  className="hidden"
                />
                <Button
                  size="sm"
                  variant="outline"
                  tone="brand"
                  leftIcon={<DocumentArrowUpIcon className="h-4 w-4" />}
                  disabled={busy !== null}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose Excel file
                </Button>
                {file && (
                  <span className="min-w-0 max-w-full truncate text-sm text-dark-gray" title={file.name}>
                    {file.name}
                  </span>
                )}
                {stage === "pick" && (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={!file}
                    loading={busy === "preview"}
                    loadingText="Checking…"
                    onClick={() => run("preview")}
                  >
                    Preview
                  </Button>
                )}
              </div>

              {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}

              {report && stage === "preview" && (
                <div className="mt-4 space-y-3">
                  <h3 className="text-sm font-medium text-dark-gray">Preview — nothing has been saved yet</h3>
                  {errorCount > 0 && (
                    <p className="rounded-sm border border-red-300 bg-red-50 p-2 text-sm text-red-700">
                      {errorCount} {errorCount === 1 ? "row" : "rows"} will not be imported; the other rows will be imported as usual.
                      You can fix the spreadsheet and preview again, or continue.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" size="sm" loading={busy === "import"} loadingText="Importing…" onClick={() => run("import")}>
                      Confirm import
                    </Button>
                    <Button variant="outline" size="sm" disabled={busy !== null} onClick={reset}>
                      Cancel
                    </Button>
                  </div>
                  <ImportReportView report={report} mode="preview" />
                </div>
              )}

              {report && stage === "done" && (
                <div className="mt-4 space-y-3">
                  <p className="rounded-sm border border-dark-green/30 bg-dark-green/5 p-2 text-sm text-dark-green" role="status">
                    Import finished.
                  </p>
                  <Button variant="outline" size="sm" onClick={reset}>Import another file</Button>
                  <ImportReportView report={report} mode="done" />
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  );
}
