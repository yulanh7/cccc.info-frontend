"use client";

import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import {
  fetchPostRootComments,
  fetchChildComments,
  createComment,
  replyToComment,
  deleteComment,
  selectRootCommentsFeed,
  selectChildCommentsFeed,
} from "@/app/features/posts/commentsSlice";
import type { CommentItemApi } from "@/app/types/comments";
import { ellipsize } from "@/app/ultility";
import {
  TrashIcon,
  ArrowUturnLeftIcon,
  HandThumbUpIcon as HandThumbUpOutline,
  ChatBubbleLeftIcon
} from "@heroicons/react/24/outline";
import { HandThumbUpIcon as HandThumbUpSolid } from "@heroicons/react/24/solid";
import { MAX_COMMENT_LEN } from '@/app/constants';
import CollapsibleText from "@/components/ui/CollapsibleText";


/* ======================= Props ======================= */
type Props = {
  postId: number;
  postAuthorId: number;
  currentUserId?: number | null;
  perPage?: number;

  /** UI-only: like UI passed from parent */
  likeCount?: number;
  liked?: boolean;
  likeBusy?: boolean;
  onToggleLike?: () => void;
};

/* ======================= Main Component ======================= */
export default function CommentsSection({
  postId,
  postAuthorId,
  currentUserId,
  perPage = 10,
  likeCount = 0,
  liked = false,
  likeBusy = false,
  onToggleLike,
}: Props) {
  const dispatch = useAppDispatch();

  // 根评论
  const rootFeed = useAppSelector((s) => selectRootCommentsFeed(s, postId));
  const { items: rootComments, pagination: rootPg, status: rootStatus } = rootFeed;

  // 回复/输入状态（逻辑保持不变）
  const [inputValue, setInputValue] = useState("");
  const [replyTo, setReplyTo] = useState<null | { commentId: number; nickname: string }>(null);
  const isReplying = !!replyTo;

  // 控制底部 Composer 是否打开（仅 UI）
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerAutoFocus, setComposerAutoFocus] = useState(false);
  const openComposer = (focus = true) => {
    setComposerOpen(true);
    setComposerAutoFocus(!!focus);
  };
  const closeComposer = () => {
    setComposerOpen(false);
    setComposerAutoFocus(false);
  };

  useEffect(() => {
    dispatch(fetchPostRootComments({ postId, page: 1, per_page: perPage }));
  }, [dispatch, postId, perPage]);

  const onSend = async () => {
    const body = inputValue.trim();
    if (!body) return;

    try {
      if (isReplying && replyTo) {
        await dispatch(replyToComment({ commentId: replyTo.commentId, body })).unwrap();
      } else {
        await dispatch(createComment({ postId, body })).unwrap();
      }
      // 清空
      setInputValue("");
      setReplyTo(null);
    } catch (e: any) {
      alert(e?.message || "Send comment failed");
    }
  };

  const onCancel = () => {
    setInputValue("");
    setReplyTo(null);
  };

  const loadMoreRoots = () => {
    const next = rootPg.current_page + 1;
    if (next <= rootPg.total_pages) {
      dispatch(fetchPostRootComments({ postId, page: next, per_page: perPage, append: true }));
    }
  };



  return (
    <>
      {/* 主体内容：加厚底部内边距，避免被底部条遮挡 */}
      <div className="mt-8 md:mt-10 pb-36 px-2 pt-6 border-t-1 border-border">
        {/* 标题（评论总数） */}
        <p className="font-semibold text-dark-gray mb-3 flex items-center gap-2">
          <span className="text-gray font-normal">{rootPg?.total_comments ?? 0}</span>
          Comment(s)
        </p>

        {/* 根评论列表 */}
        <ul className="space-y-4">
          {rootStatus === "loading" && rootComments.length === 0 && (
            <li className="text-sm text-gray-500">Loading comments…</li>
          )}

          {rootComments.map((c: CommentItemApi) => (
            <li key={c.id}>
              <CommentItem
                c={c}
                postAuthorId={postAuthorId}
                currentUserId={currentUserId}
                onReply={(target) => {
                  setReplyTo(target);
                  openComposer(true); // 点“Reply”时自动展开底部 Composer
                }}
                onDelete={async (commentId, parentId) => {
                  try {
                    await dispatch(deleteComment({ commentId, parent_id: parentId })).unwrap();
                  } catch (e: any) {
                    alert(e?.message || "Delete comment failed");
                  }
                }}
                fetchChildren={(parentId, page) =>
                  dispatch(fetchChildComments({ postId, parentId, page, per_page: perPage }))
                }
                selectChildren={(state, parentId) => selectChildCommentsFeed(state as any, parentId)}
              />
            </li>
          ))}
        </ul>

        {/* 加载更多根评论 */}
        {rootPg?.current_page < rootPg?.total_pages && (
          <div className="mt-4">
            <button
              className="text-sm rounded-full border border-border bg-white px-3 py-1 shadow-sm hover:bg-gray-50"
              onClick={loadMoreRoots}
            >
              Load more
            </button>
          </div>
        )}
      </div>

      {/* === 底部固定紧凑栏：假输入 + Like（始终存在）；被真正的 Composer 覆盖 === */}
      <div
        className="
          fixed left-0 right-0 md:bottom-0 bottom-[66px] z-10
          border-t border-border
          bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70
        "
        aria-hidden={composerOpen}
      >
        <div className="mx-auto max-w-4xl px-3 py-2">
          <div className="flex items-center gap-2">
            {/* 只负责触发底部 Composer 的“假输入框” */}
            <input
              className="flex-1 rounded-full border border-border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-dark-green/30"
              placeholder="Write a comment…"
              readOnly
              onFocus={() => openComposer(true)}
              onClick={() => openComposer(true)}
            />

            {onToggleLike && (
              <button
                onClick={onToggleLike}
                disabled={likeBusy}
                aria-pressed={liked}
                aria-label={liked ? "Unlike" : "Like"}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1 text-sm shadow-sm hover:bg-gray-50 disabled:opacity-60"
                title={liked ? "Unlike" : "Like"}
              >
                {liked ? (
                  <HandThumbUpSolid className="h-4 w-4 text-red" />
                ) : (
                  <HandThumbUpOutline className="h-4 w-4" />
                )}
                <span>{likeCount}</span>
              </button>
            )}
            <div
              className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1 text-sm shadow-sm"
              aria-label={`Comments: ${rootPg?.total_comments ?? 0}`}
              title="Comments"
            >
              <ChatBubbleLeftIcon className="h-4 w-4" />
              <span>{rootPg?.total_comments ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* === 真正的底部 Composer：更高 z-index 以覆盖紧凑栏 === */}
      {(composerOpen || !!replyTo?.nickname) && (
        <CommentComposer
          value={inputValue}
          onChange={setInputValue}
          onSend={async () => {
            if (!inputValue.trim()) return;
            await onSend();           // 你的原逻辑（会创建/回复 + 清空 input）
            closeComposer();          // 发送成功后关闭
          }}
          onCancel={() => {
            onCancel();               // 清空输入与回复状态
            closeComposer();          // 取消后关闭
          }}
          replyingToName={replyTo?.nickname || null}
          autoFocus={composerAutoFocus}
          onRequestClose={() => {     // 点击外部或 ESC 时关闭
            onCancel();
            closeComposer();
          }}
        />
      )}

    </>
  );
}

/* ======================= 子组件：单条评论（含子评论） ======================= */

type ItemProps = {
  c: CommentItemApi;
  postAuthorId: number;
  currentUserId?: number | null;
  onReply: (t: { commentId: number; nickname: string }) => void;
  onDelete: (commentId: number, parentId: number | null) => void;
  fetchChildren: (parentId: number, page: number) => any;
  selectChildren: (state: unknown, parentId: number) => {
    items: CommentItemApi[];
    pagination: { current_page: number; total_pages: number; total_comments: number };
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
  };
};

function CommentItem({
  c,
  postAuthorId,
  currentUserId,
  onReply,
  onDelete,
  fetchChildren,
  selectChildren,
}: ItemProps) {
  const dispatch = useAppDispatch();
  const childrenFeed = useAppSelector((s) => selectChildren(s, c.id));
  const { items: children, pagination: pg, status } = childrenFeed;

  // 首次展开时拉取子评论（逻辑不变）
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (expanded && status === "idle") {
      fetchChildren(c.id, 1);
    }
  }, [expanded, status, dispatch, c.id, fetchChildren]);

  const isMine = currentUserId != null && Number(currentUserId) === Number(c.user.id);
  const isAuthor = Number(c.user.id) === Number(postAuthorId);

  const loadMoreChildren = () => {
    const next = pg.current_page + 1;
    if (next <= pg.total_pages) {
      fetchChildren(c.id, next);
    }
  };

  return (
    <div className="group">
      {/* 头部：头像首字母 + 名称 + author */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-7 w-7 flex items-center justify-center rounded-full bg-dark-green/10 text-dark-green font-semibold">
          {(c.user.firstName?.[0] || "?").toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {ellipsize(c.user.firstName, 10, { byWords: true })}
            </span>
            {isAuthor && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                author
              </span>
            )}
          </div>

          <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">
            <CollapsibleText
              text={c.body}
              mobileChars={180}
              desktopChars={300}
              className="text-sm text-gray-800"
            />
          </div>

          {/* 操作行：回复 / 删除（自己的评论才显示删除） */}
          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
            <button
              className="inline-flex items-center gap-1 hover:text-dark-green"
              onClick={() => onReply({ commentId: c.id, nickname: c.user.firstName || "User" })}
              title="Reply"
            >
              <ArrowUturnLeftIcon className="h-4 w-4" />
              Reply
            </button>

            {isMine && (
              <button
                className="inline-flex items-center gap-1 hover:text-red-600"
                onClick={() => onDelete(c.id, c.parent_id)}
                title="Delete"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            )}
          </div>

          {/* 子评论触发器 */}
          {c.children_count > 0 && !expanded && (
            <button
              className="mt-2 text-xs text-dark-green hover:underline"
              onClick={() => setExpanded(true)}
            >
              View {c.children_count} {c.children_count > 1 ? "replies" : "reply"}
            </button>
          )}

          {/* 子评论区域 */}
          {expanded && (
            <div className="mt-3 pl-2">
              {status === "loading" && children.length === 0 && (
                <div className="text-xs text-gray-500">Loading replies…</div>
              )}

              <ul className="space-y-3">
                {children.map((child) => (
                  <li key={child.id}>
                    <ChildCommentItem
                      c={child}
                      postAuthorId={postAuthorId}
                      currentUserId={currentUserId}
                      onReply={onReply}
                      onDelete={onDelete}
                    />
                  </li>
                ))}
              </ul>

              {pg.current_page < pg.total_pages && (
                <div className="mt-2">
                  <button
                    className="text-xs rounded-full border border-border bg-white px-2.5 py-1 shadow-sm hover:bg-gray-50"
                    onClick={loadMoreChildren}
                  >
                    Load more replies
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============== 子组件：子评论条目（缩进展示） ============== */

function ChildCommentItem({
  c,
  postAuthorId,
  currentUserId,
  onReply,
  onDelete,
}: {
  c: CommentItemApi;
  postAuthorId: number;
  currentUserId?: number | null;
  onReply: (t: { commentId: number; nickname: string }) => void;
  onDelete: (commentId: number, parentId: number | null) => void;
}) {
  const isMine = currentUserId != null && Number(currentUserId) === Number(c.user.id);
  const isAuthor = Number(c.user.id) === Number(postAuthorId);

  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 h-6 w-6 flex items-center justify-center rounded-full bg-dark-green/10 text-dark-green text-xs font-semibold">
        {(c.user.firstName?.[0] || "?").toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {ellipsize(c.user.firstName, 10, { byWords: true })}
          </span>
          {isAuthor && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              author
            </span>
          )}
        </div>
        <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">
          <CollapsibleText
            text={c.body}
            mobileChars={180}
            desktopChars={300}
            className="text-sm text-gray-800"
          />
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
          {isMine && (
            <button
              className="inline-flex items-center gap-1 hover:text-red-600"
              onClick={() => onDelete(c.id, c.parent_id)}
              title="Delete"
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ======================= 底部固定输入框（覆盖紧凑栏） ======================= */

function CommentComposer({
  value,
  onChange,
  onSend,
  onCancel,
  onRequestClose,         // 新增：请求关闭（点击外部、ESC）
  replyingToName,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void | Promise<void>;
  onCancel: () => void;
  onRequestClose: () => void;   // 新增
  replyingToName: string | null;
  autoFocus?: boolean;
}) {
  const textareaId = React.useId();
  const helpId = `${textareaId}-help`;


  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const textLen = value.length;
  const trimmedLen = value.trim().length;
  const isOver = textLen > MAX_COMMENT_LEN;
  const canSend = trimmedLen > 0 && !isOver;

  // 打开时自动聚焦
  React.useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // 点击外部关闭（click-away）
  React.useEffect(() => {
    const onDocPointerDown = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const target = e.target as Node | null;
      if (target && !containerRef.current.contains(target)) {
        onRequestClose();
      }
    };
    document.addEventListener("pointerdown", onDocPointerDown, true);
    return () => document.removeEventListener("pointerdown", onDocPointerDown, true);
  }, [onRequestClose]);

  // ESC 关闭
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onRequestClose();
    }
  };

  return (
    <div
      ref={containerRef}
      className="
        fixed left-0 right-0 md:bottom-0 bottom-[66px] z-20
        border-t border-border
        bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70
      "
      role="dialog"
      aria-labelledby={helpId}
    >
      <div
        className="
          mx-auto max-w-4xl px-3 py-2
          pb-[calc(env(safe-area-inset-bottom)+8px)]
        "
      >
        {/* 正在回复谁 */}
        {replyingToName && (
          <div className="mb-1 text-[12px] text-gray-600">
            Replying to <span className="font-medium">{replyingToName}</span>{" "}
            <button
              className="ml-2 text-gray-400 hover:text-gray-600 underline"
              onClick={() => {
                onCancel();
                onRequestClose();
              }}
            >
              cancel
            </button>
          </div>
        )}

        {/* 固定上下布局：textarea 在上，按钮在下 */}
        <div className="flex flex-col gap-2">
          <textarea
            id={textareaId}
            name="comment"
            aria-describedby={helpId}
            ref={textareaRef}
            className={clsx(
              "flex-1 min-w-0 rounded-md border border-border bg-white px-3 py-2",
              "focus:ring-2 focus:ring-dark-green/30",
              "max-h-40 overflow-y-auto",
              "text-base md:text-sm",
              isOver ? "border-red-400 focus:ring-red-300" : ""
            )}
            rows={2}
            placeholder={replyingToName ? "Write a reply…" : "Write a comment…"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
          />

          {/* 底部：字数 + 按钮（永远在 textarea 下方） */}
          <div className="flex items-center gap-2 justify-end w-full mt-1">
            <span
              className={clsx(
                "text-[12px]",
                isOver ? "text-red-600" : textLen >= MAX_COMMENT_LEN - 20 ? "text-amber-600" : "text-gray-500"
              )}
              id={helpId}
              aria-live="polite"
            >
              {textLen}/{MAX_COMMENT_LEN}
            </span>

            <button
              className="text-sm rounded-md border border-border bg-white px-3 py-2 hover:bg-gray-50"
              onClick={() => {
                onCancel();
                onRequestClose();
              }}
            >
              Cancel
            </button>

            <button
              className="text-sm rounded-md bg-dark-green text-white px-3 py-2 hover:bg-green-700 disabled:opacity-50"
              onClick={async () => {
                if (!canSend) return;
                await onSend();
                onRequestClose();
              }}
              disabled={!canSend}
              title={isOver ? "Comment is too long" : undefined}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
