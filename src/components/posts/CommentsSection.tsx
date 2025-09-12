"use client";
import React, { useEffect, useState } from "react";
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
import { ChatBubbleLeftIcon, TrashIcon, ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";

type Props = {
  postId: number;
  postAuthorId: number;
  currentUserId?: number | null;
  perPage?: number;
};

export default function CommentsSection({
  postId,
  postAuthorId,
  currentUserId,
  perPage = 10,
}: Props) {
  const dispatch = useAppDispatch();

  // 根评论
  const rootFeed = useAppSelector((s) => selectRootCommentsFeed(s, postId));
  const { items: rootComments, pagination: rootPg, status: rootStatus } = rootFeed;

  // 回复状态
  const [inputValue, setInputValue] = useState("");
  const [replyTo, setReplyTo] = useState<null | { commentId: number; nickname: string }>(null);
  const isReplying = !!replyTo;

  useEffect(() => {
    dispatch(fetchPostRootComments({ postId, page: 1, per_page: perPage }));
  }, [dispatch, postId, perPage]);

  const onSend = async () => {
    const body = inputValue.trim();
    if (!body) return;

    try {
      if (isReplying && replyTo) {
        // 走 /comments/{id}/comments
        await dispatch(replyToComment({ commentId: replyTo.commentId, body })).unwrap();
      } else {
        // 发根评论
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
    <div className="mt-8 md:mt-10 pb-24 shadow-md px-6 pt-6"> {/* 底部输入框预留空间 */}
      <p className=" font-semibold text-dark-gray mb-3 flex items-center gap-2">
        <span className="text-gray font-normal">
          {rootPg?.total_comments ?? 0}
        </span>
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
              onReply={(target) => setReplyTo(target)}
              onDelete={async (commentId, parentId) => {
                try {
                  await dispatch(deleteComment({ commentId, parent_id: parentId })).unwrap();
                } catch (e: any) {
                  alert(e?.message || "Delete comment failed");
                }
              }}
              // 子评论数据由内部组件自行拉取
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

      {/* 固定底部输入框 */}
      <CommentComposer
        value={inputValue}
        onChange={setInputValue}
        onSend={onSend}
        onCancel={onCancel}
        replyingToName={replyTo?.nickname || null}
      />
    </div>
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

  // 首次展开时拉取子评论
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
      {/* 头部：头像首字母 + 名称 + author + 点赞数 */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-7 w-7 flex items-center justify-center rounded-full bg-dark-green/10 text-dark-green font-semibold">
          {(c.user.firstName?.[0] || "?").toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{c.user.firstName}</span>
            {isAuthor && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                author
              </span>
            )}
            {/* <span className="ml-auto inline-flex items-center gap-1 text-xs text-gray-500">
              <HandThumbUpOutline className="h-4 w-4" />
              {c.like_count ?? 0}
            </span> */}
          </div>
          <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{c.body}</div>

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
            <div className="mt-3 pl-4 border-l border-gray-200">
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
          <span className="text-sm font-medium text-gray-900">{c.user.firstName}</span>
          {isAuthor && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              author
            </span>
          )}
          {/* <span className="ml-auto inline-flex items-center gap-1 text-xs text-gray-500">
            <HandThumbUpOutline className="h-4 w-4" />
            {c.like_count ?? 0}
          </span> */}
        </div>
        <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{c.body}</div>
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">

          {isMine && (
            <>
              <button
                className="inline-flex items-center gap-1 hover:text-red-600"
                onClick={() => onDelete(c.id, c.parent_id)}
                title="Delete"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ======================= 底部固定输入框 ======================= */
function CommentComposer({
  value,
  onChange,
  onSend,
  onCancel,
  replyingToName,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onCancel: () => void;
  replyingToName: string | null;
}) {
  const textareaId = React.useId();
  const helpId = `${textareaId}-help`;

  const MAX_LEN = 200;
  const [focused, setFocused] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const textLen = value.length;                 // 实际字数
  const trimmedLen = value.trim().length;       // 有效字数（控制是否可发送）
  const isOver = textLen > MAX_LEN;
  const canSend = trimmedLen > 0 && !isOver;

  // 自动增高


  const expanded = focused || !!value.trim() || !!replyingToName;

  return (
    <div className="fixed left-0 right-0 md:bottom-0 bottom-[66px] z-10 border-t border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto max-w-4xl px-3 py-2">
        {/* 正在回复谁 */}
        {replyingToName && (
          <div className="mb-1 text-[12px] text-gray-600">
            Replying to <span className="font-medium">{replyingToName}</span>{" "}
            <button
              className="ml-2 text-gray-400 hover:text-gray-600 underline"
              onClick={() => {
                onCancel();
                setFocused(false);
              }}
            >
              cancel
            </button>
          </div>
        )}

        <div className={clsx("flex gap-2", expanded ? "flex-col" : "items-end")}>
          <textarea
            id={textareaId}
            name="comment"
            aria-describedby={helpId}
            ref={textareaRef}
            className={clsx(
              "flex-1 resize-none rounded-md border border-border bg-white px-3 py-2 text-sm outline-none",
              "focus:ring-2 focus:ring-dark-green/30",
              "max-h-40 overflow-y-auto",
              isOver ? "border-red-400 focus:ring-red-300" : ""
            )}
            rows={expanded ? 2 : 1}
            placeholder={replyingToName ? "Write a reply…" : "Write a comment…"}
            value={value}
            onFocus={() => {
              setFocused(true);
            }}
            onBlur={() => {
              if (!value.trim() && !replyingToName) setFocused(false);
            }}
            onChange={(e) => {
              onChange(e.target.value);
            }}
          />

          {/* 第二行：字数 + 按钮 */}
          <div className={clsx("flex items-center gap-2", expanded ? "self-end mt-1" : "")}>
            <span
              className={clsx(
                "text-[12px]",
                isOver ? "text-red-600" : textLen >= MAX_LEN - 20 ? "text-amber-600" : "text-gray-500"
              )}
              aria-live="polite"
            >
              {textLen}/{MAX_LEN}
            </span>

            <button
              className="text-sm rounded-md border border-border bg-white px-3 py-2 hover:bg-gray-50"
              onClick={() => {
                onCancel();
                setFocused(false);
              }}
            >
              Cancel
            </button>
            <button
              className="text-sm rounded-md bg-dark-green text-white px-3 py-2 hover:bg-green-700 disabled:opacity-50"
              onClick={() => {
                if (!canSend) return; // 保险：超限/空内容不发送
                onSend();
                setFocused(false);
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


