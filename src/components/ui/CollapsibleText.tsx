"use client";
import React from "react";
import clsx from "clsx";

export type CollapsibleTextProps = {
  text: string;
  mobileChars?: number;      // 小屏截断
  desktopChars?: number;     // 大屏截断
  className?: string;        // 外层样式
  preserveNewlines?: boolean;// 默认保留换行
};

export default function CollapsibleText({
  text,
  mobileChars = 200,
  desktopChars = 320,
  className,
  preserveNewlines = true,
}: CollapsibleTextProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [maxChars, setMaxChars] = React.useState(desktopChars);

  // 根据屏幕宽度设置阈值
  React.useEffect(() => {
    const compute = () => setMaxChars(window.innerWidth < 768 ? mobileChars : desktopChars);
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [mobileChars, desktopChars]);

  const isLong = text.length > maxChars;
  const shown = expanded || !isLong ? text : text.slice(0, maxChars);

  return (
    <div
      className={clsx(
        "cursor-pointer",
        preserveNewlines ? "whitespace-pre-wrap" : "whitespace-normal",
        className
      )}
      onClick={() => {
        // 点击正文切换收起/展开
        if (expanded) setExpanded(false);
      }}
    >
      {shown}
      {isLong && !expanded && (
        <>
          {"… "}
          <button
            type="button"
            className="text-dark-green underline text-xs"
            onClick={(e) => {
              e.stopPropagation(); // 防止立刻收起
              setExpanded(true);
            }}
            aria-expanded={expanded}
          >
            See more
          </button>
        </>
      )}
    </div>
  );
}
