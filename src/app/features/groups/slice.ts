// app/features/groups/slice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiRequest } from '../request';
import type {
  GroupProps,
  GroupApi,
  CreateOrUpdateGroupBody,
  GroupsListData,
  GroupListPaginationApi,
  GroupDetailData,
  LoadStatus
} from '@/app/types';
import { mapGroupApiToProps } from '@/app/types/group';


const GROUP_ENDPOINTS = {
  CREATE_GROUP: '/groups',
  AVAILABLE_GROUPS: '/groups/available',
  USER_GROUPS: '/groups',
  UPDATE_GROUP: (id: number) => `/groups/${id}`,
  DELETE_GROUP: (id: number) => `/groups/${id}`,
  SEARCH_GROUPS: '/groups/search',
  JOIN_GROUP: (id: number) => `/groups/${id}/join`,
  LEAVE_GROUP: (id: number) => `/groups/${id}/leave`,
  GROUP_DETAIL: (id: number) => `/groups/${id}`,
} as const;

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

const initialState: GroupsState = {
  currentGroup: null,
  availableGroups: [],
  availableGroupsPagination: null,
  userGroups: [],
  userGroupsPagination: null,
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
const replaceInList = (list: GroupProps[], updated: GroupProps) => {
  const i = list.findIndex((g) => g.id === updated.id);
  if (i >= 0) list[i] = updated;
};

/** 2.5 Create group */
export const createGroup = createAsyncThunk<GroupProps, CreateOrUpdateGroupBody>(
  'groups/createGroup',
  async (body, { rejectWithValue }) => {
    try {
      const res = await apiRequest<{ group: GroupApi }>('POST', GROUP_ENDPOINTS.CREATE_GROUP, body);
      if (!res.success || !res.data?.group) throw new Error(res.message || 'Create group failed');
      return mapGroupApiToProps(res.data.group);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Create group failed') as any;
    }
  }
);

/** 2.2 Get available groups */
export const fetchAvailableGroups = createAsyncThunk<
  { groups: GroupProps[]; pagination: GroupListPaginationApi },
  { page?: number; per_page?: number } | undefined
>('groups/fetchAvailableGroups', async (params, { rejectWithValue }) => {
  try {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.per_page) qs.set('per_page', String(params.per_page));
    const url = GROUP_ENDPOINTS.AVAILABLE_GROUPS + (qs.toString() ? `?${qs.toString()}` : '');
    const res = await apiRequest<GroupsListData>('GET', url);
    if (!res.success || !res.data) throw new Error(res.message || 'Fetch available groups failed');
    return { groups: res.data.groups.map(mapGroupApiToProps), pagination: res.data.pagination };
  } catch (e: any) {
    return rejectWithValue(e.message || 'Fetch available groups failed') as any;
  }
});

/** 2.1 Get user subscribed groups */
export const fetchUserGroups = createAsyncThunk<
  { groups: GroupProps[]; pagination: GroupListPaginationApi; membership: Record<number, true> },
  { page?: number; per_page?: number } | undefined
>('groups/fetchUserGroups', async (params, { rejectWithValue }) => {
  try {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.per_page) qs.set('per_page', String(params.per_page));
    const url = GROUP_ENDPOINTS.USER_GROUPS + (qs.toString() ? `?${qs.toString()}` : '');
    const res = await apiRequest<GroupsListData>('GET', url);
    if (!res.success || !res.data) throw new Error(res.message || 'Fetch user groups failed');

    const groups = res.data.groups.map(mapGroupApiToProps);
    const membership: Record<number, true> = {};
    for (const g of groups) membership[g.id] = true;

    return { groups, pagination: res.data.pagination, membership };
  } catch (e: any) {
    return rejectWithValue(e.message || 'Fetch user groups failed') as any;
  }
});

/** 2.6 Update group */
export const updateGroup = createAsyncThunk<
  GroupProps,
  { groupId: number; body: CreateOrUpdateGroupBody }
>('groups/updateGroup', async ({ groupId, body }, { rejectWithValue }) => {
  try {
    const res = await apiRequest<{ group: GroupApi }>('PUT', GROUP_ENDPOINTS.UPDATE_GROUP(groupId), body);
    if (!res.success || !res.data?.group) throw new Error(res.message || 'Update group failed');
    return mapGroupApiToProps(res.data.group);
  } catch (e: any) {
    return rejectWithValue(e.message || 'Update group failed') as any;
  }
});

export const deleteGroup = createAsyncThunk<
  { id: number },
  number
>('groups/deleteGroup', async (groupId, { rejectWithValue }) => {
  try {
    const res = await apiRequest<{}>('DELETE', GROUP_ENDPOINTS.DELETE_GROUP(groupId));
    if (!res.success) throw new Error(res.message || 'Delete group failed');
    return { id: groupId };
  } catch (e: any) {
    return rejectWithValue(e.message || 'Delete group failed') as any;
  }
});

// Search group
export const searchGroups = createAsyncThunk<
  { q: string; groups: GroupProps[]; pagination: GroupListPaginationApi },
  { q: string; page?: number; per_page?: number }
>('groups/searchGroups', async ({ q, page, per_page }, { rejectWithValue }) => {
  try {
    const qs = new URLSearchParams();
    qs.set('q', q.trim());
    if (page) qs.set('page', String(page));
    if (per_page) qs.set('per_page', String(per_page));

    const url = `${GROUP_ENDPOINTS.SEARCH_GROUPS}?${qs.toString()}`;
    const res = await apiRequest<GroupsListData>('GET', url);
    if (!res.success || !res.data) throw new Error(res.message || 'Search groups failed');

    return {
      q,
      groups: res.data.groups.map(mapGroupApiToProps),
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

/** 2.4 Get single group detail (must be a member) */
export const fetchGroupDetail = createAsyncThunk<GroupProps, number>(
  'groups/fetchGroupDetail',
  async (groupId, { rejectWithValue }) => {
    try {
      const res = await apiRequest<GroupDetailData>('GET', GROUP_ENDPOINTS.GROUP_DETAIL(groupId));
      if (!res.success || !res.data) throw new Error(res.message || 'Fetch group detail failed');

      return mapGroupApiToProps(res.data);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Fetch group detail failed') as any;
    }
  }
);

const setSubOnList = (arr: GroupProps[], id: number, val: boolean) => {
  const i = arr.findIndex(g => g.id === id);
  if (i >= 0) arr[i] = { ...arr[i], subscribed: val };
};

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    resetGroupsState: () => initialState,
    setCurrentGroup: (state, action: PayloadAction<GroupProps | null>) => {
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
  },
  extraReducers: (builder) => {
    // create group
    builder
      .addCase(createGroup.pending, (s) => { setStatus(s, 'createGroup', 'loading'); setError(s, 'createGroup', null); })
      .addCase(createGroup.fulfilled, (s, a) => { setStatus(s, 'createGroup', 'succeeded'); s.currentGroup = a.payload; })
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

    // user groups
    builder
      .addCase(fetchUserGroups.pending, (s) => { setStatus(s, 'fetchUserGroups', 'loading'); setError(s, 'fetchUserGroups', null); })
      .addCase(fetchUserGroups.fulfilled, (s, a) => {
        setStatus(s, 'fetchUserGroups', 'succeeded');
        s.userGroups = a.payload.groups;
        s.userGroupsPagination = a.payload.pagination;
        s.userMembership = a.payload.membership;
      })
      .addCase(fetchUserGroups.rejected, (s, a) => {
        setStatus(s, 'fetchUserGroups', 'failed');
        setError(s, 'fetchUserGroups', (a.payload as string) || 'Fetch user groups failed');
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
      })
      .addCase(updateGroup.rejected, (s, a) => {
        setStatus(s, 'updateGroup', 'failed');
        setError(s, 'updateGroup', (a.payload as string) || 'Update group failed');
      });

    // delete group
    builder
      .addCase(deleteGroup.pending, (s) => {
        setStatus(s, 'deleteGroup', 'loading');
        setError(s, 'deleteGroup', null);
      })
      .addCase(deleteGroup.fulfilled, (s, a) => {
        setStatus(s, 'deleteGroup', 'succeeded');
        const id = a.payload.id;
        s.availableGroups = s.availableGroups.filter(g => g.id !== id);
        s.userGroups = s.userGroups.filter(g => g.id !== id);
        if (s.currentGroup?.id === id) s.currentGroup = null;
        if (s.userMembership[id]) {
          const { [id]: _, ...rest } = s.userMembership;
          s.userMembership = rest;
        }
      })
      .addCase(deleteGroup.rejected, (s, a) => {
        setStatus(s, 'deleteGroup', 'failed');
        setError(s, 'deleteGroup', (a.payload as string) || 'Delete group failed');
      });

    // Search group
    builder
      .addCase(searchGroups.pending, (s) => {
        setStatus(s, 'searchGroups', 'loading');
        setError(s, 'searchGroups', null);
      })
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

    // join
    builder
      .addCase(joinGroup.pending, (s) => { setStatus(s, 'joinGroup', 'loading'); setError(s, 'joinGroup', null); })
      .addCase(joinGroup.fulfilled, (s, a) => {
        setStatus(s, 'joinGroup', 'succeeded');
        const id = a.payload.id;
        if (s.currentGroup?.id === id) s.currentGroup = { ...s.currentGroup, subscribed: true };
        setSubOnList(s.availableGroups, id, true);
        setSubOnList(s.userGroups, id, true);
        s.userMembership[id] = true;
      })
      .addCase(joinGroup.rejected, (s, a) => {
        setStatus(s, 'joinGroup', 'failed');
        setError(s, 'joinGroup', (a.payload as string) || 'Join group failed');
      });

    // leave
    builder
      .addCase(leaveGroup.pending, (s) => { setStatus(s, 'leaveGroup', 'loading'); setError(s, 'leaveGroup', null); })
      .addCase(leaveGroup.fulfilled, (s, a) => {
        setStatus(s, 'leaveGroup', 'succeeded');
        const id = a.payload.id;
        if (s.currentGroup?.id === id) s.currentGroup = { ...s.currentGroup, subscribed: false };
        setSubOnList(s.availableGroups, id, false);
        s.userGroups = s.userGroups.filter(g => g.id !== id);
        if (s.userMembership[id]) {
          const { [id]: _, ...rest } = s.userMembership;
          s.userMembership = rest;
        }
      })
      .addCase(leaveGroup.rejected, (s, a) => {
        setStatus(s, 'leaveGroup', 'failed');
        setError(s, 'leaveGroup', (a.payload as string) || 'Leave group failed');
      });

    //group detail
    builder
      .addCase(fetchGroupDetail.pending, (s) => {
        setStatus(s, 'fetchGroupDetail', 'loading');
        setError(s, 'fetchGroupDetail', null);
      })
      .addCase(fetchGroupDetail.fulfilled, (s, a) => {
        setStatus(s, 'fetchGroupDetail', 'succeeded');
        s.currentGroup = a.payload;
      })
      .addCase(fetchGroupDetail.rejected, (s, a) => {
        setStatus(s, 'fetchGroupDetail', 'failed');
        setError(s, 'fetchGroupDetail', (a.payload as string) || 'Fetch group detail failed');
      });
  },
});

export const { resetGroupsState, setCurrentGroup, setSearchQuery, clearSearch } = groupsSlice.actions;
export default groupsSlice.reducer;
