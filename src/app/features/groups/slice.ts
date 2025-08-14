// app/features/groups/slice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiRequest } from '../request';
import type {
  GroupProps,
  GroupApi,
  CreateOrUpdateGroupBody,
  GroupsListData,
  Pagination,
} from '@/app/types/group';
import { mapGroupApiToProps } from '@/app/types/group';

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

const GROUP_ENDPOINTS = {
  CREATE_GROUP: '/groups',
  AVAILABLE_GROUPS: '/groups/available',
  USER_GROUPS: '/groups',
  UPDATE_GROUP: (id: number) => `/groups/${id}`,
} as const;

interface GroupsState {
  currentGroup: GroupProps | null;
  availableGroups: GroupProps[];
  availableGroupsPagination: Pagination | null;
  userGroups: GroupProps[];
  userGroupsPagination: Pagination | null;
  userMembership: Record<number, true>; // quick lookup for subscribed group ids
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
  { groups: GroupProps[]; pagination: Pagination },
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
  { groups: GroupProps[]; pagination: Pagination; membership: Record<number, true> },
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

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    resetGroupsState: () => initialState,
    setCurrentGroup: (state, action: PayloadAction<GroupProps | null>) => {
      state.currentGroup = action.payload;
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
  },
});

export const { resetGroupsState, setCurrentGroup } = groupsSlice.actions;
export default groupsSlice.reducer;
