"use client";

import React, { useMemo, useRef, useState } from "react";

type Props = {
  videos: string[];                 // 可以是完整URL或11位ID
  className?: string;
  iframeClassName?: string;         // e.g. "w-full h-[200px] md:h-[400px] rounded-sm"
  useNoCookie?: boolean;            // 需要用 youtube-nocookie 时置 true
};

function extractYouTubeId(input: string): string | null {
  try {
    // 1) 已经是 11 位 ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;

    const u = new URL(input);

    // 2) youtu.be 短链
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && id.length === 11 ? id : null;
    }

    // 3) 标准 watch
    if (u.searchParams.has("v")) {
      const id = u.searchParams.get("v")!;
      return id && id.length === 11 ? id : null;
    }

    // 4) /embed/<id>
    if (u.pathname.includes("/embed/")) {
      const id = u.pathname.split("/embed/")[1]?.split(/[/?#]/)[0];
      return id && id.length === 11 ? id : null;
    }

    // 5) /live/<id>
    if (u.pathname.includes("/live/")) {
      const id = u.pathname.split("/live/")[1]?.split(/[/?#]/)[0];
      return id && id.length === 11 ? id : null;
    }

    // 6) /shorts/<id>
    if (u.pathname.includes("/shorts/")) {
      const id = u.pathname.split("/shorts/")[1]?.split(/[/?#]/)[0];
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
  useNoCookie = false,
}: Props) {
  // 同时保留原始输入和解析结果，便于对错误项给出提示
  const parsedVideos = useMemo(
    () =>
      videos.map((v) => ({
        raw: v,
        id: extractYouTubeId(v),
      })),
    [videos]
  );

  // 保存所有 iframe 的引用（与 parsedVideos 的索引对齐）
  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // 当前页面的 origin（会自动是 http://localhost:3000 或你的域名）
  const pageOrigin = typeof window !== "undefined" ? window.location.origin : "";

  // YouTube 的目标源（决定 postMessage 的 targetOrigin）
  const YT_ORIGIN = useNoCookie
    ? "https://www.youtube-nocookie.com"
    : "https://www.youtube.com";

  // 给 iframe 发送命令
  const sendCommand = (el: HTMLIFrameElement | null, func: "playVideo" | "pauseVideo") => {
    if (!el) return;
    // 只发送消息，不去读取 iframe 的任何属性，避免同源策略报错
    el.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args: [] }),
      YT_ORIGIN // 🔒 指定明确的 targetOrigin，而不是 '*'
    );
  };

  const pauseAll = () => {
    iframeRefs.current.forEach((el) => sendCommand(el, "pauseVideo"));
  };

  const playAt = (i: number) => {
    sendCommand(iframeRefs.current[i], "playVideo");
  };

  const handleActivate = (i: number) => {
    pauseAll();
    playAt(i);
    setActiveIndex(i);
  };

  // 自适应列数（按传入数量来排）
  let videoCols = "grid-cols-1";
  if (parsedVideos.length === 2) videoCols = "grid-cols-1 md:grid-cols-2";
  if (parsedVideos.length > 2) videoCols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`${className ?? ""} grid ${videoCols} gap-4`}>
      {parsedVideos.map((item, i) => {
        if (!item.id) {
          // ❌ 解析失败：给出提示卡片
          return (
            <div
              key={i}
              className="flex items-center justify-center rounded-sm bg-gray-100 text-red-500 p-4 text-sm"
              title={typeof item.raw === "string" ? item.raw : "Invalid YouTube URL"}
            >
              Unable to parse link: {String(item.raw)}
            </div>
          );
        }

        // ✅ 正常渲染 iframe
        const base = useNoCookie
          ? `https://www.youtube-nocookie.com/embed/${item.id}`
          : `https://www.youtube.com/embed/${item.id}`;
        const url = new URL(base);
        url.searchParams.set("enablejsapi", "1");     // 必须，允许 JS 控制
        url.searchParams.set("origin", pageOrigin);   // 必须，且要与页面完全一致（含端口）
        url.searchParams.set("rel", "0");
        url.searchParams.set("modestbranding", "1");
        url.searchParams.set("playsinline", "1");

        return (
          <div key={i} className="relative">
            {/* 透明覆盖层：捕获点击，触发“互斥播放” */}
            <button
              type="button"
              aria-label="Play this video"
              onClick={() => handleActivate(i)}
              className={`absolute inset-0 z-10 ${activeIndex === i ? "hidden" : "block"} bg-transparent`}
            />
            <iframe
              ref={(el) => { iframeRefs.current[i] = el; }}
              className={iframeClassName}
              src={url.toString()}
              title={`YouTube video ${item.id}`}
              // 允许自动播放（因有用户点击，一般可行），以及其他常见权限
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              // 遵循更严格的跨站引用策略
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        );
      })}
    </div>
  );
}
