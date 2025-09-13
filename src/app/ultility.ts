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

export function getYouTubeThumbnail(
  url: string,
  quality: "default" | "mqdefault" | "hqdefault" | "maxresdefault" = "hqdefault"
) {
  // 1) 如果直接传 11 位 ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return `https://img.youtube.com/vi/${url}/${quality}.jpg`;
  }

  // 2) 先尝试用 URL 解析器拿 ID（更稳健，能容忍 ?si= 等多余参数）
  let id: string | null = null;
  try {
    const u = new URL(url);

    // youtu.be/<id>
    if (u.hostname.includes("youtu.be")) {
      const maybe = u.pathname.split("/").filter(Boolean)[0];
      if (maybe && maybe.length === 11) id = maybe;
    }

    // ?v=<id>
    if (!id && u.searchParams.has("v")) {
      const maybe = u.searchParams.get("v")!;
      if (maybe && maybe.length === 11) id = maybe;
    }

    // /embed/<id>
    if (!id && u.pathname.includes("/embed/")) {
      const maybe = u.pathname.split("/embed/")[1]?.split(/[/?#]/)[0];
      if (maybe && maybe.length === 11) id = maybe;
    }

    // /live/<id>
    if (!id && u.pathname.includes("/live/")) {
      const maybe = u.pathname.split("/live/")[1]?.split(/[/?#]/)[0];
      if (maybe && maybe.length === 11) id = maybe;
    }

    // /shorts/<id>
    if (!id && u.pathname.includes("/shorts/")) {
      const maybe = u.pathname.split("/shorts/")[1]?.split(/[/?#]/)[0];
      if (maybe && maybe.length === 11) id = maybe;
    }
  } catch {
    // 忽略，回退到正则
  }

  // 3) 兜底：用一个覆盖更全的正则（含 live/ 与 shorts/）
  if (!id) {
    const match = url.match(
      /(?:youtube\.com\/(?:(?:watch\?[^#?]*?v=)|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    id = match?.[1] ?? null;
  }

  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/${quality}.jpg`;
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

