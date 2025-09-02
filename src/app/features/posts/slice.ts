import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiRequest } from "../request";
import type { PostDetailUi, LoadStatus, PostDetailApi, CreatePostRequest, UpdatePostRequest } from "@/app/types";
import { mapPostDetailApiToUiWithAuthor } from '@/app/types/post'


/** ===== Endpoints ===== */
const POSTS_ENDPOINTS = {
  CREATE: (groupId: number) => `/groups/${groupId}/posts`,
  GET: (postId: number) => `/posts/${postId}`,
  UPDATE: (postId: number) => `/posts/${postId}`,
  DELETE: (postId: number) => `/posts/${postId}`,
  LIKE: (postId: number) => `/posts/${postId}/like`,
  LIKES: (postId: number) => `/posts/${postId}/likes`,
  FILE_IDS: (postId: number) => `/posts/${postId}/files`,
} as const;

/** ===== Thunks ===== */

// 3.1 创建帖子
export const createPost = createAsyncThunk<
  PostDetailUi,
  {
    groupId: number;
    body: CreatePostRequest;   // ✅ 用统一的 DTO
    authorNameHint?: string;
  }
>("posts/createPost", async ({ groupId, body, authorNameHint }, { rejectWithValue }) => {
  try {
    const res = await apiRequest<{ post: PostDetailApi }>(
      "POST",
      POSTS_ENDPOINTS.CREATE(groupId),
      body
    );
    if (!res.success || !res.data?.post) throw new Error(res.message || "Create post failed");
    return mapPostDetailApiToUiWithAuthor(res.data.post, authorNameHint);
  } catch (e: any) {
    return rejectWithValue(e.message || "Create post failed") as any;
  }
});

// 3.3 获取帖子详情
export const fetchPostDetail = createAsyncThunk<
  PostDetailUi,
  { postId: number; authorNameHint?: string }
>("posts/fetchPostDetail", async ({ postId, authorNameHint }, { rejectWithValue }) => {
  try {
    const res = await apiRequest<PostDetailApi>("GET", POSTS_ENDPOINTS.GET(postId));
    if (!res.success || !res.data) throw new Error(res.message || "Fetch post failed");
    return mapPostDetailApiToUiWithAuthor(res.data, authorNameHint);
  } catch (e: any) {
    return rejectWithValue(e.message || "Fetch post failed") as any;
  }
});

// 3.4 更新帖子
export const updatePost = createAsyncThunk<
  PostDetailUi,
  {
    postId: number;
    body: UpdatePostRequest;
    authorNameHint?: string;
  }
>("posts/updatePost", async ({ postId, body, authorNameHint }, { rejectWithValue }) => {
  try {
    const res = await apiRequest<{ post: PostDetailApi }>(
      "PUT",
      POSTS_ENDPOINTS.UPDATE(postId),
      body
    );
    if (!res.success || !res.data?.post) throw new Error(res.message || "Update post failed");
    return mapPostDetailApiToUiWithAuthor(res.data.post, authorNameHint);
  } catch (e: any) {
    return rejectWithValue(e.message || "Update post failed") as any;
  }
});

// 3.5 删除帖子
export const deletePost = createAsyncThunk<{ id: number }, number>(
  "posts/deletePost",
  async (postId, { rejectWithValue }) => {
    try {
      const res = await apiRequest<{}>("DELETE", POSTS_ENDPOINTS.DELETE(postId));
      if (!res.success) throw new Error(res.message || "Delete post failed");
      return { id: postId };
    } catch (e: any) {
      return rejectWithValue(e.message || "Delete post failed") as any;
    }
  }
);

// 3.6 点赞
export const likePost = createAsyncThunk<{ postId: number; like_count: number }, number>(
  "posts/likePost",
  async (postId, { rejectWithValue }) => {
    try {
      const res = await apiRequest<{ like_count: number }>("POST", POSTS_ENDPOINTS.LIKE(postId));
      if (!res.success || typeof res.data?.like_count !== "number")
        throw new Error(res.message || "Like post failed");
      return { postId, like_count: res.data.like_count };
    } catch (e: any) {
      return rejectWithValue(e.message || "Like post failed") as any;
    }
  }
);

// 3.7 取消点赞
export const unlikePost = createAsyncThunk<{ postId: number; like_count: number }, number>(
  "posts/unlikePost",
  async (postId, { rejectWithValue }) => {
    try {
      const res = await apiRequest<{ like_count: number }>(
        "DELETE",
        POSTS_ENDPOINTS.LIKE(postId)
      );
      if (!res.success || typeof res.data?.like_count !== "number")
        throw new Error(res.message || "Unlike post failed");
      return { postId, like_count: res.data.like_count };
    } catch (e: any) {
      return rejectWithValue(e.message || "Unlike post failed") as any;
    }
  }
);

// 3.8 获取帖子点赞列表
export const fetchPostLikes = createAsyncThunk<
  {
    postId: number;
    likes: Array<{ id: number; user: { id: number; firstName: string }; created_at: string }>;
    pagination: { total_pages: number; current_page: number; total_likes: number };
  },
  { postId: number; page?: number; per_page?: number }
>("posts/fetchPostLikes", async ({ postId, page = 1, per_page = 20 }, { rejectWithValue }) => {
  try {
    const qs = new URLSearchParams();
    if (page) qs.set("page", String(page));
    if (per_page) qs.set("per_page", String(per_page));
    const url = `${POSTS_ENDPOINTS.LIKES(postId)}${qs.toString() ? `?${qs}` : ""}`;
    const res = await apiRequest<{
      likes: Array<{ id: number; user: { id: number; firstName: string }; created_at: string }>;
      pagination: { total_pages: number; current_page: number; total_likes: number };
    }>("GET", url);
    if (!res.success || !res.data) throw new Error(res.message || "Fetch likes failed");
    return { postId, likes: res.data.likes, pagination: res.data.pagination };
  } catch (e: any) {
    return rejectWithValue(e.message || "Fetch likes failed") as any;
  }
});

// 3.9 获取帖子附件 id 列表
export const fetchPostFileIds = createAsyncThunk<{ postId: number; file_ids: number[] }, number>(
  "posts/fetchPostFileIds",
  async (postId, { rejectWithValue }) => {
    try {
      const res = await apiRequest<{ file_ids: number[] }>("GET", POSTS_ENDPOINTS.FILE_IDS(postId));
      if (!res.success || !res.data) throw new Error(res.message || "Fetch file ids failed");
      return { postId, file_ids: res.data.file_ids || [] };
    } catch (e: any) {
      return rejectWithValue(e.message || "Fetch file ids failed") as any;
    }
  }
);

/** ===== Slice ===== */

interface PostsState {
  byId: Record<number, PostDetailUi>;
  current: PostDetailUi | null;
  likes: Record<
    number,
    {
      list: Array<{ id: number; user: { id: number; firstName: string }; created_at: string }>;
      pagination: { total_pages: number; current_page: number; total_likes: number } | null;
    }
  >;
  fileIds: Record<number, number[]>;

  status: Record<string, LoadStatus>;
  error: Record<string, string | null>;
}

const initialState: PostsState = {
  byId: {},
  current: null,
  likes: {},
  fileIds: {},
  status: {},
  error: {},
};

const setStatus = (s: PostsState, k: string, v: LoadStatus) => {
  s.status[k] = v;
};
const setError = (s: PostsState, k: string, v: string | null) => {
  s.error[k] = v;
};

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    resetPostsState: () => initialState,
  },
  extraReducers: (builder) => {
    // create
    builder
      .addCase(createPost.pending, (s) => {
        setStatus(s, "createPost", "loading");
        setError(s, "createPost", null);
      })
      .addCase(createPost.fulfilled, (s, a) => {
        setStatus(s, "createPost", "succeeded");
        const p = a.payload;
        s.byId[p.id] = p;
        s.current = p;
      })
      .addCase(createPost.rejected, (s, a) => {
        setStatus(s, "createPost", "failed");
        setError(s, "createPost", (a.payload as string) || "Create post failed");
      });

    // get detail
    builder
      .addCase(fetchPostDetail.pending, (s) => {
        setStatus(s, "fetchPostDetail", "loading");
        setError(s, "fetchPostDetail", null);
      })
      .addCase(fetchPostDetail.fulfilled, (s, a) => {
        setStatus(s, "fetchPostDetail", "succeeded");
        const p = a.payload;
        s.byId[p.id] = p;
        s.current = p;
      })
      .addCase(fetchPostDetail.rejected, (s, a) => {
        setStatus(s, "fetchPostDetail", "failed");
        setError(s, "fetchPostDetail", (a.payload as string) || "Fetch post failed");
      });

    // update
    builder
      .addCase(updatePost.pending, (s) => {
        setStatus(s, "updatePost", "loading");
        setError(s, "updatePost", null);
      })
      .addCase(updatePost.fulfilled, (s, a) => {
        setStatus(s, "updatePost", "succeeded");
        const p = a.payload;
        s.byId[p.id] = p;
        s.current = p;
      })
      .addCase(updatePost.rejected, (s, a) => {
        setStatus(s, "updatePost", "failed");
        setError(s, "updatePost", (a.payload as string) || "Update post failed");
      });

    // delete
    builder
      .addCase(deletePost.pending, (s) => {
        setStatus(s, "deletePost", "loading");
        setError(s, "deletePost", null);
      })
      .addCase(deletePost.fulfilled, (s, a) => {
        setStatus(s, "deletePost", "succeeded");
        const id = a.payload.id;
        delete s.byId[id];
        if (s.current?.id === id) s.current = null;
      })
      .addCase(deletePost.rejected, (s, a) => {
        setStatus(s, "deletePost", "failed");
        setError(s, "deletePost", (a.payload as string) || "Delete post failed");
      });

    // like / unlike （这里仅记录 likes 数，如需展示可扩展 PostDetailUi）
    builder
      .addCase(likePost.pending, (s) => setStatus(s, "likePost", "loading"))
      .addCase(likePost.fulfilled, (s) => setStatus(s, "likePost", "succeeded"))
      .addCase(likePost.rejected, (s, a) => {
        setStatus(s, "likePost", "failed");
        setError(s, "likePost", (a.payload as string) || "Like post failed");
      });

    builder
      .addCase(unlikePost.pending, (s) => setStatus(s, "unlikePost", "loading"))
      .addCase(unlikePost.fulfilled, (s) => setStatus(s, "unlikePost", "succeeded"))
      .addCase(unlikePost.rejected, (s, a) => {
        setStatus(s, "unlikePost", "failed");
        setError(s, "unlikePost", (a.payload as string) || "Unlike post failed");
      });

    // likes list
    builder
      .addCase(fetchPostLikes.pending, (s) => setStatus(s, "fetchPostLikes", "loading"))
      .addCase(fetchPostLikes.fulfilled, (s, a) => {
        setStatus(s, "fetchPostLikes", "succeeded");
        const { postId, likes, pagination } = a.payload;
        s.likes[postId] = { list: likes, pagination };
      })
      .addCase(fetchPostLikes.rejected, (s, a) => {
        setStatus(s, "fetchPostLikes", "failed");
        setError(s, "fetchPostLikes", (a.payload as string) || "Fetch likes failed");
      });

    // file ids
    builder
      .addCase(fetchPostFileIds.pending, (s) => setStatus(s, "fetchPostFileIds", "loading"))
      .addCase(fetchPostFileIds.fulfilled, (s, a) => {
        setStatus(s, "fetchPostFileIds", "succeeded");
        const { postId, file_ids } = a.payload;
        s.fileIds[postId] = file_ids;
      })
      .addCase(fetchPostFileIds.rejected, (s, a) => {
        setStatus(s, "fetchPostFileIds", "failed");
        setError(s, "fetchPostFileIds", (a.payload as string) || "Fetch file ids failed");
      });
  },
});

export const { resetPostsState } = postsSlice.actions;
export default postsSlice.reducer;
