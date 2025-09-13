// ✅ utils/uploadAllFiles.ts
import { uploadFile } from "@/app/features/files/uploadSlice";
import type { AppDispatch } from "@/app/features/store";

type UploadResult =
  | { ok: true; id: number }
  | { ok: false; error: string; name: string; index: number };

export async function uploadAllFiles(
  files: File[],
  dispatch: AppDispatch,
  onEachProgress?: (index: number, percent: number) => void,
  concurrency = 2 // 小并发，稳一点；也可以写成 1 代表顺序
): Promise<{ successIds: number[]; failures: Array<{ index: number; name: string; error: string }> }> {
  if (!files?.length) return { successIds: [], failures: [] };

  // 简易限流执行器
  const queue = files.map((file, index) => async (): Promise<UploadResult> => {
    try {
      const res = await dispatch(
        uploadFile({
          file,
          file_category: "attachment",
          onProgress: (p: number) => onEachProgress?.(index, p),
        })
      ).unwrap();
      return { ok: true, id: res.id };
    } catch (e: any) {
      const msg = typeof e === "string" ? e : e?.message || "Upload failed";
      return { ok: false, error: msg, name: file.name, index };
    }
  });

  const results: UploadResult[] = [];
  let cursor = 0;

  async function runOne() {
    if (cursor >= queue.length) return;
    const i = cursor++;
    const r = await queue[i]();
    results[i] = r;
    await runOne();
  }

  // 启动 N 个“工人”
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, runOne);
  await Promise.all(workers);

  const successIds = results.filter((r): r is { ok: true; id: number } => r?.ok === true).map((r) => r.id);
  const failures = results
    .filter((r): r is { ok: false; error: string; name: string; index: number } => r?.ok === false)
    .map(({ index, name, error }) => ({ index, name, error }));

  return { successIds, failures };
}
