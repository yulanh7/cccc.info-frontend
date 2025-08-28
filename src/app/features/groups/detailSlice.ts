// app/features/groupDetail/slice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../request';

import type {
  LoadStatus,
} from '@/app/types'; // 如果没有 barrel，就删掉这行，换成你放 LoadStatus 的地方

import type {
  GroupProps,
  GroupDetailData,
  GroupListPaginationApi,
  GroupSubscriberUi,
} from '@/app/types/group';

import type {
  GroupPostApi,
  PostListUi,
  GroupPostsPaginationApi, // 确保在 posts.ts 导出了这个类型
} from '@/app/types/post';

import { mapGroupApiToProps } from '@/app/types/group';
import { mapGroupPostApiToListUi } from '@/app/types/post';

interface GroupDetailState {
  currentGroupId: number | null;
  group: GroupProps | null;

  subscriberCount: number | null;
  subscribers: GroupSubscriberUi[];

  posts: PostListUi[];

  postsPagination: GroupPostsPaginationApi | null;

  status: {
    group: LoadStatus;
    posts: LoadStatus;
  };
  error: {
    group: string | null;
    posts: string | null;
  };
}

// 如果这个 state 不是本 slice 使用，建议挪到对应的 groups 列表 slice；保留也无妨
interface GroupsState {
  currentGroup: GroupProps | null;

  availableGroups: GroupProps[];
  availableGroupsPagination: GroupListPaginationApi | null;

  userGroups: GroupProps[];
  userGroupsPagination: GroupListPaginationApi | null;

  userMembership: Record<number, true>;

  searchQuery: string;
  searchResults: GroupProps[];
  searchPagination: GroupListPaginationApi | null;

  status: Record<string, LoadStatus>;
  error: Record<string, string | null>;
}

const initialState: GroupDetailState = {
  currentGroupId: null,
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
  { group: GroupProps; subscriberCount: number; subscribers: GroupSubscriberUi[] },
  number
>('groupDetail/fetchGroupDetail', async (groupId, { rejectWithValue }) => {
  try {
    const res = await apiRequest<GroupDetailData>('GET', `/groups/${groupId}`);
    if (!res.success || !res.data) throw new Error(res.message || 'Fetch group detail failed');

    const uiGroup = mapGroupApiToProps(res.data);
    const subscriberCount = (res.data as any).subscriber_count ?? 0;
    // 这里保持与 GroupSubscriberUi 一致的形状（字段名相同，无需额外映射）
    const subscribers: GroupSubscriberUi[] = (res.data.subscribers ?? []).map(s => ({
      id: s.id,
      firstName: s.firstName ?? '',
      email: s.email ?? '',
    }));

    return { group: uiGroup, subscriberCount, subscribers };
  } catch (e: any) {
    return rejectWithValue(e.message || 'Fetch group detail failed') as any;
  }
});

// 获取群帖子：/groups/:id/posts?page=&per_page=
export const fetchGroupPosts = createAsyncThunk<
  {
    posts: PostListUi[];              // ✅ 修正为 PostListUi[]
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

    const posts: PostListUi[] = (res.data.posts || []).map((p) =>
      mapGroupPostApiToListUi(p, groupId)
    );

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
    // ===== group detail =====
    builder
      .addCase(fetchGroupDetail.pending, (s, a) => {
        const id = a.meta.arg as number;
        s.currentGroupId = id;
        s.status.group = 'loading';
        s.error.group = null;

        // 切换群时：立即清空旧数据，避免旧数据闪现
        s.group = null;
        s.subscriberCount = null;
        s.subscribers = [];

        // 也清空 posts（页面里只做 posts 局部加载提示）
        s.posts = [];
        s.postsPagination = null;
        s.status.posts = 'idle';
        s.error.posts = null;
      })
      .addCase(fetchGroupDetail.fulfilled, (s, a) => {
        const id = a.meta.arg as number;
        if (s.currentGroupId !== id) return; // 竞态防护
        s.status.group = 'succeeded';
        s.group = a.payload.group;
        s.subscriberCount = a.payload.subscriberCount;
        s.subscribers = a.payload.subscribers;
      })
      .addCase(fetchGroupDetail.rejected, (s, a) => {
        const id = a.meta.arg as number;
        if (s.currentGroupId !== id) return; // 竞态防护
        s.status.group = 'failed';
        s.error.group = (a.payload as string) || 'Fetch group detail failed';
      });

    // ===== posts =====
    builder
      .addCase(fetchGroupPosts.pending, (s, a) => {
        const { groupId } = a.meta.arg as { groupId: number };
        if (s.currentGroupId !== groupId) return; // 竞态防护
        s.status.posts = 'loading';
        s.error.posts = null;
        // 不清空 s.posts，保持 UI 只出现局部轻提示
      })
      .addCase(fetchGroupPosts.fulfilled, (s, a) => {
        const { groupId, append } = a.meta.arg as { groupId: number; append?: boolean };
        if (s.currentGroupId !== groupId) return; // 竞态防护
        s.status.posts = 'succeeded';
        const { posts, current_page, total_pages, total_posts } = a.payload;
        s.posts = append ? [...s.posts, ...posts] : posts;
        s.postsPagination = { current_page, total_pages, total_posts };
      })
      .addCase(fetchGroupPosts.rejected, (s, a) => {
        const { groupId } = a.meta.arg as { groupId: number };
        if (s.currentGroupId !== groupId) return; // 竞态防护
        s.status.posts = 'failed';
        s.error.posts = (a.payload as string) || 'Fetch posts failed';
      });
  },
});

export const { clearGroupDetail } = groupDetailSlice.actions;
export default groupDetailSlice.reducer;
