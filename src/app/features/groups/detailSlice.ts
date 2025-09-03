import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../request';
import { unwrapData } from "@/app/types";
import type { LoadStatus } from '@/app/types';
import type {
  GroupProps,
  GroupDetailData,
  GroupListPaginationApi,
  GroupSubscriberUi,
  MembersListData,
  AddMemberRequest,
  AddMemberResponseApi,
  KickMemberResponseApi
} from '@/app/types/group';
import type {
  PostListItemApi,
  PostListData,
} from '@/app/types';
import { mapGroupApiToProps } from '@/app/types/group';

interface GroupDetailState {
  currentGroupId: number | null;
  group: GroupProps | null;
  subscriberCount: number | null;
  subscribers: GroupSubscriberUi[];
  posts: PostListItemApi[];
  postsPagination: { current_page: number; total_pages: number; total_posts: number } | null;
  membersPagination: GroupListPaginationApi | null;
  status: {
    group: LoadStatus;
    posts: LoadStatus;
    members: LoadStatus;
    addMember: LoadStatus;
    kickMember: LoadStatus;
  };
  error: {
    group: string | null;
    posts: string | null;
    members: string | null;
    addMember: string | null;
    kickMember: string | null;
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
  membersPagination: null,
  status: { group: 'idle', posts: 'idle', members: 'idle', addMember: 'idle', kickMember: 'idle' },
  error: { group: null, posts: null, members: null, addMember: null, kickMember: null },
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
    posts: PostListItemApi[];
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

    // ⬇️ 直接用严格 API 类型
    const res = await apiRequest<PostListData>('GET', url);
    if (!res.success || !res.data) throw new Error(res.message || 'Fetch posts failed');

    // ⬇️ 不再做 UI 映射，直接使用后端返回
    const { posts, current_page, total_pages, total_posts } = res.data;

    return { posts, current_page, total_pages, total_posts, append };
  } catch (e: any) {
    return rejectWithValue(e.message || 'Fetch posts failed') as any;
  }
});

// ===== 订阅成员：获取列表 /api/groups/{group_id}/members?page=&per_page=
export const fetchGroupMembers = createAsyncThunk<
  { members: GroupSubscriberUi[]; pagination: GroupListPaginationApi },
  { groupId: number; page?: number; per_page?: number }
>(
  'groupDetail/fetchGroupMembers',
  async ({ groupId, page = 1, per_page = 20 }, { rejectWithValue }) => {
    try {
      const qs = new URLSearchParams();
      qs.set('page', String(page));
      qs.set('per_page', String(per_page));

      const res = await apiRequest<MembersListData>('GET', `/groups/${groupId}/members?${qs.toString()}`);
      const data = unwrapData(res);

      const members: GroupSubscriberUi[] = (data.members ?? []).map(m => ({
        id: m.id,
        firstName: m.firstName ?? "",
        email: m.email ?? "",
      }));

      return { members, pagination: data.pagination };
    } catch (e: any) {
      return rejectWithValue(e.message || 'Fetch members failed') as any;
    }
  }
);

// ===== 订阅成员：添加成员 /api/groups/{group_id}/members (POST)
export const addGroupMember = createAsyncThunk<
  { member: GroupSubscriberUi; message?: string },
  { groupId: number } & AddMemberRequest
>('groupDetail/addGroupMember', async ({ groupId, ...body }, { rejectWithValue }) => {
  try {
    const res = await apiRequest<AddMemberResponseApi['data']>('POST', `/groups/${groupId}/members`, body);
    if (!res.success || !res.data) throw new Error(res.message || 'Add member failed');
    const m = res.data.member;
    return {
      member: {
        id: m.id,
        firstName: m.firstName ?? '',
        email: m.email ?? '',
        is_creator: !!m.is_creator,
      },
      message: res.message,
    };
  } catch (e: any) {
    return rejectWithValue(e.message || 'Add member failed') as any;
  }
});

// ===== 订阅成员：踢成员 /api/groups/{group_id}/members/{user_id}/kick (POST)
export const kickGroupMember = createAsyncThunk<
  { userId: number; message?: string },
  { groupId: number; userId: number }
>('groupDetail/kickGroupMember', async ({ groupId, userId }, { rejectWithValue }) => {
  try {
    const res = await apiRequest<KickMemberResponseApi['data']>('POST', `/groups/${groupId}/members/${userId}/kick`);
    if (!res.success) throw new Error(res.message || 'Kick member failed');
    return { userId, message: res.message };
  } catch (e: any) {
    return rejectWithValue(e.message || 'Kick member failed') as any;
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

        s.group = null;
        s.subscriberCount = null;
        s.subscribers = [];

        s.posts = [];
        s.postsPagination = null;
        s.status.posts = 'idle';
        s.error.posts = null;
      })
      .addCase(fetchGroupDetail.fulfilled, (s, a) => {
        const id = a.meta.arg as number;
        if (s.currentGroupId !== id) return;
        s.status.group = 'succeeded';
        s.group = a.payload.group;
        s.subscriberCount = a.payload.subscriberCount;
        s.subscribers = a.payload.subscribers;
      })
      .addCase(fetchGroupDetail.rejected, (s, a) => {
        const id = a.meta.arg as number;
        if (s.currentGroupId !== id) return;
        s.status.group = 'failed';
        s.error.group = (a.payload as string) || 'Fetch group detail failed';
      });

    // ===== posts =====
    builder
      .addCase(fetchGroupPosts.pending, (s, a) => {
        const { groupId } = a.meta.arg as { groupId: number };
        if (s.currentGroupId !== groupId) return;
        s.status.posts = 'loading';
        s.error.posts = null;
      })
      .addCase(fetchGroupPosts.fulfilled, (s, a) => {
        const { groupId, append } = a.meta.arg as { groupId: number; append?: boolean };
        if (s.currentGroupId !== groupId) return;
        s.status.posts = 'succeeded';
        const { posts, current_page, total_pages, total_posts } = a.payload;
        s.posts = append ? [...s.posts, ...posts] : posts;
        s.postsPagination = { current_page, total_pages, total_posts };
      })
      .addCase(fetchGroupPosts.rejected, (s, a) => {
        const { groupId } = a.meta.arg as { groupId: number };
        if (s.currentGroupId !== groupId) return;
        s.status.posts = 'failed';
        s.error.posts = (a.payload as string) || 'Fetch posts failed';
      });

    // ===== members list =====
    builder
      .addCase(fetchGroupMembers.pending, (s, a) => {
        const { groupId } = a.meta.arg;
        if (s.currentGroupId !== groupId) return;
        s.status.members = 'loading';
        s.error.members = null;
      })
      .addCase(fetchGroupMembers.fulfilled, (s, a) => {
        s.status.members = 'succeeded';
        s.subscribers = a.payload.members;
        s.membersPagination = a.payload.pagination;
        s.subscriberCount = a.payload.pagination?.total ?? a.payload.members.length;
      })
      .addCase(fetchGroupMembers.rejected, (s, a) => {
        s.status.members = 'failed';
        s.error.members = (a.payload as string) || 'Fetch members failed';
      });

    // ===== add member =====
    builder
      .addCase(addGroupMember.pending, (s, a) => {
        const { groupId } = a.meta.arg;
        if (s.currentGroupId !== groupId) return;
        s.status.addMember = 'loading';
        s.error.addMember = null;
      })
      .addCase(addGroupMember.fulfilled, (s, a) => {
        s.status.addMember = 'succeeded';
        // 乐观插入到当前列表顶部
        s.subscribers = [a.payload.member, ...s.subscribers];
        if (typeof s.subscriberCount === 'number') s.subscriberCount += 1;
      })
      .addCase(addGroupMember.rejected, (s, a) => {
        s.status.addMember = 'failed';
        s.error.addMember = (a.payload as string) || 'Add member failed';
      });

    // ===== kick member =====
    builder
      .addCase(kickGroupMember.pending, (s, a) => {
        const { groupId } = a.meta.arg;
        if (s.currentGroupId !== groupId) return;
        s.status.kickMember = 'loading';
        s.error.kickMember = null;
      })
      .addCase(kickGroupMember.fulfilled, (s, a) => {
        s.status.kickMember = 'succeeded';
        const kickedId = a.payload.userId;
        s.subscribers = s.subscribers.filter((m) => m.id !== kickedId);
        if (typeof s.subscriberCount === 'number' && s.subscriberCount > 0) s.subscriberCount -= 1;
      })
      .addCase(kickGroupMember.rejected, (s, a) => {
        s.status.kickMember = 'failed';
        s.error.kickMember = (a.payload as string) || 'Kick member failed';
      });

  },
});

export const { clearGroupDetail } = groupDetailSlice.actions;
export default groupDetailSlice.reducer;
