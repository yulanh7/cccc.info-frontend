"use client";

import React, { useMemo, useRef, useState } from "react";

type Props = {
  videos: string[];                 // 可以是完整URL或11位ID
  className?: string;
  iframeClassName?: string;         // e.g. "w-full h-[200px] md:h-[400px] rounded-sm"
  useNoCookie?: boolean;            // 需要用 youtube-nocookie 时置 true
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
  useNoCookie = false,
}: Props) {
  const videoIds = useMemo(
    () => videos.map(extractYouTubeId).filter((x): x is string => !!x),
    [videos]
  );

  // 保存所有 iframe 的引用
  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // 当前页面的 origin（会自动是 http://172.238.14.96 或 http://localhost:3000 或以后你的域名）
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

  // 自适应列数
  let videoCols = "grid-cols-1";
  if (videoIds.length === 2) videoCols = "grid-cols-1 md:grid-cols-2";
  if (videoIds.length > 2) videoCols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`${className ?? ""} grid ${videoCols} gap-4`}>
      {videoIds.map((id, i) => {
        // 用 URL API 构建 src，避免手写拼接错误
        const base = useNoCookie
          ? `https://www.youtube-nocookie.com/embed/${id}`
          : `https://www.youtube.com/embed/${id}`;
        const url = new URL(base);
        url.searchParams.set("enablejsapi", "1");     // 必须，允许 JS 控制
        url.searchParams.set("origin", pageOrigin);    // 必须，且要与页面完全一致（含端口）
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
              title={`YouTube video ${id}`}
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
