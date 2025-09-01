// Format to "dd/MM/yyyy" or "dd/MM/yyyy HH:mm" (24h)
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
  const suffix = opts.suffix ?? '…';
  if (!input) return '';
  const chars = Array.from(input); // 按“字符”而不是 code unit 计数（兼容 emoji）
  if (chars.length <= max) return input;

  if (opts.byWords) {
    // 尝试在上限附近按空格断句（对中文无空格时自动退化为字符截断）
    const slice = chars.slice(0, max + 1).join('');
    const cut = slice.lastIndexOf(' ');
    const base = cut > 0 ? slice.slice(0, cut) : chars.slice(0, max).join('');
    return base + suffix;
  }

  return chars.slice(0, max).join('') + suffix;
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

