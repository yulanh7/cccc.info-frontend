"use client";

import React, { useMemo, useRef, useState } from "react";

type Props = {
  videos: string[];
  className?: string;
  iframeClassName?: string; // e.g. "w-full h-[200px] md:h-[400px] rounded-sm"
};

function extractYouTubeId(url: string): string | null {
  try {
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && id.length === 11 ? id : null;
    }
    if (u.searchParams.has("v")) {
      const id = u.searchParams.get("v")!;
      return id && id.length === 11 ? id : null;
    }
    if (u.pathname.includes("/embed/")) {
      const id = u.pathname.split("/embed/")[1]?.split("/")[0];
      return id && id.length === 11 ? id : null;
    }
    return null;
  } catch {
    return null;
  }
}

export default function YouTubeList({
  videos,
  className,
  iframeClassName = "w-full h-[200px] md:h-[400px] rounded-sm",
}: Props) {


  const videoIds = useMemo(
    () => videos.map(extractYouTubeId).filter((x): x is string => !!x),
    [videos]
  );

  // 保存所有 iframe 的引用
  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const origin =
    typeof window !== "undefined" ? encodeURIComponent(window.location.origin) : "";

  const pauseAll = () => {
    iframeRefs.current.forEach((el) => {
      try {
        el?.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
          "*"
        );
      } catch { }
    });
  };

  const playAt = (i: number) => {
    const el = iframeRefs.current[i];
    try {
      el?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "playVideo", args: [] }),
        "*"
      );
    } catch { }
  };

  const handleActivate = (i: number) => {
    // 先暂停全部，再播放当前
    pauseAll();
    playAt(i);
    setActiveIndex(i);
  };

  // 列数
  let videoCols = "grid-cols-1";
  if (videoIds.length === 2) videoCols = "grid-cols-1 md:grid-cols-2";
  if (videoIds.length > 2) videoCols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`${className ?? ""} grid ${videoCols} gap-4`}>
      {videoIds.map((id, i) => {
        const src = `https://www.youtube.com/embed/${id}?enablejsapi=1&origin=${origin}&rel=0&modestbranding=1&playsinline=1`;

        return (
          <div key={id} className="relative">
            {/* 透明覆盖层：捕获点击，触发“互斥播放” */}
            <button
              type="button"
              aria-label="Play this video"
              onClick={() => handleActivate(i)}
              className={`absolute inset-0 z-10 ${activeIndex === i ? "hidden" : "block"} bg-transparent`}
            />
            <iframe
              // ✅ 用块体，且不返回值（返回 void）
              ref={(el) => { iframeRefs.current[i] = el; }}
              className={iframeClassName}
              src={src}
              title={`YouTube video ${id}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        );
      })}
    </div>
  );
}
