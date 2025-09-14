import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "@/app/features/store";
import { apiRequest } from "../request";
import type {
  CreatePostRequest,
  CreatedPostData,
  PostDetailData,
  UpdatePostRequest,
  UpdatePostData,
  PostFileIdsData,
  PostListItemApi,
  PostListData,
} from "@/app/types";
import { unwrapData } from "@/app/types/api";
import type { LoadStatus } from "@/app/types";
import { likePost, unlikePost } from "@/app/features/posts/likeSlice";


/** ---------------------------------------------
 *  通用列表：我的 / 订阅 / 群组帖子
 * --------------------------------------------- */

type Source = "group" | "mine" | "subscribed";

function buildPostsUrl(
  source: Source,
  opts: { groupId?: number; page?: number; per_page?: number } = {}
) {
  const { groupId, page = 1, per_page = 20 } = opts;
  const qs = new URLSearchParams();
  if (page) qs.set("page", String(page));
  if (per_page) qs.set("per_page", String(per_page));

  let path = "";
  switch (source) {
    case "group":
      if (!groupId) throw new Error("groupId required for group posts");
      path = `/groups/${groupId}/posts`;
      break;
    case "mine":
      path = `/user/posts`;
      break;
    case "subscribed":
      path = `/user/subscribed-posts`;
      break;
  }
  return `${path}${qs.toString() ? `?${qs.toString()}` : ""}`;
}

async function fetchPostsApi(
  source: Source,
  opts: { groupId?: number; page?: number; per_page?: number }
) {
  const url = buildPostsUrl(source, opts);
  const res = await apiRequest<PostListData>("GET", url);
  if (!res.success || !res.data) throw new Error(res.message || "Fetch posts failed");
  return res.data;
}

const sourceKeyOf = (source: Source, groupId?: number) =>
  source === "group" ? `group:${groupId}` : source;

/** 三个列表 thunk：统一放 posts slice 内 */
export const fetchGroupPostsList = createAsyncThunk<
  PostListData & { append: boolean; sourceKey: string },
  { groupId: number; page?: number; per_page?: number; append?: boolean }
>("posts/fetchGroupPostsList", async ({ groupId, page = 1, per_page = 20, append = false }, { rejectWithValue }) => {
  try {
    const data = await fetchPostsApi("group", { groupId, page, per_page });
    return { ...data, append, sourceKey: sourceKeyOf("group", groupId) };
  } catch (e: any) {
    return rejectWithValue(e.message || "Fetch posts failed") as any;
  }
});

export const fetchMyPosts = createAsyncThunk<
  PostListData & { append: boolean; sourceKey: string },
  { page?: number; per_page?: number; append?: boolean }
>("posts/fetchMyPosts", async ({ page = 1, per_page = 20, append = false }, { rejectWithValue }) => {
  try {
    const data = await fetchPostsApi("mine", { page, per_page });
    return { ...data, append, sourceKey: sourceKeyOf("mine") };
  } catch (e: any) {
    return rejectWithValue(e.message || "Fetch my posts failed") as any;
  }
});

export const fetchSubscribedPosts = createAsyncThunk<
  PostListData & { append: boolean; sourceKey: string },
  { page?: number; per_page?: number; append?: boolean }
>("posts/fetchSubscribedPosts", async ({ page = 1, per_page = 20, append = false }, { rejectWithValue }) => {
  try {
    const data = await fetchPostsApi("subscribed", { page, per_page });
    return { ...data, append, sourceKey: sourceKeyOf("subscribed") };
  } catch (e: any) {
    return rejectWithValue(e.message || "Fetch subscribed posts failed") as any;
  }
});

/** ---------------------------------------------
 *  详情/创建/更新/删除/附件
 * --------------------------------------------- */

// 兼容：创建返回的 post（缺少 content/author 等） 与 详情返回的完整体
type PostEntity = PostDetailData | CreatedPostData["post"];

const POSTS_ENDPOINTS = {
  CREATE: (groupId: number) => `/groups/${groupId}/posts`,
  GET: (postId: number) => `/posts/${postId}`,
  UPDATE: (postId: number) => `/posts/${postId}`,
  DELETE: (postId: number) => `/posts/${postId}`,
  FILE_IDS: (postId: number) => `/posts/${postId}/files`,
} as const;

// 创建
export const createPost = createAsyncThunk<
  CreatedPostData["post"],
  {
    groupId: number;
    body: CreatePostRequest;
  }
>("posts/createPost", async ({ groupId, body }, { rejectWithValue }) => {
  try {
    const res = await apiRequest<CreatedPostData>("POST", POSTS_ENDPOINTS.CREATE(groupId), body);
    const data = unwrapData(res);
    return data.post;
  } catch (e: any) {
    return rejectWithValue(e.message || "Create post failed") as any;
  }
});

// 详情
export const fetchPostDetail = createAsyncThunk<PostDetailData, { postId: number }>(
  "posts/fetchPostDetail",
  async ({ postId }, { rejectWithValue }) => {
    try {
      const res = await apiRequest<PostDetailData>("GET", POSTS_ENDPOINTS.GET(postId));
      if (!res.success || !res.data) throw new Error(res.message || "Fetch post failed");
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.message || "Fetch post failed") as any;
    }
  }
);

// 更新
export const updatePost = createAsyncThunk<
  PostDetailData,
  {
    postId: number;
    body: UpdatePostRequest;
  }
>("posts/updatePost", async ({ postId, body }, { rejectWithValue }) => {
  try {
    const res = await apiRequest<UpdatePostData>("PUT", POSTS_ENDPOINTS.UPDATE(postId), body);
    if (!res.success || !res.data?.post) throw new Error(res.message || "Update post failed");
    return res.data.post;
  } catch (e: any) {
    return rejectWithValue(e.message || "Update post failed") as any;
  }
});

// 删除
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

// 附件 id 列表
export const fetchPostFileIds = createAsyncThunk<{ postId: number; file_ids: number[] }, number>(
  "posts/fetchPostFileIds",
  async (postId, { rejectWithValue }) => {
    try {
      const res = await apiRequest<PostFileIdsData>("GET", POSTS_ENDPOINTS.FILE_IDS(postId));
      if (!res.success || !res.data) throw new Error(res.message || "Fetch file ids failed");
      return { postId, file_ids: res.data.file_ids || [] };
    } catch (e: any) {
      return rejectWithValue(e.message || "Fetch file ids failed") as any;
    }
  }
);

/** ---------------------------------------------
 *  Slice
 * --------------------------------------------- */

type FeedList = {
  items: PostListItemApi[];
  current_page: number;
  total_pages: number;
  total_posts: number;
  status: LoadStatus;
  error: string | null;
};

interface PostsState {
  // 详情/创建
  byId: Record<number, PostEntity>;
  current: PostEntity | null;

  // 列表（key: 'mine' | 'subscribed' | `group:${id}` ）
  lists: Record<string, FeedList>;

  // 附件
  fileIds: Record<number, number[]>;

  // 通用状态
  status: Record<string, LoadStatus>;
  error: Record<string, string | null>;
}

const initFeed = (): FeedList => ({
  items: [],
  current_page: 0,
  total_pages: 0,
  total_posts: 0,
  status: "idle",
  error: null,
});

// 取帖子所在群组 id
export const selectPostGroupId = (postId: number) => (state: RootState): number | undefined => {
  const p = state.posts.byId[postId] as PostDetailData | undefined;
  return p?.group?.id;
};

// 取帖子所在群组的 membership hint（若接口未返回则是 undefined）
export const selectPostGroupIsMemberHint = (postId: number) => (state: RootState): boolean | undefined => {
  const p = state.posts.byId[postId] as PostDetailData | undefined;
  return p?.group?.is_member;
};

const initialState: PostsState = {
  byId: {},
  current: null,
  lists: {},

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

const patchInAllFeeds = (
  state: PostsState,
  postId: number,
  patch: Partial<PostListItemApi> & { clicked_like?: boolean }
) => {
  for (const key of Object.keys(state.lists)) {
    const feed = state.lists[key];
    if (!feed || !Array.isArray(feed.items)) continue;
    const idx = feed.items.findIndex((p) => p.id === postId);
    if (idx >= 0) feed.items[idx] = { ...feed.items[idx], ...patch };
  }
};

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    resetPostsState: () => initialState,
    clearFeed(state, action: { payload: string }) {
      state.lists[action.payload] = initFeed();
    },

  },
  extraReducers: (builder) => {
    /** ====== 列表（mine / subscribed / group） ====== */
    const pending = (state: PostsState, sourceKey: string) => {
      if (!state.lists[sourceKey]) state.lists[sourceKey] = initFeed();
      state.lists[sourceKey].status = "loading";
      state.lists[sourceKey].error = null;
    };
    const fulfilled = (
      state: PostsState,
      sourceKey: string,
      payload: { posts: PostListItemApi[]; current_page: number; total_pages: number; total_posts: number; append: boolean }
    ) => {
      if (!state.lists[sourceKey]) state.lists[sourceKey] = initFeed();
      const feed = state.lists[sourceKey];
      feed.items = payload.append ? [...feed.items, ...payload.posts] : payload.posts;
      feed.current_page = payload.current_page;
      feed.total_pages = payload.total_pages;
      feed.total_posts = payload.total_posts;
      feed.status = "succeeded";
    };
    const rejected = (state: PostsState, sourceKey: string, message: string) => {
      if (!state.lists[sourceKey]) state.lists[sourceKey] = initFeed();
      state.lists[sourceKey].status = "failed";
      state.lists[sourceKey].error = message;
    };

    // group 列表
    builder
      .addCase(fetchGroupPostsList.pending, (s, a) => {
        const { groupId } = a.meta.arg;
        pending(s, sourceKeyOf("group", groupId));
      })
      .addCase(fetchGroupPostsList.fulfilled, (s, a) => {
        const { sourceKey, append, posts, current_page, total_pages, total_posts } = a.payload;
        fulfilled(s, sourceKey, { posts, current_page, total_pages, total_posts, append });
      })
      .addCase(fetchGroupPostsList.rejected, (s, a) => {
        const { groupId } = a.meta.arg;
        rejected(s, sourceKeyOf("group", groupId), (a.payload as string) || "Fetch posts failed");
      });

    // 我的帖子
    builder
      .addCase(fetchMyPosts.pending, (s) => pending(s, sourceKeyOf("mine")))
      .addCase(fetchMyPosts.fulfilled, (s, a) => {
        const { sourceKey, append, posts, current_page, total_pages, total_posts } = a.payload;
        fulfilled(s, sourceKey, { posts, current_page, total_pages, total_posts, append });
      })
      .addCase(fetchMyPosts.rejected, (s, a) => {
        rejected(s, sourceKeyOf("mine"), (a.payload as string) || "Fetch my posts failed");
      });

    // 订阅的帖子
    builder
      .addCase(fetchSubscribedPosts.pending, (s) => pending(s, sourceKeyOf("subscribed")))
      .addCase(fetchSubscribedPosts.fulfilled, (s, a) => {
        const { sourceKey, append, posts, current_page, total_pages, total_posts } = a.payload;
        fulfilled(s, sourceKey, { posts, current_page, total_pages, total_posts, append });
      })
      .addCase(fetchSubscribedPosts.rejected, (s, a) => {
        rejected(s, sourceKeyOf("subscribed"), (a.payload as string) || "Fetch subscribed posts failed");
      });

    /** ====== 详情/创建/更新/删除 ====== */
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

    // 附件 id
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


    // like覆盖当前 group 页面的post列表项（无需整页刷新）
    builder
      .addCase(likePost.fulfilled, (s, a) => {
        const { postId, like_count } = a.payload;
        patchInAllFeeds(s, postId, { like_count, clicked_like: true });
        const cur = s.byId[postId];
        if (cur) s.byId[postId] = { ...cur, like_count, clicked_like: true } as any;
        if (s.current?.id === postId) {
          s.current = { ...s.current, like_count, clicked_like: true } as any;
        }
      })
      .addCase(unlikePost.fulfilled, (s, a) => {
        const { postId, like_count } = a.payload;
        patchInAllFeeds(s, postId, { like_count, clicked_like: false });
        const cur = s.byId[postId];
        if (cur) s.byId[postId] = { ...cur, like_count, clicked_like: false } as any;
        if (s.current?.id === postId) {
          s.current = { ...s.current, like_count, clicked_like: false } as any;
        }
      });

  },
});

export const { resetPostsState, clearFeed } = postsSlice.actions;
export default postsSlice.reducer;
