import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiRequest } from "../request";
import type { LoadStatus } from "@/app/types";
import type {
  LikePostData,
  UnlikePostData,
  PostLikesData,
  postsPagination,
} from "@/app/types";
import { errMsg } from '@/app/features/auth/slice'

const LIKE_ENDPOINT = (postId: number) => `/posts/${postId}/like`;
const LIKES_LIST_ENDPOINT = (postId: number) => `/posts/${postId}/likes`;

// 点赞
export const likePost = createAsyncThunk<{ postId: number; like_count: number }, number>(
  "likes/likePost",
  async (postId, { rejectWithValue }) => {
    try {
      const res = await apiRequest<LikePostData>("POST", LIKE_ENDPOINT(postId));
      if (!res.success || typeof res.data?.like_count !== "number") {
        throw new Error(res.message || "Like post failed");
      }
      return { postId, like_count: res.data.like_count };
    } catch (e: any) {
      return rejectWithValue(errMsg(e, "Like post failed"));
    }
  }
);

// 取消点赞
export const unlikePost = createAsyncThunk<{ postId: number; like_count: number }, number>(
  "likes/unlikePost",
  async (postId, { rejectWithValue }) => {
    try {
      const res = await apiRequest<UnlikePostData>("DELETE", LIKE_ENDPOINT(postId));
      if (!res.success || typeof res.data?.like_count !== "number") {
        throw new Error(res.message || "Unlike post failed");
      }
      return { postId, like_count: res.data.like_count };
    } catch (e: any) {
      return rejectWithValue(errMsg(e, "Unlike post failed"));
    }
  }
);

// 获取点赞列表
export const fetchPostLikes = createAsyncThunk<
  { postId: number; likes: PostLikesData["likes"]; pagination: PostLikesData["pagination"] },
  { postId: number; page?: number; per_page?: number }
>("likes/fetchPostLikes", async ({ postId, page = 1, per_page = 20 }, { rejectWithValue }) => {
  try {
    const qs = new URLSearchParams();
    if (page) qs.set("page", String(page));
    if (per_page) qs.set("per_page", String(per_page));
    const url = `${LIKES_LIST_ENDPOINT(postId)}${qs.toString() ? `?${qs}` : ""}`;

    const res = await apiRequest<PostLikesData>("GET", url);
    if (!res.success || !res.data) throw new Error(res.message || "Fetch likes failed");

    return { postId, likes: res.data.likes, pagination: res.data.pagination };
  } catch (e: any) {
    return rejectWithValue(errMsg(e, "Fetch likes failed"));
  }
});

/** ============ State ============ */

type LikesListPerPost = {
  list: Array<{ id: number; user: { id: number; firstName: string }; created_at: string }>;
  pagination: postsPagination | null;
};

interface LikesState {
  countByPostId: Record<number, number>;
  likedByMeByPostId: Record<number, boolean>;
  listByPostId: Record<number, LikesListPerPost>;
  status: Record<string, LoadStatus>;
  error: Record<string, string | null>;
}

const initialState: LikesState = {
  countByPostId: {},
  likedByMeByPostId: {},
  listByPostId: {},
  status: {},
  error: {},
};

/** ============ Slice ============ */

const setStatus = (s: LikesState, k: string, v: LoadStatus) => {
  s.status[k] = v;
};
const setError = (s: LikesState, k: string, v: string | null) => {
  s.error[k] = v;
};


const likesSlice = createSlice({
  name: "likes",
  initialState,
  reducers: {
    setLikeCount(state, action: PayloadAction<{ postId: number; like_count: number }>) {
      const { postId, like_count } = action.payload;
      state.countByPostId[postId] = like_count;
    },
    setLikedByMe(state, action: PayloadAction<{ postId: number; liked: boolean }>) {
      const { postId, liked } = action.payload;
      state.likedByMeByPostId[postId] = liked;
    },
    resetLikesState: () => initialState,
  },
  extraReducers: (builder) => {
    // like
    builder
      .addCase(likePost.pending, (s) => {
        setStatus(s, "likePost", "loading");
        setError(s, "likePost", null);
      })
      .addCase(likePost.fulfilled, (s, a) => {
        setStatus(s, "likePost", "succeeded");
        const { postId, like_count } = a.payload;
        s.countByPostId[postId] = like_count;
        s.likedByMeByPostId[postId] = true;
      })
      .addCase(likePost.rejected, (s, a) => {
        setStatus(s, "likePost", "failed");
        setError(s, "likePost", (a.payload as string) || "Like post failed");
      });

    // unlike
    builder
      .addCase(unlikePost.pending, (s) => {
        setStatus(s, "unlikePost", "loading");
        setError(s, "unlikePost", null);
      })
      .addCase(unlikePost.fulfilled, (s, a) => {
        setStatus(s, "unlikePost", "succeeded");
        const { postId, like_count } = a.payload;
        s.countByPostId[postId] = like_count;
        s.likedByMeByPostId[postId] = false;
      })
      .addCase(unlikePost.rejected, (s, a) => {
        setStatus(s, "unlikePost", "failed");
        setError(s, "unlikePost", (a.payload as string) || "Unlike post failed");
      });

    // likes list
    builder
      .addCase(fetchPostLikes.pending, (s) => {
        setStatus(s, "fetchPostLikes", "loading");
        setError(s, "fetchPostLikes", null);
      })
      .addCase(fetchPostLikes.fulfilled, (s, a) => {
        setStatus(s, "fetchPostLikes", "succeeded");
        const { postId, likes, pagination } = a.payload;
        s.listByPostId[postId] = { list: likes, pagination };
      })
      .addCase(fetchPostLikes.rejected, (s, a) => {
        setStatus(s, "fetchPostLikes", "failed");
        setError(s, "fetchPostLikes", (a.payload as string) || "Fetch likes failed");
      });
  },
});

export const { setLikeCount, setLikedByMe, resetLikesState } = likesSlice.actions;
export default likesSlice.reducer;

/** ============ Selectors（可选） ============ */
export const selectLikeCount =
  (postId: number) => (state: any): number | undefined =>
    state.likes?.countByPostId?.[postId];

export const selectLikedByMe =
  (postId: number) => (state: any): boolean | undefined =>
    state.likes?.likedByMeByPostId?.[postId];

export const selectLikesList =
  (postId: number) =>
    (state: any /* RootState */): LikesListPerPost | undefined =>
      state.likes?.listByPostId?.[postId];
