"use client";

import React from "react";

type BasicsPanelProps = {
  title: string;
  setTitle: (v: string) => void;
  titleLen: number;
  maxTitle: number;
  description: string;
  setDescription: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  errors: { title?: string; content?: string };
  setErrors: (e: { title?: string; content?: string }) => void;
  titleRef?: React.RefObject<HTMLInputElement> | React.MutableRefObject<HTMLInputElement | null>;
  contentRef?: React.RefObject<HTMLTextAreaElement> | React.MutableRefObject<HTMLTextAreaElement | null>;
  saving: boolean;
  isCompressing: boolean;
};

export default function BasicsPanel({
  title,
  setTitle,
  titleLen,
  maxTitle,
  description,
  setDescription,
  content,
  setContent,
  errors,
  titleRef,
  contentRef,
  saving,
  isCompressing,
}: BasicsPanelProps) {
  return (
    <>
      {/* 标题 */}
      <label htmlFor="post-title" className="block text-sm font-medium mb-1 text-gray-900">
        Title <span className="text-red-500">*</span>
      </label>
      <input
        id="post-title"
        ref={titleRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={`w-full p-2 mb-1 border rounded-sm ${errors.title ? "border-red-500" : "border-border"}`}
        placeholder="Enter a short, descriptive title"
        maxLength={maxTitle + 100}
        disabled={saving || isCompressing}
      />
      <div className={`text-xs mb-2 ${titleLen > maxTitle ? "text-red-600" : "text-dark-gray"}`}>
        {titleLen}/{maxTitle}
        {titleLen > maxTitle ? " — over limit" : ""}
      </div>
      {errors.title && <p className="text-red-600 text-sm mb-3">{errors.title}</p>}


      {/* 正文 */}
      <label htmlFor="post-content" className="block text-gray-900 text-sm font-medium mb-1">
        Content
      </label>
      <textarea
        id="post-content"
        ref={contentRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className={`w-full p-2 mb-1 border text-gray-600 rounded-sm ${errors.content ? "border-red-500" : "border-border"}`}
        rows={10}
        placeholder="Write your content here. Line breaks will be preserved."
        disabled={saving || isCompressing}
      />
      {errors.content && <p className="text-red-600 text-sm mb-3">{errors.content}</p>}
    </>
  );
}
