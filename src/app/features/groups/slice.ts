import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiRequest } from '../request';
import type {
  GroupApi,
  CreateOrUpdateGroupBody,
  GroupListPaginationApi,
  GroupDetailData,
  RawUserGroup,
  RawAllGroup
} from '@/app/types/group';
import { normalizeFromUserGroups, normalizeFromAllGroups } from '@/app/types/group';
import type { LoadStatus } from '@/app/types';
import type { RootState, AppDispatch } from '@/app/features/store';

const GROUP_ENDPOINTS = {
  CREATE_GROUP: '/groups',
  AVAILABLE_GROUPS: '/groups/available',
  USER_GROUPS: '/user/groups',                    // 我创建的群组
  USER_SUBSCRIBED_GROUPS: '/user/subscribed-groups', // 我订阅的群组（新增）
  ALL_GROUPS: '/groups',
  UPDATE_GROUP: (id: number) => `/groups/${id}`,
  DELETE_GROUP: (id: number) => `/groups/${id}`,
  SEARCH_GROUPS: '/groups/search',
  JOIN_GROUP: (id: number) => `/groups/${id}/join`,
  LEAVE_GROUP: (id: number) => `/groups/${id}/leave`,
  GROUP_DETAIL: (id: number) => `/groups/${id}`,
  VISIBLE_GROUPS: '/groups/visible',
  VISIBLE_SEARCH: '/groups/visible/search',
} as const;

interface GroupsState {
  currentGroup: GroupApi | null;

  availableGroups: GroupApi[];
  availableGroupsPagination: GroupListPaginationApi | null;

  /** 我创建的群组 */
  userGroups: GroupApi[];
  userGroupsPagination: GroupListPaginationApi | null;

  /** 我订阅的群组 */
  subscribedGroups: GroupApi[];
  subscribedGroupsPagination: GroupListPaginationApi | null;

  visibleGroups: GroupApi[];
  visibleGroupsPagination: GroupListPaginationApi | null;

  /** 订阅成员映射（仅来自 subscribedGroups） */
  userMembership: Record<number, boolean>;

  searchQuery: string;
  visibleSearchResults: GroupApi[];
  visibleSearchPagination: GroupListPaginationApi | null;
  searchResults: GroupApi[];
  searchPagination: GroupListPaginationApi | null;

  status: Record<string, LoadStatus>;
  error: Record<string, string | null>;
}

const initialState: GroupsState = {
  currentGroup: null,
  availableGroups: [],
  availableGroupsPagination: null,

  userGroups: [],
  userGroupsPagination: null,

  subscribedGroups: [],
  subscribedGroupsPagination: null,

  visibleGroups: [],
  visibleGroupsPagination: null,
  visibleSearchResults: [],
  visibleSearchPagination: null,

  userMembership: {},

  searchQuery: '',
  searchResults: [],
  searchPagination: null,

  status: {},
  error: {},
};

const setStatus = (state: GroupsState, key: string, value: LoadStatus) => {
  state.status[key] = value;
};
const setError = (state: GroupsState, key: string, value: string | null) => {
  state.error[key] = value;
};
const replaceInList = (list: GroupApi[], updated: GroupApi) => {
  const i = list.findIndex((g) => g.id === updated.id);
  if (i >= 0) list[i] = updated;
};

/** 2.5 Create group（创建后放入我创建的群组 userGroups） */
export const createGroup = createAsyncThunk<GroupApi, CreateOrUpdateGroupBody>(
  'groups/createGroup',
  async (body, { rejectWithValue }) => {
    try {
      const res = await apiRequest<{ group: GroupApi }>('POST', GROUP_ENDPOINTS.CREATE_GROUP, body);
      if (!res.success || !res.data?.group) throw new Error(res.message || 'Create group failed');
      return res.data.group;
    } catch (e: any) {
      return rejectWithValue(e.message || 'Create group failed') as any;
    }
  }
);

/** 我创建的群组（/user/groups） */
export const fetchUserGroups = createAsyncThunk<
  { groups: GroupApi[]; pagination: GroupListPaginationApi },
  { page?: number; per_page?: number } | undefined,
  { state: RootState; dispatch: AppDispatch }
>('groups/fetchUserGroups', async (params, { rejectWithValue, getState }) => {
  try {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.per_page) qs.set('per_page', String(params.per_page));

    const url = GROUP_ENDPOINTS.USER_GROUPS + (qs.toString() ? `?${qs.toString()}` : '');
    type UserGroupsListData = { groups: RawUserGroup[]; pagination: GroupListPaginationApi };
    const res = await apiRequest<UserGroupsListData>('GET', url);
    if (!res.success || !res.data) throw new Error(res.message || 'Fetch user groups failed');

    const currentUserId = (getState().auth.user?.id ?? undefined) as number | undefined;
    const groups = res.data.groups.map(g => normalizeFromUserGroups(g, currentUserId));
    return { groups, pagination: res.data.pagination };
  } catch (e: any) {
    return rejectWithValue(e.message || 'Fetch user groups failed') as any;
  }
});

/** 我订阅的群组（/user/subscribed-groups）——负责 userMembership */
export const fetchUserSubscribedGroups = createAsyncThunk<
  { groups: GroupApi[]; pagination: GroupListPaginationApi; membership: Record<number, boolean> },
  { page?: number; per_page?: number } | undefined,
  { state: RootState; dispatch: AppDispatch }
>('groups/fetchUserSubscribedGroups', async (params, { rejectWithValue, getState }) => {
  try {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.per_page) qs.set('per_page', String(params.per_page));

    const url = GROUP_ENDPOINTS.USER_SUBSCRIBED_GROUPS + (qs.toString() ? `?${qs.toString()}` : '');
    type UserSubscribedGroupsListData = { groups: RawUserGroup[]; pagination: GroupListPaginationApi };
    const res = await apiRequest<UserSubscribedGroupsListData>('GET', url);
    if (!res.success || !res.data) throw new Error(res.message || 'Fetch user subscribed groups failed');

    const currentUserId = (getState().auth.user?.id ?? undefined) as number | undefined;
    const groups = res.data.groups.map(g => normalizeFromUserGroups(g, currentUserId));
    const membership = Object.fromEntries(groups.map(g => [g.id, true])) as Record<number, boolean>;
    return { groups, pagination: res.data.pagination, membership };
  } catch (e: any) {
    return rejectWithValue(e.message || 'Fetch user subscribed groups failed') as any;
  }
});

/** Available groups (public) */
export const fetchAvailableGroups = createAsyncThunk<
  { groups: GroupApi[]; pagination: GroupListPaginationApi },
  { page?: number; per_page?: number } | undefined
>('groups/fetchAvailableGroups', async (params, { rejectWithValue }) => {
  try {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.per_page) qs.set('per_page', String(params.per_page));
    const url = GROUP_ENDPOINTS.AVAILABLE_GROUPS + (qs.toString() ? `?${qs.toString()}` : '');

    type AvailableGroupsData = { groups: RawAllGroup[]; pagination: GroupListPaginationApi };
    const res = await apiRequest<AvailableGroupsData>('GET', url);
    if (!res.success || !res.data) throw new Error(res.message || 'Fetch available groups failed');

    const groups = res.data.groups.map(normalizeFromAllGroups);
    return { groups, pagination: res.data.pagination };
  } catch (e: any) {
    return rejectWithValue(e.message || 'Fetch available groups failed') as any;
  }
});

/** (可选) All groups 列表 */
export const fetchAllGroups = createAsyncThunk<
  { groups: GroupApi[]; pagination: GroupListPaginationApi },
  { page?: number; per_page?: number } | undefined
>('groups/fetchAllGroups', async (params, { rejectWithValue }) => {
  try {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.per_page) qs.set('per_page', String(params.per_page));
    const url = GROUP_ENDPOINTS.ALL_GROUPS + (qs.toString() ? `?${qs.toString()}` : '');

    type AllGroupsData = { groups: RawAllGroup[]; pagination: GroupListPaginationApi };
    const res = await apiRequest<AllGroupsData>('GET', url);
    if (!res.success || !res.data) throw new Error(res.message || 'Fetch all groups failed');

    const groups = res.data.groups.map(normalizeFromAllGroups);
    return { groups, pagination: res.data.pagination };
  } catch (e: any) {
    return rejectWithValue(e.message || 'Fetch all groups failed') as any;
  }
});

/** Visible groups (公开 + 我创建/已订阅的私有) */
export const fetchVisibleGroups = createAsyncThunk<
  { groups: GroupApi[]; pagination: GroupListPaginationApi },
  { page?: number; per_page?: number } | undefined
>('groups/fetchVisibleGroups', async (params, { rejectWithValue }) => {
  try {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.per_page) qs.set('per_page', String(params.per_page));
    const url = GROUP_ENDPOINTS.VISIBLE_GROUPS + (qs.toString() ? `?${qs.toString()}` : '');

    type VisibleGroupsData = { groups: RawAllGroup[]; pagination: GroupListPaginationApi };
    const res = await apiRequest<VisibleGroupsData>('GET', url);
    if (!res.success || !res.data) throw new Error(res.message || 'Fetch visible groups failed');

    const groups = res.data.groups.map(normalizeFromAllGroups);
    return { groups, pagination: res.data.pagination };
  } catch (e: any) {
    return rejectWithValue(e.message || 'Fetch visible groups failed') as any;
  }
});

/** 在“可见”集合中搜索 */
export const searchVisibleGroups = createAsyncThunk<
  { q: string; groups: GroupApi[]; pagination: GroupListPaginationApi },
  { q: string; page?: number; per_page?: number }
>('groups/searchVisibleGroups', async ({ q, page, per_page }, { rejectWithValue }) => {
  try {
    const qs = new URLSearchParams();
    qs.set('q', q.trim());
    if (page) qs.set('page', String(page));
    if (per_page) qs.set('per_page', String(per_page));
    const url = `${GROUP_ENDPOINTS.VISIBLE_SEARCH}?${qs.toString()}`;

    type VisibleSearchData = { groups: RawAllGroup[]; pagination: GroupListPaginationApi };
    const res = await apiRequest<VisibleSearchData>('GET', url);
    if (!res.success || !res.data) throw new Error(res.message || 'Search visible groups failed');

    return {
      q,
      groups: res.data.groups.map(normalizeFromAllGroups),
      pagination: res.data.pagination,
    };
  } catch (e: any) {
    return rejectWithValue(e.message || 'Search visible groups failed') as any;
  }
});


/** 2.6 Update group */
export const updateGroup = createAsyncThunk<
  GroupApi,
  { groupId: number; body: CreateOrUpdateGroupBody }
>('groups/updateGroup', async ({ groupId, body }, { rejectWithValue }) => {
  try {
    const res = await apiRequest<{ group: GroupApi }>('PUT', GROUP_ENDPOINTS.UPDATE_GROUP(groupId), body);
    if (!res.success || !res.data?.group) throw new Error(res.message || 'Update group failed');
    return res.data.group;
  } catch (e: any) {
    return rejectWithValue(e.message || 'Update group failed') as any;
  }
});

export const deleteGroup = createAsyncThunk<{ id: number }, number>(
  'groups/deleteGroup',
  async (groupId, { rejectWithValue }) => {
    try {
      const res = await apiRequest<{}>('DELETE', GROUP_ENDPOINTS.DELETE_GROUP(groupId));
      if (!res.success) throw new Error(res.message || 'Delete group failed');
      return { id: groupId };
    } catch (e: any) {
      return rejectWithValue(e.message || 'Delete group failed') as any;
    }
  }
);

/** 搜索 */
export const searchGroups = createAsyncThunk<
  { q: string; groups: GroupApi[]; pagination: GroupListPaginationApi },
  { q: string; page?: number; per_page?: number }
>('groups/searchGroups', async ({ q, page, per_page }, { rejectWithValue }) => {
  try {
    const qs = new URLSearchParams();
    qs.set('q', q.trim());
    if (page) qs.set('page', String(page));
    if (per_page) qs.set('per_page', String(per_page));

    const url = `${GROUP_ENDPOINTS.SEARCH_GROUPS}?${qs.toString()}`;
    type SearchGroupsData = { groups: RawAllGroup[]; pagination: GroupListPaginationApi };
    const res = await apiRequest<SearchGroupsData>('GET', url);
    if (!res.success || !res.data) throw new Error(res.message || 'Search groups failed');

    return {
      q,
      groups: res.data.groups.map(normalizeFromAllGroups),
      pagination: res.data.pagination,
    };
  } catch (e: any) {
    return rejectWithValue(e.message || 'Search groups failed') as any;
  }
});

export const joinGroup = createAsyncThunk<{ id: number }, number>(
  'groups/joinGroup',
  async (groupId, { rejectWithValue }) => {
    try {
      const res = await apiRequest<{}>('POST', GROUP_ENDPOINTS.JOIN_GROUP(groupId));
      if (!res.success) throw new Error(res.message || 'Join group failed');
      return { id: groupId };
    } catch (e: any) {
      return rejectWithValue(e.message || 'Join group failed') as any;
    }
  }
);

export const leaveGroup = createAsyncThunk<{ id: number }, number>(
  'groups/leaveGroup',
  async (groupId, { rejectWithValue }) => {
    try {
      const res = await apiRequest<{}>('POST', GROUP_ENDPOINTS.LEAVE_GROUP(groupId));
      if (!res.success) throw new Error(res.message || 'Leave group failed');
      return { id: groupId };
    } catch (e: any) {
      return rejectWithValue(e.message || 'Leave group failed') as any;
    }
  }
);

/** 单个群组详情（需是成员或公开） */
export const fetchGroupDetail = createAsyncThunk<GroupApi, number>(
  'groups/fetchGroupDetail',
  async (groupId, { rejectWithValue }) => {
    try {
      const res = await apiRequest<GroupDetailData>('GET', GROUP_ENDPOINTS.GROUP_DETAIL(groupId));
      if (!res.success || !res.data) throw new Error(res.message || 'Fetch group detail failed');
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.message || 'Fetch group detail failed') as any;
    }
  }
);

const setMemberFlagOnList = (arr: GroupApi[], id: number, val: boolean) => {
  const i = arr.findIndex(g => g.id === id);
  if (i >= 0) arr[i] = { ...arr[i], is_member: val };
};

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    resetGroupsState: () => initialState,
    setCurrentGroup: (state, action: PayloadAction<GroupApi | null>) => {
      state.currentGroup = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = [];
      state.searchPagination = null;
    },
    setMembershipFlag: (state, action: PayloadAction<{ groupId: number; value: boolean }>) => {
      const { groupId, value } = action.payload;
      state.userMembership[groupId] = value; // true 或 false，永远保留 key
    },
  },
  extraReducers: (builder) => {
    // create group
    builder
      .addCase(createGroup.pending, (s) => { setStatus(s, 'createGroup', 'loading'); setError(s, 'createGroup', null); })
      .addCase(createGroup.fulfilled, (s, a) => {
        setStatus(s, 'createGroup', 'succeeded');
        const created = a.payload;
        s.currentGroup = created;
        // 放入“我创建的群组”
        s.userGroups = [created, ...s.userGroups];
        if (s.userGroupsPagination) s.userGroupsPagination.total += 1;
      })
      .addCase(createGroup.rejected, (s, a) => { setStatus(s, 'createGroup', 'failed'); setError(s, 'createGroup', (a.payload as string) || 'Create group failed'); });

    // available groups
    builder
      .addCase(fetchAvailableGroups.pending, (s) => { setStatus(s, 'fetchAvailableGroups', 'loading'); setError(s, 'fetchAvailableGroups', null); })
      .addCase(fetchAvailableGroups.fulfilled, (s, a) => {
        setStatus(s, 'fetchAvailableGroups', 'succeeded');
        s.availableGroups = a.payload.groups;
        s.availableGroupsPagination = a.payload.pagination;
      })
      .addCase(fetchAvailableGroups.rejected, (s, a) => {
        setStatus(s, 'fetchAvailableGroups', 'failed');
        setError(s, 'fetchAvailableGroups', (a.payload as string) || 'Fetch available groups failed');
      });

    // user groups (我创建的)
    builder
      .addCase(fetchUserGroups.pending, (s) => { setStatus(s, 'fetchUserGroups', 'loading'); setError(s, 'fetchUserGroups', null); })
      .addCase(fetchUserGroups.fulfilled, (s, a) => {
        setStatus(s, 'fetchUserGroups', 'succeeded');
        s.userGroups = a.payload.groups;
        s.userGroupsPagination = a.payload.pagination;
      })
      .addCase(fetchUserGroups.rejected, (s, a) => {
        setStatus(s, 'fetchUserGroups', 'failed');
        setError(s, 'fetchUserGroups', (a.payload as string) || 'Fetch user groups failed');
      });

    // user subscribed groups（我订阅的）
    builder
      .addCase(fetchUserSubscribedGroups.pending, (s) => { setStatus(s, 'fetchUserSubscribedGroups', 'loading'); setError(s, 'fetchUserSubscribedGroups', null); })
      .addCase(fetchUserSubscribedGroups.fulfilled, (s, a) => {
        setStatus(s, 'fetchUserSubscribedGroups', 'succeeded');
        s.subscribedGroups = a.payload.groups;
        s.subscribedGroupsPagination = a.payload.pagination;
        s.userMembership = a.payload.membership;
      })
      .addCase(fetchUserSubscribedGroups.rejected, (s, a) => {
        setStatus(s, 'fetchUserSubscribedGroups', 'failed');
        setError(s, 'fetchUserSubscribedGroups', (a.payload as string) || 'Fetch user subscribed groups failed');
      });

    // update group
    builder
      .addCase(updateGroup.pending, (s) => { setStatus(s, 'updateGroup', 'loading'); setError(s, 'updateGroup', null); })
      .addCase(updateGroup.fulfilled, (s, a) => {
        setStatus(s, 'updateGroup', 'succeeded');
        const updated = a.payload;
        if (s.currentGroup?.id === updated.id) s.currentGroup = updated;
        replaceInList(s.availableGroups, updated);
        replaceInList(s.userGroups, updated);
        replaceInList(s.subscribedGroups, updated);
      })
      .addCase(updateGroup.rejected, (s, a) => {
        setStatus(s, 'updateGroup', 'failed');
        setError(s, 'updateGroup', (a.payload as string) || 'Update group failed');
      });

    // delete group
    builder
      .addCase(deleteGroup.pending, (s) => { setStatus(s, 'deleteGroup', 'loading'); setError(s, 'deleteGroup', null); })
      .addCase(deleteGroup.fulfilled, (s, a) => {
        setStatus(s, 'deleteGroup', 'succeeded');
        const id = a.payload.id;
        s.availableGroups = s.availableGroups.filter(g => g.id !== id);
        s.userGroups = s.userGroups.filter(g => g.id !== id);
        s.subscribedGroups = s.subscribedGroups.filter(g => g.id !== id);
        if (s.currentGroup?.id === id) s.currentGroup = null;
        const { [id]: _ignored, ...rest } = s.userMembership;
        s.userMembership = rest;
      })
      .addCase(deleteGroup.rejected, (s, a) => {
        setStatus(s, 'deleteGroup', 'failed');
        setError(s, 'deleteGroup', (a.payload as string) || 'Delete group failed');
      });

    // Search group
    builder
      .addCase(searchGroups.pending, (s) => { setStatus(s, 'searchGroups', 'loading'); setError(s, 'searchGroups', null); })
      .addCase(searchGroups.fulfilled, (s, a) => {
        setStatus(s, 'searchGroups', 'succeeded');
        s.searchQuery = a.payload.q;
        s.searchResults = a.payload.groups;
        s.searchPagination = a.payload.pagination;
      })
      .addCase(searchGroups.rejected, (s, a) => {
        setStatus(s, 'searchGroups', 'failed');
        setError(s, 'searchGroups', (a.payload as string) || 'Search groups failed');
      });

    // join（只影响订阅集合）
    builder
      .addCase(joinGroup.pending, (s) => { setStatus(s, 'joinGroup', 'loading'); setError(s, 'joinGroup', null); })
      .addCase(joinGroup.fulfilled, (s, a) => {
        setStatus(s, 'joinGroup', 'succeeded');
        const id = a.payload.id;
        // current & available 标记成员态
        if (s.currentGroup?.id === id) s.currentGroup = { ...s.currentGroup, is_member: true };
        setMemberFlagOnList(s.availableGroups, id, true);
        // 订阅列表里没有的话，可以从 available/current 添入（尽力而为）
        const fromAvail = s.availableGroups.find(g => g.id === id);
        const fromCurrent = s.currentGroup && s.currentGroup.id === id ? s.currentGroup : undefined;
        const candidate = fromCurrent || fromAvail;
        if (!s.subscribedGroups.some(g => g.id === id) && candidate) {
          s.subscribedGroups = [candidate, ...s.subscribedGroups];
          if (s.subscribedGroupsPagination) s.subscribedGroupsPagination.total += 1;
        } else {
          setMemberFlagOnList(s.subscribedGroups, id, true);
        }
        s.userMembership[id] = true;
      })
      .addCase(joinGroup.rejected, (s, a) => {
        setStatus(s, 'joinGroup', 'failed');
        setError(s, 'joinGroup', (a.payload as string) || 'Join group failed');
      });

    // leave（只影响订阅集合）
    builder
      .addCase(leaveGroup.pending, (s) => { setStatus(s, 'leaveGroup', 'loading'); setError(s, 'leaveGroup', null); })
      .addCase(leaveGroup.fulfilled, (s, a) => {
        setStatus(s, 'leaveGroup', 'succeeded');
        const id = a.payload.id;
        if (s.currentGroup?.id === id) s.currentGroup = { ...s.currentGroup, is_member: false };
        setMemberFlagOnList(s.availableGroups, id, false);
        s.subscribedGroups = s.subscribedGroups.filter(g => g.id !== id);
        if (s.subscribedGroupsPagination && s.subscribedGroupsPagination.total > 0) {
          s.subscribedGroupsPagination.total -= 1;
        }
        s.userMembership[id] = false;
      })
      .addCase(leaveGroup.rejected, (s, a) => {
        setStatus(s, 'leaveGroup', 'failed');
        setError(s, 'leaveGroup', (a.payload as string) || 'Leave group failed');
      });

    // group detail
    builder
      .addCase(fetchGroupDetail.pending, (s) => { setStatus(s, 'fetchGroupDetail', 'loading'); setError(s, 'fetchGroupDetail', null); })
      .addCase(fetchGroupDetail.fulfilled, (s, a) => {
        setStatus(s, 'fetchGroupDetail', 'succeeded');
        s.currentGroup = a.payload;
      })
      .addCase(fetchGroupDetail.rejected, (s, a) => {
        setStatus(s, 'fetchGroupDetail', 'failed');
        setError(s, 'fetchGroupDetail', (a.payload as string) || 'Fetch group detail failed');
      });

    // visible groups（列表）
    builder
      .addCase(fetchVisibleGroups.pending, (s) => {
        setStatus(s, 'fetchVisibleGroups', 'loading');
        setError(s, 'fetchVisibleGroups', null);
      })
      .addCase(fetchVisibleGroups.fulfilled, (s, a) => {
        setStatus(s, 'fetchVisibleGroups', 'succeeded');
        s.visibleGroups = a.payload.groups;
        s.visibleGroupsPagination = a.payload.pagination;
      })
      .addCase(fetchVisibleGroups.rejected, (s, a) => {
        setStatus(s, 'fetchVisibleGroups', 'failed');
        setError(s, 'fetchVisibleGroups', (a.payload as string) || 'Fetch visible groups failed');
      });

    // visible groups（搜索）
    builder
      .addCase(searchVisibleGroups.pending, (s) => {
        setStatus(s, 'searchVisibleGroups', 'loading');
        setError(s, 'searchVisibleGroups', null);
      })
      .addCase(searchVisibleGroups.fulfilled, (s, a) => {
        setStatus(s, 'searchVisibleGroups', 'succeeded');
        // 可选：如果你想复用现有 searchQuery，也可以一起设置：
        s.searchQuery = a.payload.q;
        s.visibleSearchResults = a.payload.groups;
        s.visibleSearchPagination = a.payload.pagination;
      })
      .addCase(searchVisibleGroups.rejected, (s, a) => {
        setStatus(s, 'searchVisibleGroups', 'failed');
        setError(s, 'searchVisibleGroups', (a.payload as string) || 'Search visible groups failed');
      });

  },
});

export const { resetGroupsState, setCurrentGroup, setSearchQuery, clearSearch } = groupsSlice.actions;
export default groupsSlice.reducer;
