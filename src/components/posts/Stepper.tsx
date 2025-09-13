"use client";

import React from "react";
import { CheckIcon } from "@heroicons/react/24/outline";

export type StepperProps = {
  steps: { id: number; label: string }[];
  current: number;                 // 1-based
  onStepClick?: (id: number) => void;
  canJumpToStep2?: boolean;        // 控制是否允许点第2步
  disabled?: boolean;              // saving/compressing 时禁用
};

export default function Stepper({
  steps,
  current,
  onStepClick,
  canJumpToStep2 = false,
  disabled = false,
}: StepperProps) {
  return (
    <ol className="flex items-center gap-3" role="list" aria-label="Steps">
      {steps.map((s, i) => {
        const index = i + 1;
        const isCurrent = index === current;
        const isDone = index < current;
        const isClickable =
          !disabled &&
          onStepClick &&
          (isDone || (index === 2 && canJumpToStep2)); // 允许回到已完成，或在允许时跳到第二步

        return (
          <React.Fragment key={s.id}>
            {/* 节点 */}
            <li
              role="listitem"
              aria-current={isCurrent ? "step" : undefined}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick!(index)}
                className={[
                  "h-7 w-7 rounded-full flex items-center justify-center border",
                  isCurrent
                    ? "bg-green text-white border-green"
                    : isDone
                      ? "bg-green/10 text-green border-green/30"
                      : "bg-gray-100 text-gray-600 border-gray-300",
                  isClickable ? "hover:opacity-90" : "cursor-default",
                ].join(" ")}
                aria-label={`Step ${index}: ${s.label}`}
                title={s.label}
              >
                {isDone ? <CheckIcon className="h-4 w-4" /> : index}
              </button>
              <span
                className={[
                  "text-sm",
                  isCurrent ? "text-green font-medium" : isDone ? "text-green" : "text-gray-600",
                ].join(" ")}
              >
                {s.label}
              </span>
            </li>

            {/* 连接线 */}
            {i < steps.length - 1 && (
              <div
                aria-hidden
                className={[
                  "h-px flex-1",
                  index < current ? "bg-green" : "bg-border",
                ].join(" ")}
              />
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
}
