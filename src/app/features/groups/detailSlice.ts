// app/features/groupDetail/slice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiRequest } from '../request';
import type { GroupProps, GroupDetailData, GroupListPaginationApi } from '@/app/types/group';
import { mapGroupApiToProps } from '@/app/types/group';
import type { PostProps } from '@/app/types';

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface GroupPostApi {
  id: number;
  title: string;
  author: { id: number; firstName: string };
  created_at: string;
  summary: string;
  like_count: number;
  has_files: boolean;
  has_videos: boolean;
}

const mapPostApiToProps = (p: GroupPostApi, groupId: number): PostProps => ({
  id: p.id,
  title: p.title,
  date: p.created_at,
  author: p.author?.firstName ?? '',
  group: String(groupId),
  description: p.summary,
  videoUrl: '',
  files: p.has_files ? [] : undefined,
});

interface GroupDetailState {
  group: GroupProps | null;
  subscriberCount: number | null;
  subscribers: Array<{ id: number; firstName: string; email: string }>;
  posts: PostProps[];
  postsPagination: {
    total_pages: number;
    current_page: number;
    total_posts: number;
  } | null;
  status: {
    group: LoadStatus;
    posts: LoadStatus;
  };
  error: {
    group: string | null;
    posts: string | null;
  };
}

const initialState: GroupDetailState = {
  group: null,
  subscriberCount: null,
  subscribers: [],
  posts: [],
  postsPagination: null,
  status: { group: 'idle', posts: 'idle' },
  error: { group: null, posts: null },
};


// 获取单个群详情：/groups/:id
export const fetchGroupDetail = createAsyncThunk<
  { group: GroupProps; subscriberCount: number; subscribers: GroupDetailState['subscribers'] },
  number
>('groupDetail/fetchGroupDetail', async (groupId, { rejectWithValue }) => {
  try {
    const res = await apiRequest<GroupDetailData>('GET', `/groups/${groupId}`);
    if (!res.success || !res.data) throw new Error(res.message || 'Fetch group detail failed');

    const uiGroup = mapGroupApiToProps(res.data);
    const subscriberCount = (res.data as any).subscriber_count ?? 0;
    const subscribers = res.data.subscribers ?? [];

    return { group: uiGroup, subscriberCount, subscribers };
  } catch (e: any) {
    return rejectWithValue(e.message || 'Fetch group detail failed') as any;
  }
});

// 获取群帖子：/groups/:id/posts?page=&per_page=
export const fetchGroupPosts = createAsyncThunk<
  {
    posts: PostProps[];
    current_page: number;
    total_pages: number;
    total_posts: number;
    append: boolean;
  },
  { groupId: number; page?: number; per_page?: number; append?: boolean }
>('groupDetail/fetchGroupPosts', async ({ groupId, page = 1, per_page = 20, append = false }, { rejectWithValue }) => {
  try {
    const qs = new URLSearchParams();
    if (page) qs.set('page', String(page));
    if (per_page) qs.set('per_page', String(per_page));

    const url = `/groups/${groupId}/posts${qs.toString() ? `?${qs.toString()}` : ''}`;
    const res = await apiRequest<{
      posts: GroupPostApi[];
      total_pages: number;
      current_page: number;
      total_posts: number;
    }>('GET', url);

    if (!res.success || !res.data) throw new Error(res.message || 'Fetch posts failed');

    const posts = (res.data.posts || []).map((p) => mapPostApiToProps(p, groupId));

    return {
      posts,
      current_page: res.data.current_page,
      total_pages: res.data.total_pages,
      total_posts: res.data.total_posts,
      append,
    };
  } catch (e: any) {
    return rejectWithValue(e.message || 'Fetch posts failed') as any;
  }
});

const groupDetailSlice = createSlice({
  name: 'groupDetail',
  initialState,
  reducers: {
    clearGroupDetail: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroupDetail.pending, (s) => { s.status.group = 'loading'; s.error.group = null; })
      .addCase(fetchGroupDetail.fulfilled, (s, a) => {
        s.status.group = 'succeeded';
        s.group = a.payload.group;
        s.subscriberCount = a.payload.subscriberCount;
        s.subscribers = a.payload.subscribers;
      })
      .addCase(fetchGroupDetail.rejected, (s, a) => {
        s.status.group = 'failed';
        s.error.group = (a.payload as string) || 'Fetch group detail failed';
      });

    // posts
    builder
      .addCase(fetchGroupPosts.pending, (s) => { s.status.posts = 'loading'; s.error.posts = null; })
      .addCase(fetchGroupPosts.fulfilled, (s, a) => {
        s.status.posts = 'succeeded';
        const { posts, current_page, total_pages, total_posts, append } = a.payload;
        s.posts = append ? [...s.posts, ...posts] : posts;
        s.postsPagination = { current_page, total_pages, total_posts };
      })
      .addCase(fetchGroupPosts.rejected, (s, a) => {
        s.status.posts = 'failed';
        s.error.posts = (a.payload as string) || 'Fetch posts failed';
      });
  },
});

export const { clearGroupDetail } = groupDetailSlice.actions;
export default groupDetailSlice.reducer;
