// app/features/comments/slice.ts
"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiRequest } from "../request";
import type { LoadStatus } from "@/app/types";
import { unwrapData } from "@/app/types/api";
import type {
  CommentItemApi,
  CommentListData,
  CreateCommentRequest,
  UpdateCommentRequest,
  CommentsPagination,
  CreateCommentData,
  UpdateCommentData,
  CommentDetailData,
  DeleteCommentData,
} from "@/app/types/comments";
import { errMsg } from '@/app/features/auth/slice'

/* ======================================================
 *                   URL Builders
 * ====================================================== */

const COMMENTS_ENDPOINTS = {
  POST_COMMENTS: (postId: number) => `/posts/${postId}/comments`,
  GET_POST_COMMENTS: (
    postId: number,
    q: { page?: number; per_page?: number; parent_id?: number | null } = {}
  ) => {
    const qs = new URLSearchParams();
    if (q.page) qs.set("page", String(q.page));
    if (q.per_page) qs.set("per_page", String(q.per_page));
    if (q.parent_id !== undefined && q.parent_id !== null) qs.set("parent_id", String(q.parent_id));
    return `/posts/${postId}/comments${qs.toString() ? `?${qs.toString()}` : ""}`;
  },

  COMMENT_DETAIL: (commentId: number) => `/comments/${commentId}`,
  UPDATE_COMMENT: (commentId: number) => `/comments/${commentId}`,
  DELETE_COMMENT: (commentId: number) => `/comments/${commentId}`,

  REPLY_TO_COMMENT: (commentId: number) => `/comments/${commentId}/comments`,
} as const;

/* ======================================================
 *                     Helpers
 * ====================================================== */

const sourceKeyOf = {
  root: (postId: number) => `post:${postId}:root`,
  children: (commentId: number) => `comment:${commentId}:children`,
};

const initFeed = () => ({
  items: [] as CommentItemApi[],
  pagination: {
    current_page: 0,
    total_pages: 0,
    total_comments: 0,
  } as CommentsPagination,
  status: "idle" as LoadStatus,
  error: null as string | null,
});
type CommentFeed = ReturnType<typeof initFeed>;

/* ======================================================
 *                     Thunks
 * ====================================================== */

// 根评论列表
// 根评论列表
export const fetchPostRootComments = createAsyncThunk<
  { sourceKey: string; append: boolean } & CommentListData,
  { postId: number; page?: number; per_page?: number; append?: boolean }
>("comments/fetchPostRootComments", async ({ postId, page = 1, per_page = 20, append = false }, { rejectWithValue }) => {
  try {
    const res = await apiRequest<CommentListData>(
      "GET",
      COMMENTS_ENDPOINTS.GET_POST_COMMENTS(postId, { page, per_page })
    );
    const data = unwrapData(res);
    return { ...data, sourceKey: sourceKeyOf.root(postId), append };
  } catch (e: any) {
    return rejectWithValue(errMsg(e, "Fetch comments failed"));
  }
});

// 子评论列表
export const fetchChildComments = createAsyncThunk<
  { sourceKey: string; parentId: number; append: boolean } & CommentListData,
  { postId: number; parentId: number; page?: number; per_page?: number; append?: boolean }
>("comments/fetchChildComments", async ({ postId, parentId, page = 1, per_page = 20, append = false }, { rejectWithValue }) => {
  try {
    const res = await apiRequest<CommentListData>(
      "GET",
      COMMENTS_ENDPOINTS.GET_POST_COMMENTS(postId, { page, per_page, parent_id: parentId })
    );
    const data = unwrapData(res);
    return { ...data, sourceKey: sourceKeyOf.children(parentId), parentId, append };
  } catch (e: any) {
    return rejectWithValue(errMsg(e, "Fetch child comments failed"));
  }
});





// 创建评论（根/子）
export const createComment = createAsyncThunk<
  CommentItemApi,
  { postId: number; body: string; parent_id?: number | null }
>("comments/createComment", async ({ postId, body, parent_id = null }, { rejectWithValue }) => {
  try {
    const payload: CreateCommentRequest = { body, parent_id };
    const res = await apiRequest<CreateCommentData>("POST", COMMENTS_ENDPOINTS.POST_COMMENTS(postId), payload);
    const data = unwrapData(res); // { comment }
    return data.comment;
  } catch (e: any) {
    return rejectWithValue(errMsg(e, "Create comment failed"));
  }
});

// 回复评论（等价于在某条评论下创建子评论）
export const replyToComment = createAsyncThunk<
  CommentItemApi,
  { commentId: number; body: string }
>("comments/replyToComment", async ({ commentId, body }, { rejectWithValue }) => {
  try {
    const res = await apiRequest<CreateCommentData>("POST", COMMENTS_ENDPOINTS.REPLY_TO_COMMENT(commentId), { body });
    const data = unwrapData(res); // { comment }
    return data.comment;
  } catch (e: any) {
    return rejectWithValue(errMsg(e, "Reply comment failed"));
  }
});

// 评论详情
export const fetchCommentDetail = createAsyncThunk<CommentItemApi, { commentId: number }>(
  "comments/fetchCommentDetail",
  async ({ commentId }, { rejectWithValue }) => {
    try {
      const res = await apiRequest<CommentDetailData>("GET", COMMENTS_ENDPOINTS.COMMENT_DETAIL(commentId));
      const data = unwrapData(res); // CommentItemApi
      return data;
    } catch (e: any) {
      return rejectWithValue(errMsg(e, "Fetch comment failed"));
    }
  }
);

// 更新评论
export const updateComment = createAsyncThunk<
  CommentItemApi,
  { commentId: number; body: string }
>("comments/updateComment", async ({ commentId, body }, { rejectWithValue }) => {
  try {
    const payload: UpdateCommentRequest = { body };
    const res = await apiRequest<UpdateCommentData>("PUT", COMMENTS_ENDPOINTS.UPDATE_COMMENT(commentId), payload);
    const data = unwrapData(res); // { comment }
    return data.comment;
  } catch (e: any) {
    return rejectWithValue(errMsg(e, "Update comment failed"));
  }
});

// 删除评论
export const deleteComment = createAsyncThunk<
  { commentId: number; parent_id: number | null },
  { commentId: number; parent_id: number | null }
>("comments/deleteComment", async ({ commentId, parent_id }, { rejectWithValue }) => {
  try {
    const res = await apiRequest<DeleteCommentData>("DELETE", COMMENTS_ENDPOINTS.DELETE_COMMENT(commentId));
    if (!res.success) throw new Error(res.message || "Delete comment failed");
    return { commentId, parent_id };
  } catch (e: any) {
    return rejectWithValue(errMsg(e, "Delete comment failed"));
  }
});

/* ======================================================
 *                      State
 * ====================================================== */

type CommentsState = {
  byId: Record<number, CommentItemApi>;
  lists: Record<string, CommentFeed>; // post:{id}:root / comment:{id}:children
  status: Record<string, LoadStatus>;
  error: Record<string, string | null>;
};

const initialState: CommentsState = {
  byId: {},
  lists: {},
  status: {},
  error: {},
};

const setStatus = (s: CommentsState, k: string, v: LoadStatus) => {
  s.status[k] = v;
};
const setError = (s: CommentsState, k: string, v: string | null) => {
  s.error[k] = v;
};
const ensureFeed = (state: CommentsState, key: string) => {
  if (!state.lists[key]) state.lists[key] = initFeed();
  return state.lists[key];
};

// 小工具：按 id 去重（保留前面的）
const dedupeById = <T extends { id: number }>(arr: T[]) => {
  const seen = new Set<number>();
  const out: T[] = [];
  for (const it of arr) {
    if (!seen.has(it.id)) {
      seen.add(it.id);
      out.push(it);
    }
  }
  return out;
};


const patchCommentInAllFeeds = (
  state: CommentsState,
  commentId: number,
  patch: Partial<CommentItemApi>
) => {
  for (const key of Object.keys(state.lists)) {
    const feed = state.lists[key];
    if (!feed || !Array.isArray(feed.items)) continue;
    const idx = feed.items.findIndex((x) => x.id === commentId);
    if (idx >= 0) {
      feed.items[idx] = { ...feed.items[idx], ...patch };
    }
  }
};

/* ======================================================
 *                      Slice
 * ====================================================== */

const commentsSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {
    resetCommentsState: () => initialState,
    clearCommentsFeed(state, action: { payload: string }) {
      state.lists[action.payload] = initFeed();
    },
  },
  extraReducers: (builder) => {
    // 根评论列表
    builder
      .addCase(fetchPostRootComments.pending, (s, a) => {
        const key = sourceKeyOf.root(a.meta.arg.postId);
        const feed = ensureFeed(s, key);
        feed.status = "loading";
        feed.error = null;
      })
      .addCase(fetchPostRootComments.fulfilled, (s, a) => {
        const { sourceKey, comments, pagination, append } = a.payload;
        const feed = ensureFeed(s, sourceKey);
        if (append) {
          // 追加：老 + 新
          feed.items = dedupeById([...feed.items, ...comments]);
        } else {
          // 覆盖：但保留本地已插入但服务端暂未返回的项（如刚发的评论）
          const localOnly = feed.items.filter(
            (loc) => !comments.some((srv) => srv.id === loc.id)
          );
          feed.items = dedupeById([...localOnly, ...comments]); // 本地优先置前
        }
        comments.forEach((c) => (s.byId[c.id] = c));
        feed.pagination = pagination;
        feed.status = "succeeded";
      })
      .addCase(fetchPostRootComments.rejected, (s, a) => {
        const key = sourceKeyOf.root(a.meta.arg.postId);
        const feed = ensureFeed(s, key);
        feed.status = "failed";
        feed.error = (a.payload as string) || "Fetch comments failed";
      });

    // 子评论列表
    builder
      .addCase(fetchChildComments.pending, (s, a) => {
        const key = sourceKeyOf.children(a.meta.arg.parentId);
        const feed = ensureFeed(s, key);
        feed.status = "loading";
        feed.error = null;
      })
      .addCase(fetchChildComments.fulfilled, (s, a) => {
        const { sourceKey, comments, pagination, append } = a.payload;
        const feed = ensureFeed(s, sourceKey);
        if (append) {
          feed.items = dedupeById([...feed.items, ...comments]);
        } else {
          const localOnly = feed.items.filter((loc) => !comments.some((srv) => srv.id === loc.id));
          feed.items = dedupeById([...localOnly, ...comments]);
        }
        comments.forEach((c) => (s.byId[c.id] = c));
        feed.pagination = pagination;
        feed.status = "succeeded";
      })
      .addCase(fetchChildComments.rejected, (s, a) => {
        const key = sourceKeyOf.children(a.meta.arg.parentId);
        const feed = ensureFeed(s, key);
        feed.status = "failed";
        feed.error = (a.payload as string) || "Fetch child comments failed";
      });

    // 创建评论（根/子）
    builder
      .addCase(createComment.pending, (s) => {
        setStatus(s, "createComment", "loading");
        setError(s, "createComment", null);
      })
      .addCase(createComment.fulfilled, (s, a) => {
        setStatus(s, "createComment", "succeeded");
        const c = a.payload;
        s.byId[c.id] = c;

        if (c.parent_id) {
          const childKey = sourceKeyOf.children(c.parent_id);
          const childFeed = ensureFeed(s, childKey);
          childFeed.items = [c, ...childFeed.items];
          childFeed.pagination.total_comments += 1;

          const parent = s.byId[c.parent_id];
          if (parent) {
            const next = (parent.children_count || 0) + 1;
            s.byId[c.parent_id] = { ...parent, children_count: next };
            // ★ 同步到所有 feed 列表项里的这条父评论
            patchCommentInAllFeeds(s, c.parent_id, { children_count: next });
          }
        } else {
          const rootKey = sourceKeyOf.root(c.post_id);
          const rootFeed = ensureFeed(s, rootKey);
          rootFeed.items = [c, ...rootFeed.items];
          rootFeed.pagination.total_comments += 1;
        }
      })
      .addCase(createComment.rejected, (s, a) => {
        setStatus(s, "createComment", "failed");
        setError(s, "createComment", (a.payload as string) || "Create comment failed");
      });

    // 直接回复接口（/comments/{id}/comments）
    builder
      .addCase(replyToComment.pending, (s) => {
        setStatus(s, "replyToComment", "loading");
        setError(s, "replyToComment", null);
      })
      .addCase(replyToComment.fulfilled, (s, a) => {
        setStatus(s, "replyToComment", "succeeded");
        const c = a.payload;
        s.byId[c.id] = c;

        if (c.parent_id) {
          const childKey = sourceKeyOf.children(c.parent_id);
          const childFeed = ensureFeed(s, childKey);
          childFeed.items = [c, ...childFeed.items];
          childFeed.pagination.total_comments += 1;

          const parent = s.byId[c.parent_id];
          if (parent) {
            const next = (parent.children_count || 0) + 1;
            s.byId[c.parent_id] = { ...parent, children_count: next };
            // ★ 同步到所有 feed 列表项里的这条父评论
            patchCommentInAllFeeds(s, c.parent_id, { children_count: next });
          }
        }
      })
      .addCase(replyToComment.rejected, (s, a) => {
        setStatus(s, "replyToComment", "failed");
        setError(s, "replyToComment", (a.payload as string) || "Reply comment failed");
      });

    // 详情
    builder
      .addCase(fetchCommentDetail.pending, (s) => {
        setStatus(s, "fetchCommentDetail", "loading");
        setError(s, "fetchCommentDetail", null);
      })
      .addCase(fetchCommentDetail.fulfilled, (s, a) => {
        setStatus(s, "fetchCommentDetail", "succeeded");
        const c = a.payload;
        s.byId[c.id] = c;
      })
      .addCase(fetchCommentDetail.rejected, (s, a) => {
        setStatus(s, "fetchCommentDetail", "failed");
        setError(s, "fetchCommentDetail", (a.payload as string) || "Fetch comment failed");
      });

    builder
      .addCase(updateComment.pending, (s) => {
        setStatus(s, "updateComment", "loading");
        setError(s, "updateComment", null);
      })
      .addCase(updateComment.fulfilled, (s, a) => {
        setStatus(s, "updateComment", "succeeded");
        const c = a.payload;
        s.byId[c.id] = c;

        const rootKey = sourceKeyOf.root(c.post_id);
        const rootFeed = s.lists[rootKey];
        if (rootFeed) {
          const i = rootFeed.items.findIndex((x) => x.id === c.id);
          if (i >= 0) rootFeed.items[i] = c;
        }
        if (c.parent_id) {
          const childKey = sourceKeyOf.children(c.parent_id);
          const childFeed = s.lists[childKey];
          if (childFeed) {
            const j = childFeed.items.findIndex((x) => x.id === c.id);
            if (j >= 0) childFeed.items[j] = c;
          }
        }
      })
      .addCase(updateComment.rejected, (s, a) => {
        setStatus(s, "updateComment", "failed");
        setError(s, "updateComment", (a.payload as string) || "Update comment failed");
      });

    builder
      .addCase(deleteComment.pending, (s) => {
        setStatus(s, "deleteComment", "loading");
        setError(s, "deleteComment", null);
      })
      .addCase(deleteComment.fulfilled, (s, a) => {
        setStatus(s, "deleteComment", "succeeded");
        const { commentId, parent_id } = a.payload;
        const removed = s.byId[commentId];
        delete s.byId[commentId];

        if (removed) {
          const rootKey = sourceKeyOf.root(removed.post_id);
          const rootFeed = s.lists[rootKey];
          if (rootFeed) {
            rootFeed.items = rootFeed.items.filter((x) => x.id !== commentId);
            rootFeed.pagination.total_comments = Math.max(0, rootFeed.pagination.total_comments - 1);
          }
        }

        if (parent_id) {
          const childKey = sourceKeyOf.children(parent_id);
          const childFeed = s.lists[childKey];
          if (childFeed) {
            childFeed.items = childFeed.items.filter((x) => x.id !== commentId);
            childFeed.pagination.total_comments = Math.max(0, childFeed.pagination.total_comments - 1);
          }
          const parent = s.byId[parent_id];
          if (parent) {
            const next = Math.max(0, (parent.children_count || 0) - 1);
            s.byId[parent_id] = { ...parent, children_count: next };
            patchCommentInAllFeeds(s, parent_id, { children_count: next });
          }
        }
      })
      .addCase(deleteComment.rejected, (s, a) => {
        setStatus(s, "deleteComment", "failed");
        setError(s, "deleteComment", (a.payload as string) || "Delete comment failed");
      });
  },
});

export const { resetCommentsState, clearCommentsFeed } = commentsSlice.actions;
export default commentsSlice.reducer;

/* ======================================================
 *                    Selectors (常用)
 * ====================================================== */

export const selectRootCommentsFeed = (state: any, postId: number) =>
  state.comments?.lists?.[sourceKeyOf.root(postId)] || initFeed();

export const selectChildCommentsFeed = (state: any, parentId: number) =>
  state.comments?.lists?.[sourceKeyOf.children(parentId)] || initFeed();

export const selectCommentById = (state: any, commentId: number) =>
  state.comments?.byId?.[commentId] || null;

export const selectCommentsStatus = (state: any, key: string) =>
  (state.comments?.status?.[key] as LoadStatus | undefined) || "idle";

export const selectCommentsError = (state: any, key: string) =>
  (state.comments?.error?.[key] as string | null | undefined) ?? null;
