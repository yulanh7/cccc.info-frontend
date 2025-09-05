import { uploadFile } from "@/app/features/files/uploadSlice";
import type { AppDispatch } from "@/app/features/store"; // 你的 store 类型按需改

export async function uploadAllFiles(
  files: File[],
  dispatch: AppDispatch,
  onEachProgress?: (index: number, percent: number) => void
): Promise<number[]> {
  const results = await Promise.all(
    files.map((f, i) =>
      dispatch(
        uploadFile({
          file: f,
          file_category: "attachment",
          onProgress: (p) => onEachProgress?.(i, p),
        })
      ).unwrap()
    )
  );
  return results.map((r) => r.id);
}

export function formatDate(
  input: string | number | Date,
  withTime: boolean = false
): string {
  const date = toDate(input);
  if (!date || isNaN(date.getTime())) return "";

  const base: Intl.DateTimeFormatOptions = {
    timeZone: "Australia/Sydney",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };

  if (!withTime) {
    return new Intl.DateTimeFormat("en-AU", base).format(date);
  }

  const dtf = new Intl.DateTimeFormat("en-AU", {
    ...base,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  parts.forEach((p) => {
    if (p.type !== "literal" && map[p.type] === undefined) map[p.type] = p.value;
  });

  return `${map.day}/${map.month}/${map.year} ${map.hour}:${map.minute}`;
}

// Robust string → Date (trims microseconds like .423017 to .423)
function toDate(input: string | number | Date): Date {
  if (input instanceof Date) return input;
  if (typeof input === "number") return new Date(input);
  if (typeof input === "string") {
    const s = input.trim();
    const normalized = s.replace(/(\.\d{3})\d+/, "$1");
    return new Date(normalized);
  }
  return new Date(NaN);
}

// Keep your existing helper unchanged
export function getYouTubeThumbnail(
  url: string,
  quality: "default" | "mqdefault" | "hqdefault" | "maxresdefault" = "hqdefault"
) {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  const videoId = match?.[1];
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

export function ellipsize(
  input: string | null | undefined,
  max = 80,
  opts: { byWords?: boolean; suffix?: string } = {}
): string {
  const suffix = opts.suffix ?? "…";
  if (!input) return "";

  const chars = Array.from(input); // 支持 emoji

  // 计算“宽度”累积，中文=2，英文=1
  let width = 0;
  let cutIndex = chars.length;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    // 判断是否全角（大致判断：非 ASCII）
    const isWide = /[^\x00-\x7F]/.test(ch);
    width += isWide ? 2 : 1;

    if (width > max) {
      cutIndex = i;
      break;
    }
  }

  if (cutIndex >= chars.length) {
    return input; // 没超长
  }

  if (opts.byWords) {
    // 在 cutIndex 附近找最后的空格
    const slice = chars.slice(0, cutIndex + 1).join("");
    const lastSpace = slice.lastIndexOf(" ");
    if (lastSpace > 0) {
      return slice.slice(0, lastSpace) + suffix;
    }
  }

  return chars.slice(0, cutIndex).join("") + suffix;
}


export const mapApiErrorToFields = (msg?: string) => {
  const lower = (msg || "").toLowerCase();
  const next: { title?: string; description?: string } = {};
  if (lower.includes("name") && lower.includes("exceed")) {
    const m = lower.match(/(\d+)\s*characters?/);
    next.title = m ? `Group name cannot exceed ${m[1]} characters.` : "Group name is too long.";
  }
  if (lower.includes("description") && lower.includes("exceed")) {
    const m = lower.match(/(\d+)\s*characters?/);
    next.description = m ? `Group description cannot exceed ${m[1]} characters.` : "Group description is too long.";
  }
  return next;
};

