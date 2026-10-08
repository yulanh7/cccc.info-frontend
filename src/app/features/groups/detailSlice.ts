import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../request';
import { unwrapData } from "@/app/types";
import type { LoadStatus } from '@/app/types';
import type {
  GroupApi,
  GroupDetailData,
  GroupListPaginationApi,
  MembersListData,
  AddMemberRequest,
  AddMemberResponseApi,
  KickMemberResponseApi,
  AddLeaderResponseApi,
  TransferOwnershipResponseApi,
} from '@/app/types/group';
import type {
  PostListItemApi,
} from '@/app/types';
import { fetchGroupPostsList } from '@/app/features/posts/slice';
import { appendUnique } from '@/app/lib/infiniteList';
import { likePost, unlikePost } from "@/app/features/posts/likeSlice";
import { setGroupInvite, resetGroupInvite } from './inviteSlice';
import { sendJoinRequest, withdrawJoinRequest, approveJoinRequest, declineJoinRequest } from './joinRequestSlice';
import { errorMessage } from "@/app/lib/errors";

// 简单的订阅者 UI 形状（与后端 subscribers 项一致）
type GroupSubscriberUi = { id: number; firstName: string; email: string; is_creator?: boolean; is_leader?: boolean };

interface GroupDetailState {
  currentGroupId: number | null;
  group: GroupApi | null;
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
    leader: LoadStatus;
  };
  error: {
    group: string | null;
    posts: string | null;
    members: string | null;
    addMember: string | null;
    kickMember: string | null;
    leader: string | null;
  };
}

const initialState: GroupDetailState = {
  currentGroupId: null,
  group: null,
  subscriberCount: null,
  subscribers: [],
  posts: [],
  postsPagination: null,
  membersPagination: null,
  status: { group: 'idle', posts: 'idle', members: 'idle', addMember: 'idle', kickMember: 'idle', leader: 'idle' },
  error: { group: null, posts: null, members: null, addMember: null, kickMember: null, leader: null },
};

// 获取单个群详情：/groups/:id
export const fetchGroupDetail = createAsyncThunk<
  { group: GroupApi; subscriberCount: number; subscribers: GroupSubscriberUi[] },
  number
>('groupDetail/fetchGroupDetail', async (groupId, { rejectWithValue }) => {
  try {
    const res = await apiRequest<GroupDetailData>('GET', `/groups/${groupId}`);
    if (!res.success || !res.data) throw new Error(res.message || 'Fetch group detail failed');
    const group = res.data;
    const subscriberCount = res.data.subscriber_count ?? 0;
    const subscribers: GroupSubscriberUi[] = (res.data.subscribers ?? []).map(s => ({
      id: s.id,
      firstName: s.firstName ?? '',
      email: s.email ?? '',
      is_creator: s.is_creator,
      is_leader: s.is_leader,
    }));

    return { group, subscriberCount, subscribers };
  } catch (e) {
    return rejectWithValue(errorMessage(e, 'Fetch group detail failed')) as any;
  }
});

// ===== 成员列表：GET /api/groups/{group_id}/members
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
        is_creator: m.is_creator,
        is_leader: m.is_leader,
      }));

      return { members, pagination: data.pagination };
    } catch (e) {
      return rejectWithValue(errorMessage(e, 'Fetch members failed')) as any;
    }
  }
);

// ===== 添加成员：POST /api/groups/{group_id}/members
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
      },
      message: res.message,
    };
  } catch (e) {
    return rejectWithValue(errorMessage(e, 'Add member failed')) as any;
  }
});

// ===== 踢成员：POST /api/groups/{group_id}/members/{user_id}/kick
export const kickGroupMember = createAsyncThunk<
  { userId: number; message?: string },
  { groupId: number; userId: number }
>('groupDetail/kickGroupMember', async ({ groupId, userId }, { rejectWithValue }) => {
  try {
    const res = await apiRequest<KickMemberResponseApi['data']>('POST', `/groups/${groupId}/members/${userId}/kick`);
    if (!res.success) throw new Error(res.message || 'Kick member failed');
    return { userId, message: res.message };
  } catch (e) {
    return rejectWithValue(errorMessage(e, 'Kick member failed')) as any;
  }
});

// ===== 设为组长：POST /api/groups/{group_id}/leaders（admin / 创建者 / 任一组长）
export const addGroupLeader = createAsyncThunk<
  { userId: number; message?: string },
  { groupId: number; userId: number }
>('groupDetail/addGroupLeader', async ({ groupId, userId }, { rejectWithValue }) => {
  try {
    const res = await apiRequest<AddLeaderResponseApi['data']>('POST', `/groups/${groupId}/leaders`, { user_id: userId });
    if (!res.success) throw new Error(res.message || 'Set leader failed');
    return { userId, message: res.message };
  } catch (e) {
    return rejectWithValue(errorMessage(e, 'Set leader failed')) as any;
  }
});

// ===== 取消组长：DELETE /api/groups/{group_id}/leaders（不能取消创建者）
export const removeGroupLeader = createAsyncThunk<
  { userId: number; message?: string },
  { groupId: number; userId: number }
>('groupDetail/removeGroupLeader', async ({ groupId, userId }, { rejectWithValue }) => {
  try {
    const res = await apiRequest<Record<string, never>>('DELETE', `/groups/${groupId}/leaders`, { user_id: userId });
    if (!res.success) throw new Error(res.message || 'Remove leader failed');
    return { userId, message: res.message };
  } catch (e) {
    return rejectWithValue(errorMessage(e, 'Remove leader failed')) as any;
  }
});

// ===== 组长名单：没有单独接口，拉全部成员页后按 is_leader 过滤（供转让创建者选人）
export const fetchGroupLeaders = createAsyncThunk<
  GroupSubscriberUi[],
  { groupId: number }
>('groupDetail/fetchGroupLeaders', async ({ groupId }, { rejectWithValue }) => {
  try {
    const leaders: GroupSubscriberUi[] = [];
    let page = 1;
    let pages = 1;
    do {
      const res = await apiRequest<MembersListData>('GET', `/groups/${groupId}/members?page=${page}&per_page=50`);
      const data = unwrapData(res);
      (data.members ?? []).forEach((m) => {
        if (m.is_leader) {
          leaders.push({ id: m.id, firstName: m.firstName ?? '', email: m.email ?? '', is_creator: m.is_creator, is_leader: true });
        }
      });
      pages = data.pagination?.pages ?? 1;
      page += 1;
    } while (page <= pages);
    return leaders;
  } catch (e) {
    return rejectWithValue(errorMessage(e, 'Fetch leaders failed')) as any;
  }
});

// ===== 转让创建者：POST /api/groups/{group_id}/transfer-ownership（仅 admin / 当前创建者，目标必须已是组长）
export const transferGroupOwnership = createAsyncThunk<
  { group: GroupApi; message?: string },
  { groupId: number; userId: number }
>('groupDetail/transferGroupOwnership', async ({ groupId, userId }, { rejectWithValue }) => {
  try {
    const res = await apiRequest<TransferOwnershipResponseApi['data']>('POST', `/groups/${groupId}/transfer-ownership`, { user_id: userId });
    if (!res.success || !res.data?.group) throw new Error(res.message || 'Transfer ownership failed');
    return { group: res.data.group, message: res.message };
  } catch (e) {
    return rejectWithValue(errorMessage(e, 'Transfer ownership failed')) as any;
  }
});

const patchPostById = (
  arr: PostListItemApi[] | undefined,
  postId: number,
  patch: Partial<PostListItemApi> & { clicked_like?: boolean }
) => {
  if (!Array.isArray(arr)) return;
  const idx = arr.findIndex((p) => p?.id === postId);
  if (idx >= 0) arr[idx] = { ...arr[idx], ...patch };
};


const groupDetailSlice = createSlice({
  name: 'groupDetail',
  initialState,
  reducers: {
    clearGroupDetail: () => initialState,
    /** 加入申请列表拉到 / 变化后，用列表的条数校正 pending_request_count */
    setPendingRequestCount: (s, a: { payload: { groupId: number; count: number } }) => {
      if (s.group?.id === a.payload.groupId) s.group.pending_request_count = a.payload.count;
    },
  },
  extraReducers: (builder) => {
    // ===== 邀请链接：打开 / 关闭、重新生成后，同步到当前小组资料（再打开编辑弹窗时显示最新状态）
    builder
      .addCase(setGroupInvite.fulfilled, (s, a) => {
        if (s.group?.id === a.meta.arg.groupId) Object.assign(s.group, a.payload);
      })
      .addCase(resetGroupInvite.fulfilled, (s, a) => {
        if (s.group?.id === a.meta.arg) Object.assign(s.group, a.payload);
      });

    // ===== group detail =====
    builder
      .addCase(fetchGroupDetail.pending, (s, a) => {
        const id = a.meta.arg as number;
        const sameGroup = s.currentGroupId === id;
        s.currentGroupId = id;
        s.status.group = 'loading';
        s.error.group = null;

        s.group = null;
        s.subscriberCount = null;
        s.subscribers = [];

        // 换了小组才重置帖子区域；同一个小组（例如返回）保留已加载的帖子，无限滚动可以沿用
        if (!sameGroup) {
          s.posts = [];
          s.postsPagination = null;
          s.status.posts = 'idle';
          s.error.posts = null;
        }
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

    builder
      .addCase(fetchGroupPostsList.pending, (s, a) => {
        const { groupId } = a.meta.arg;
        if (s.currentGroupId !== groupId) return;
        s.status.posts = 'loading';
        s.error.posts = null;
      })
      .addCase(fetchGroupPostsList.fulfilled, (s, a) => {
        const { groupId, append } = a.meta.arg as { groupId: number; append?: boolean };
        if (s.currentGroupId !== groupId) return;
        s.status.posts = 'succeeded';
        const { posts, current_page, total_pages, total_posts } = a.payload;
        // 追加时按 id 去重（浏览期间有新帖子，后面的页会后移）
        s.posts = append ? appendUnique(s.posts, posts, (p) => p.id) : posts;
        s.postsPagination = { current_page, total_pages, total_posts };
      })
      .addCase(fetchGroupPostsList.rejected, (s, a) => {
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

    // ===== set / remove leader =====
    builder
      .addCase(addGroupLeader.pending, (s) => {
        s.status.leader = 'loading';
        s.error.leader = null;
      })
      .addCase(addGroupLeader.fulfilled, (s, a) => {
        s.status.leader = 'succeeded';
        const m = s.subscribers.find((x) => x.id === a.payload.userId);
        if (m) m.is_leader = true;
      })
      .addCase(addGroupLeader.rejected, (s, a) => {
        s.status.leader = 'failed';
        s.error.leader = (a.payload as string) || 'Set leader failed';
      })
      .addCase(removeGroupLeader.pending, (s) => {
        s.status.leader = 'loading';
        s.error.leader = null;
      })
      .addCase(removeGroupLeader.fulfilled, (s, a) => {
        s.status.leader = 'succeeded';
        const m = s.subscribers.find((x) => x.id === a.payload.userId);
        if (m) m.is_leader = false;
      })
      .addCase(removeGroupLeader.rejected, (s, a) => {
        s.status.leader = 'failed';
        s.error.leader = (a.payload as string) || 'Remove leader failed';
      });

    // ===== transfer ownership：用返回的 group 覆盖（creator / is_creator 已更新）
    builder
      .addCase(transferGroupOwnership.fulfilled, (s, a) => {
        if (s.currentGroupId !== a.payload.group.id) return;
        s.group = { ...s.group, ...a.payload.group } as GroupApi;
      });

    // ===== 加入申请：申请人看 my_join_request；管理者看 pending_request_count，批准后成员数 +1
    builder
      .addCase(sendJoinRequest.fulfilled, (s, a) => {
        const { groupId, join_request: r } = a.payload;
        if (s.group?.id !== groupId) return;
        s.group.my_join_request = { id: r.id, status: 'pending', created_at: r.created_at, message: r.message };
      })
      .addCase(withdrawJoinRequest.fulfilled, (s, a) => {
        if (s.group?.id === a.payload.groupId) s.group.my_join_request = null;
      })
      .addCase(approveJoinRequest.fulfilled, (s, a) => {
        if (s.group?.id !== a.payload.groupId) return;
        s.group.pending_request_count = a.payload.pending_request_count;
        s.group.subscriber_count = (s.group.subscriber_count ?? 0) + 1;
        if (s.subscriberCount !== null) s.subscriberCount += 1;
      })
      .addCase(declineJoinRequest.fulfilled, (s, a) => {
        if (s.group?.id === a.payload.groupId) s.group.pending_request_count = a.payload.pending_request_count;
      });

    // like覆盖当前 group 页面的post列表项（无需整页刷新）
    builder
      .addCase(likePost.fulfilled, (s, a) => {
        const { postId, like_count } = a.payload;
        patchPostById(s.posts, postId, { like_count, clicked_like: true });
      })
      .addCase(unlikePost.fulfilled, (s, a) => {
        const { postId, like_count } = a.payload;
        patchPostById(s.posts, postId, { like_count, clicked_like: false });
      });
  },
});

export const { clearGroupDetail, setPendingRequestCount } = groupDetailSlice.actions;
export default groupDetailSlice.reducer;
