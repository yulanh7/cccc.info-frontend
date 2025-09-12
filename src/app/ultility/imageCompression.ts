// src/app/utility/imageCompression.ts
export type CompressOptions = {
  /** 目标最大字节数，默认 700KB */
  targetBytes?: number;
  /** 最长边限制，默认 1920px（移动端拍照通常4000+，需要缩） */
  maxLongEdge?: number;
  /** 输出 MIME，优先 webp，不支持则 jpeg */
  mime?: "image/webp" | "image/jpeg";
  /** 品质初始值（0-1），默认 0.82 */
  quality?: number;
  /** 品质下限（0-1），默认 0.5 */
  minQuality?: number;
  /** 尝试的最大迭代次数，默认 6 次 */
  maxAttempts?: number;
};

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), type, quality)
  );

async function decodeImage(file: File): Promise<{ bitmap: ImageBitmap; type: string; }> {
  // 优先 createImageBitmap（更快），不支持就用 <img>
  if ("createImageBitmap" in window) {
    const bitmap = await createImageBitmap(file);
    return { bitmap, type: file.type };
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const bitmap = await createImageBitmap(canvas);
    return { bitmap, type: file.type };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function pickOutputMime(preferred?: "image/webp" | "image/jpeg"): "image/webp" | "image/jpeg" {
  // 大部分现代浏览器都支持 webp；保险起见留个兜底
  return preferred ?? ("image/webp" as const);
}

export async function compressImageFile(
  file: File,
  opts: CompressOptions = {}
): Promise<File> {
  // 动图 GIF：不要用 canvas 处理（会丢帧），这里直接原样返回，或让后端再转码（可换成 mp4/webm）
  if (file.type === "image/gif") return file;

  const {
    targetBytes = 700 * 1024,
    maxLongEdge = 1920,
    mime = pickOutputMime(),
    quality = 0.82,
    minQuality = 0.5,
    maxAttempts = 6,
  } = opts;

  // 已经很小就直接过
  if (file.size <= targetBytes) return file;

  const { bitmap } = await decodeImage(file);
  try {
    const origW = bitmap.width;
    const origH = bitmap.height;
    const longEdge = Math.max(origW, origH);
    let scale = Math.min(1, maxLongEdge / longEdge); // 超过 maxLongEdge 就缩
    let q = quality;

    let outBlob: Blob | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const w = Math.max(1, Math.round(origW * scale));
      const h = Math.max(1, Math.round(origH * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { alpha: true })!;
      // 提升缩放质量（部分浏览器支持）
      (ctx as any).imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, 0, 0, w, h);

      outBlob = await canvasToBlob(canvas, mime, q);
      if (outBlob.size <= targetBytes) break;

      // 先降质量到下限，再继续缩尺寸
      if (q > minQuality) {
        q = Math.max(minQuality, q - 0.12);
      } else {
        // 尺寸每次再小 15%
        scale = scale * 0.85;
      }
    }

    if (!outBlob) return file;

    // 如果仍大于 targetBytes 且 webp 失败（个别透明 PNG 情况），尝试换 JPEG 再来一次
    if (outBlob.size > targetBytes && mime === "image/webp") {
      return await compressImageFile(file, {
        ...opts,
        mime: "image/jpeg",
      });
    }

    // 生成新文件名
    const ext = mime === "image/webp" ? "webp" : "jpg";
    const base = file.name.replace(/\.[^.]+$/, "");
    const newName = `${base}-compressed.${ext}`;
    return new File([outBlob], newName, { type: mime, lastModified: Date.now() });
  } finally {
    bitmap.close();
  }
}
