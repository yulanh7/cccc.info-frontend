"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import SaveConfirmModal from "../SaveConfirmModal";
import type { PostFileApi } from "@/app/types";
import { compressImageFile } from "@/app/ultility/imageCompression";
import BasicsPanel from "@/components/posts/BasicsPanel";
import MediaPanel from "@/components/posts/MediaPanel";
import StepDot from "@/components/posts/StepDot";
import Stepper from "@/components/posts/Stepper";

/* ======================= 常量 & 工具 ======================= */
const IMAGE_ACCEPT = ".png,.jpg,.jpeg,.gif,.bmp,.webp";
const DOC_ACCEPT = ".doc,.docx,.pdf";
const MAX_TITLE = 100;

const isImageMime = (mime?: string) => !!mime && /^image\//i.test(mime);
const isDocMime = (mime?: string) =>
  !!mime &&
  /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/i.test(
    mime
  );

function splitFiles(files: PostFileApi[]) {
  const images = files.filter((f) => isImageMime(f.file_type));
  const documents = files.filter((f) => isDocMime(f.file_type));
  const others = files.filter((f) => !isImageMime(f.file_type) && !isDocMime(f.file_type));
  return { images, documents, others };
}

const formatMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1) + " MB";

/* ======================= 类型 ======================= */
type FormModel = {
  title: string;
  description: string;
  content: string;
  videos: string[];
  fileIds: number[];
  localFiles?: File[];
};

export type PostModalProps = {
  item?: Partial<FormModel>;
  isNew: boolean;
  onSave: (form: FormModel) => void | Promise<void>;
  onClose: () => void;
  saving?: boolean; // 外部创建/更新中的状态
  existingFiles?: PostFileApi[];
  uploadingPercent?: number; // 外部上传平均进度（用于显示 1~99%）
};

/* ======================= 组件 ======================= */
type Step = 1 | 2;

export default function PostModal({
  item,
  isNew,
  onSave,
  onClose,
  saving = false,
  existingFiles = [],
  uploadingPercent = 0,
}: PostModalProps) {
  const [step, setStep] = useState<Step>(1);

  // 表单
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [content, setContent] = useState(item?.content ?? "");
  const [videos, setVideos] = useState<string[]>(item?.videos ?? []);

  // 文件
  const [fileIds, setFileIds] = useState<number[]>(
    item?.fileIds ??
    (existingFiles?.map((f) => f.id).filter((v): v is number => typeof v === "number") ?? [])
  );
  const [localImages, setLocalImages] = useState<File[]>([]);
  const [localDocs, setLocalDocs] = useState<File[]>([]);

  // 校验 & 交互
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});
  const titleRef = useRef<HTMLInputElement | null>(null);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);


  // 关闭确认
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [placement, setPlacement] = useState<"above" | "below">("below");

  // 压缩状态（防止压缩中保存/关闭）
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressTotal, setCompressTotal] = useState(0);
  const [compressDone, setCompressDone] = useState(0);

  // 常量（图片/文档限制）
  const TARGET_IMAGE_BYTES = 700 * 1024; // 单图目标上限
  const MAX_INPUT_IMAGE_BYTES = 25 * 1024 * 1024; // 极端大图拦截
  const MAX_LONG_EDGE = 1920; // 最长边
  const MAX_DOC_MB = 40;
  const MAX_DOC_FILE_SIZE = MAX_DOC_MB * 1024 * 1024;

  /* ---------- 初始化/回填 ---------- */
  // 仅在首次打开（或切换到不同的 post.id）时，把外部数据灌入本地状态
  const didInitRef = React.useRef(false);
  const seedId = item && (item as any).id ? String((item as any).id) : "new";
  useEffect(() => {
    if (!item) return;
    // 如果是新建：只在首次挂载时初始化
    // 如果是编辑：当 seedId（post.id）变化时才重新初始化
    if (didInitRef.current && seedId !== "new") return;

    setTitle(item.title ?? "");
    setDescription(item.description ?? "");
    setContent(item.content ?? "");
    setVideos(item.videos ?? []);
    setFileIds(
      item.fileIds ??
      (existingFiles?.map((f) => f.id).filter((v): v is number => typeof v === "number") ?? [])
    );
    setLocalImages([]);
    setLocalDocs([]);

    didInitRef.current = true;
  }, [seedId, item]);

  const { images: existingImagesAll, documents: existingDocsAll } = useMemo(
    () => splitFiles(existingFiles || []),
    [existingFiles]
  );
  const linkedIdSet = useMemo(() => new Set<number>(fileIds), [fileIds]);
  const existingImages = useMemo(
    () => existingImagesAll.filter((f) => !f.id || linkedIdSet.has(f.id)),
    [existingImagesAll, linkedIdSet]
  );
  const existingDocs = useMemo(
    () => existingDocsAll.filter((f) => !f.id || linkedIdSet.has(f.id)),
    [existingDocsAll, linkedIdSet]
  );

  /* ---------- 变化检测：序列化快照 ---------- */
  const projectFiles = (files: File[]) =>
    files.map((f) => `${f.name}::${f.size}::${f.lastModified}`).sort();

  const serializeState = () =>
    JSON.stringify({
      title: title.trim(),
      description: description.replace(/\s+$/, ""),
      content,
      videos: [...videos].map((v) => v.trim()).sort(),
      fileIds: [...fileIds].sort((a, b) => a - b),
      localImages: projectFiles(localImages),
      localDocs: projectFiles(localDocs),
    });

  const initialStateRef = useRef<string>("");
  useEffect(() => {
    initialStateRef.current = serializeState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, existingFiles]);

  const hasChanges = useMemo(() => {
    try {
      return serializeState() !== initialStateRef.current;
    } catch {
      return true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, content, videos, fileIds, localImages, localDocs]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!hasChanges) return;
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  /* ---------- 校验 ---------- */
  const titleLen = title.trim().length;
  const validateStep1Only = (): boolean => {
    const next: { title?: string; content?: string } = {};
    if (!title.trim()) next.title = "Title is required";
    if (titleLen > MAX_TITLE) next.title = `Title cannot exceed ${MAX_TITLE} characters.`;
    setErrors(next);
    if (next.title && titleRef.current) titleRef.current.focus();
    return Object.keys(next).length === 0;
  };

  const isStep1Valid = React.useMemo(() => {
    const t = title.trim();
    if (!t) return false;
    if (t.length > MAX_TITLE) return false;
    return true;
  }, [title]);


  const validateAll = (): boolean => {
    // 现在只需要 Step1 的校验；需要时可扩展
    return validateStep1Only();
  };

  /* ---------- 切换步骤 ---------- */
  const goNext = () => {
    if (saving || isCompressing) return;
    if (!validateStep1Only()) return;
    setStep(2);
  };
  const goBack = () => {
    if (saving || isCompressing) return;
    setStep(1);
  };

  /* ---------- 文件选择：图片（立刻清空 input，防止异步后 DOM 为 null） ---------- */
  const onPickImages: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const inputEl = e.currentTarget;
    const picked = inputEl.files ? Array.from(inputEl.files) : [];
    if (!picked.length) return;
    inputEl.value = ""; // 先清空，避免异步期间访问到 null

    setIsCompressing(true);
    setCompressTotal(picked.length);
    setCompressDone(0);

    try {
      const tooHuge = picked.filter((f) => f.size > MAX_INPUT_IMAGE_BYTES);
      if (tooHuge.length) {
        alert(
          `These images are too large (>${formatMB(MAX_INPUT_IMAGE_BYTES)} each) and were skipped:\n` +
          tooHuge.map((f) => `• ${f.name} (${formatMB(f.size)})`).join("\n")
        );
      }
      const candidates = picked.filter((f) => f.size <= MAX_INPUT_IMAGE_BYTES);

      const processed: File[] = [];
      for (const f of candidates) {
        try {
          const out = await compressImageFile(f, {
            targetBytes: TARGET_IMAGE_BYTES,
            maxLongEdge: MAX_LONG_EDGE,
            mime: "image/webp",
          });
          processed.push(out);
        } catch (err) {
          console.error("Compress failed:", err);
          processed.push(f);
        } finally {
          setCompressDone((d) => d + 1);
        }
      }

      const existing = new Map(localImages.map((f) => [`${f.name}-${f.size}`, true]));
      const deduped = processed.filter((f) => !existing.has(`${f.name}-${f.size}`));
      setLocalImages((prev) => [...prev, ...deduped]);
    } finally {
      setIsCompressing(false);
    }
  };

  /* ---------- 文件选择：文档 ---------- */
  const onPickDocs: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const inputEl = e.currentTarget;
    const picked = inputEl.files ? Array.from(inputEl.files) : [];
    if (!picked.length) return;
    inputEl.value = "";

    const tooBig = picked.filter((f) => f.size > MAX_DOC_FILE_SIZE);
    const ok = picked.filter((f) => f.size <= MAX_DOC_FILE_SIZE);

    if (tooBig.length) {
      alert(
        `These documents exceed ${MAX_DOC_MB}MB and were skipped:\n` +
        tooBig.map((f) => `• ${f.name} (${formatMB(f.size)})`).join("\n")
      );
    }

    const existing = new Map(localDocs.map((f) => [`${f.name}-${f.size}`, true]));
    const deduped = ok.filter((f) => !existing.has(`${f.name}-${f.size}`));
    setLocalDocs((prev) => [...prev, ...deduped]);
  };

  const removeLocalImage = (idx: number) =>
    setLocalImages((prev) => prev.filter((_, i) => i !== idx));
  const removeLocalDoc = (idx: number) =>
    setLocalDocs((prev) => prev.filter((_, i) => i !== idx));
  const removeFileId = (id?: number) => {
    if (typeof id !== "number") return;
    setFileIds((prev) => prev.filter((x) => x !== id));
  };

  /* ---------- 关闭/取消：保存中或压缩中禁止 ---------- */
  const handleCloseClick = () => {
    if (saving || isCompressing) return;
    if (hasChanges) {
      setAnchorEl(closeButtonRef.current);
      setPlacement("below");
      setIsConfirmOpen(true);
    } else {
      onClose();
    }
  };
  const handleCancelClick = () => {
    if (saving || isCompressing) return;
    if (hasChanges) {
      setAnchorEl(cancelButtonRef.current);
      setPlacement("above");
      setIsConfirmOpen(true);
    } else {
      onClose();
    }
  };

  /* ---------- 保存 ---------- */
  const buildCleanForm = (): FormModel => ({
    title: title.trim(),
    description: description.replace(/\s+$/, ""),
    content,
    videos,
    fileIds,
    localFiles: [...localImages, ...localDocs],
  });

  const handleSave = async () => {
    if (isCompressing) {
      alert("Images are still being compressed. Please wait a moment and try again.");
      return;
    }
    if (!validateAll()) return;
    const cleaned = buildCleanForm();
    await onSave(cleaned);
  };

  const confirmSaveAndClose = async () => {
    if (isCompressing) {
      alert("Images are still being compressed. Please wait a moment and try again.");
      return;
    }
    if (!validateAll()) return;
    const cleaned = buildCleanForm();
    try {
      await onSave(cleaned);
      initialStateRef.current = serializeState();
      setIsConfirmOpen(false);
      onClose(); // 成功才关闭
    } catch (e: any) {
      alert(typeof e === "string" ? e : e?.message || "Save failed");
    }
  };

  const confirmCloseWithoutSaving = () => {
    setIsConfirmOpen(false);
    onClose();
  };

  /* ======================= 渲染 ======================= */
  return (
    <div
      className="fixed inset-0 z-30 bg-gray bg-opacity-50 flex items-center justify-center"
      role="dialog"
      aria-busy={saving || isCompressing}
    >
      {/* 遮罩：保存/压缩中不可关闭 */}
      <div className="absolute inset-0" onClick={handleCloseClick} aria-hidden />

      <div
        className="bg-white w-[95vw] md:max-w-3xl rounded-md shadow-lg relative flex flex-col max-h-[min(90vh,800px)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="px-4 md:px-6 pt-4 pb-2 border-b border-border/70 sticky top-0 bg-white z-10">
          <button
            onClick={handleCloseClick}
            ref={closeButtonRef}
            className="absolute right-4 top-4 text-dark-gray hover:text-dark-green disabled:opacity-50"
            aria-label="Close"
            disabled={saving || isCompressing}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          <h2 className="text-xl font-medium text-center">
            {isNew ? "Create Post" : "Edit Post"}
            <div className="mt-1 h-0.5 w-12 bg-green mx-auto rounded" />
          </h2>

          {/* Stepper */}
          <div className="mt-3">
            <Stepper
              steps={[
                { id: 1, label: "Basics" },
                { id: 2, label: "Media" },
              ]}
              current={step}
              onStepClick={(id) => {
                if (saving || isCompressing) return;
                if (id === 1) setStep(1);
                if (id === 2 && isStep1Valid) setStep(2);
                if (id === 2 && !isStep1Valid) {
                  // 可选：轻提示
                  // toast.warn("Please complete the basics first");
                }
              }}
              canJumpToStep2={isStep1Valid}
              disabled={saving || isCompressing}
            />


          </div>
        </header>


        {/* Body */}
        <section className="px-4 md:px-6 py-4 overflow-y-auto flex-1">
          {step === 1 ? (
            <BasicsPanel
              title={title}
              setTitle={setTitle}
              titleLen={titleLen}
              maxTitle={MAX_TITLE}
              description={description}
              setDescription={setDescription}
              content={content}
              setContent={setContent}
              errors={errors}
              setErrors={setErrors}
              titleRef={titleRef}
              contentRef={contentRef}
              saving={saving}
              isCompressing={isCompressing}
            />
          ) : (
            <MediaPanel
              videos={videos}
              setVideos={setVideos}
              localImages={localImages}
              setLocalImages={setLocalImages}
              localDocs={localDocs}
              setLocalDocs={setLocalDocs}
              fileIds={fileIds}
              setFileIds={setFileIds}
              onPickImages={onPickImages}
              onPickDocs={onPickDocs}
              removeLocalImage={removeLocalImage}
              removeLocalDoc={removeLocalDoc}
              removeFileId={removeFileId}
              existingImages={existingImages}
              existingDocs={existingDocs}
              isCompressing={isCompressing}
              compressDone={compressDone}
              compressTotal={compressTotal}
              formatMB={formatMB}
              IMAGE_ACCEPT={IMAGE_ACCEPT}
              DOC_ACCEPT={DOC_ACCEPT}
              saving={saving}
              uploadingPercent={uploadingPercent}
            />
          )}
        </section>

        {/* Footer */}
        <footer className="flex justify-between gap-5 px-4 md:px-6 py-3 border-t border-border/70 sticky bottom-0 bg-white z-10">
          <div className="inline-flex gap-3 ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelClick}
              ref={cancelButtonRef}
              disabled={saving || isCompressing}
            >
              Cancel
            </Button>

            {step === 1 && (
              <Button variant="outline" tone="brand" onClick={goNext} disabled={saving || isCompressing || !isStep1Valid}>
                Next: Media
              </Button>
            )}

            {step === 2 && (
              <>
                <Button variant="outline" tone="brand" onClick={goBack} disabled={saving || isCompressing}>
                  Back to Basics
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  loading={saving || uploadingPercent > 0}
                  loadingText={
                    uploadingPercent > 0
                      ? `Uploading… ${Math.min(99, uploadingPercent)}%`
                      : (isNew ? "Creating…" : "Saving…")
                  }
                  disabled={isCompressing}
                >
                  {isNew ? "Create" : "Save"}
                </Button>
              </>
            )}
          </div>
        </footer>

      </div>

      {/* 关闭确认弹窗 */}
      <SaveConfirmModal
        onConfirm={confirmSaveAndClose}
        onCancel={confirmCloseWithoutSaving}
        onOutsideClick={() => setIsConfirmOpen(false)}
        isOpen={isConfirmOpen}
        anchorEl={anchorEl}
        placement={placement}
        align="end"
        offset={8}
      />
    </div>
  );
}
