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
