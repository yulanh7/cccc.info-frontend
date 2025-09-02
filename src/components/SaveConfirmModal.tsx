"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TrashIcon, CheckIcon } from "@heroicons/react/24/outline";

type Placement = "above" | "below";
type Align = "end" | "start"; // end: 右对齐触发按钮；start: 左对齐

interface ConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  onOutsideClick: () => void;
  isOpen: boolean;
  /** 触发按钮的元素，用于定位 */
  anchorEl: HTMLElement | null;
  /** 上下方向，默认 below（下方） */
  placement?: Placement;
  /** 左右对齐方式，默认 end（右对齐） */
  align?: Align;
  /** 与触发元素的间距（像素） */
  offset?: number;
}

export default function ConfirmModal({
  onConfirm,
  onCancel,
  onOutsideClick,
  isOpen,
  anchorEl,
  placement = "below",
  align = "end",
  offset = 8,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left?: number; right?: number }>({
    top: 0,
    right: 16,
  });

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onOutsideClick();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onOutsideClick]);

  // 打开/窗口变化时，测量并定位
  useLayoutEffect(() => {
    if (!isOpen || !anchorEl || !modalRef.current) return;

    const place = () => {
      const btnRect = anchorEl.getBoundingClientRect();
      // 先渲染到看不见的位置，拿到 modal 尺寸
      const modal = modalRef.current!;
      const modalRect = modal.getBoundingClientRect();

      const top =
        placement === "above"
          ? btnRect.top - modalRect.height - offset
          : btnRect.bottom + offset;

      // 左右：按对齐方式计算
      if (align === "end") {
        const right = Math.max(8, window.innerWidth - btnRect.right); // 贴右侧
        setCoords({ top, right });
      } else {
        const left = Math.max(8, btnRect.left); // 贴左侧
        setCoords({ top, left });
      }
    };

    place();
    // 窗口改变时重算
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true); // 捕获滚动（包含内部容器）
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [isOpen, anchorEl, placement, align, offset]);

  if (!isOpen) return null;

  return (
    // 用 fixed，坐标以视口为基准，避免受父容器定位影响
    <div
      ref={modalRef}
      className="fixed bg-white p-2 rounded-sm shadow-lg z-50"
      style={{
        top: coords.top,
        ...(coords.right != null ? { right: coords.right } : {}),
        ...(coords.left != null ? { left: coords.left } : {}),
        // 先渲染再定位时避免抖动（可选）
        visibility: anchorEl ? "visible" : "hidden",
      }}
    >
      <div className="flex flex-col space-y-2">
        <button
          onClick={onCancel}
          className="flex items-center px-2 py-1 text-dark-gray text-sm hover:bg-gray-50 rounded"
        >
          <TrashIcon className="h-5 w-5 mr-2" />
          Discard
        </button>
        <button
          onClick={onConfirm}
          className="flex items-center px-2 py-1 text-dark-gray text-sm hover:bg-gray-50 rounded"
        >
          <CheckIcon className="h-5 w-5 mr-2" />
          Save & Close
        </button>
      </div>
    </div>
  );
}
