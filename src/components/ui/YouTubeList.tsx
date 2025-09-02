"use client";

import React, { useEffect, useMemo, useRef } from "react";

type Props = {
  /** 支持完整 YouTube URL；会自动提取 videoId */
  videos: string[];
  /** 可选：外层容器的 className */
  className?: string;
  /** 可选：iframe 的 className（默认：w-full h-[200px] md:h-[400px] rounded-sm） */
  iframeClassName?: string;
};

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    __ytApiReadyPromise?: Promise<void>;
    __ytApiReadyResolver?: () => void;
  }
}

/** 解析各种常见的 YouTube 链接，返回 videoId；失败则返回 null */
function extractYouTubeId(url: string): string | null {
  try {
    // 处理可能传入的已是 ID 的情况
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

    const u = new URL(url);
    // youtu.be/<id>
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && id.length === 11 ? id : null;
    }

    // youtube.com/watch?v=<id>
    if (u.searchParams.has("v")) {
      const id = u.searchParams.get("v")!;
      return id && id.length === 11 ? id : null;
    }

    // youtube.com/embed/<id>
    if (u.pathname.includes("/embed/")) {
      const id = u.pathname.split("/embed/")[1]?.split("/")[0];
      return id && id.length === 11 ? id : null;
    }

    return null;
  } catch {
    return null;
  }
}

/** 只加载一次 IFrame API，并返回一个 ready 的 Promise */
function loadYouTubeIframeAPI(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve(); // SSR 安全

  if (window.YT && window.YT.Player) {
    return Promise.resolve();
  }

  if (!window.__ytApiReadyPromise) {
    window.__ytApiReadyPromise = new Promise<void>((resolve) => {
      window.__ytApiReadyResolver = resolve;

      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);

      window.onYouTubeIframeAPIReady = () => {
        window.__ytApiReadyResolver?.();
      };
    });
  }

  return window.__ytApiReadyPromise!;
}

export default function YouTubeList({
  videos,
  className,
  iframeClassName = "w-full h-[200px] md:h-[400px] rounded-sm",
}: Props) {
  // 1) 规范化为 videoId 数组（过滤无效链接）
  const videoIds = useMemo(
    () => videos.map(extractYouTubeId).filter((id): id is string => !!id),
    [videos]
  );

  // 2) 保存所有 player 实例
  const playersRef = useRef<any[]>([]);
  const uidRef = useRef(() => Math.random().toString(36).slice(2)); // 保证本组件实例唯一 id
  const uid = uidRef.current();

  // 3) 创建/销毁 Player，并设置“单实例播放”逻辑
  useEffect(() => {
    let isCancelled = false;

    async function setup() {
      await loadYouTubeIframeAPI();
      if (isCancelled) return;

      const origin =
        typeof window !== "undefined" ? encodeURIComponent(window.location.origin) : "";

      // 为每个 videoId 创建/更新一个 Player
      videoIds.forEach((id, i) => {
        const elementId = `yt-player-${uid}-${i}`;

        // 避免重复创建：如果已存在先销毁
        if (playersRef.current[i]?.destroy) {
          try {
            playersRef.current[i].destroy();
          } catch { }
        }

        playersRef.current[i] = new window.YT.Player(elementId, {
          videoId: id,
          playerVars: {
            // 关键：允许 JS 控制
            enablejsapi: 1,
            // 体验相关
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            origin: origin,
          },
          events: {
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                // 当前开始播放，暂停其他
                playersRef.current.forEach((p, j) => {
                  if (j !== i) {
                    try {
                      p.pauseVideo();
                    } catch { }
                  }
                });
              }
            },
          },
        });
      });
    }

    setup();

    // 清理：组件卸载或依赖变化时，销毁所有实例
    return () => {
      isCancelled = true;
      playersRef.current.forEach((p) => {
        try {
          p?.destroy?.();
        } catch { }
      });
      playersRef.current = [];
    };
  }, [videoIds, uid]);

  let videoCols = "grid-cols-1 md:grid-cols-1 lg:grid-cols-1"

  if (videoIds.length === 2) {
    videoCols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
  }
  if (videoIds.length > 2) {
    videoCols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
  }
  return (
    <div className={`${className} grid ${videoCols} gap-4 `}>
      {videoIds.map((_, i) => (
        <div key={`${uid}-${i}`} className="mb-4">
          <div
            id={`yt-player-${uid}-${i}`}
            className={iframeClassName}
          // 让容器本身占位，避免闪动
          />
        </div>
      ))}
    </div>
  );
}
