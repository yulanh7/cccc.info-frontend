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
} as const;

interface GroupsState {
  currentGroup: GroupProps | null;
  availableGroups: GroupProps[];
  availableGroupsPagination: Pagination | null;
  status: Record<string, LoadStatus>;
  error: Record<string, string | null>;
}

const initialState: GroupsState = {
  currentGroup: null,
  availableGroups: [],
  availableGroupsPagination: null,
  status: {},
  error: {},
};

const setStatus = (state: GroupsState, key: string, value: LoadStatus) => {
  state.status[key] = value;
};
const setError = (state: GroupsState, key: string, value: string | null) => {
  state.error[key] = value;
};

/** 2.5 Create group: POST /api/groups -> { group: GroupApi } */
export const createGroup = createAsyncThunk<GroupProps, CreateOrUpdateGroupBody>(
  'groups/createGroup',
  async (body, { rejectWithValue }) => {
    try {
      const res = await apiRequest<{ group: GroupApi }>(
        'POST',
        GROUP_ENDPOINTS.CREATE_GROUP,
        body
      );
      if (!res.success || !res.data?.group) {
        throw new Error(res.message || 'Create group failed');
      }
      return mapGroupApiToProps(res.data.group);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Create group failed') as any;
    }
  }
);

/** 2.2 Get available groups: GET /api/groups/available */
export const fetchAvailableGroups = createAsyncThunk<
  { groups: GroupProps[]; pagination: Pagination },
  { page?: number; per_page?: number } | undefined
>('groups/fetchAvailableGroups', async (params, { rejectWithValue }) => {
  try {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.per_page) qs.set('per_page', String(params.per_page));
    const url =
      GROUP_ENDPOINTS.AVAILABLE_GROUPS + (qs.toString() ? `?${qs.toString()}` : '');

    const res = await apiRequest<GroupsListData>('GET', url);
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Fetch available groups failed');
    }

    const mapped = res.data.groups.map(mapGroupApiToProps);
    return { groups: mapped, pagination: res.data.pagination };
  } catch (e: any) {
    return rejectWithValue(e.message || 'Fetch available groups failed') as any;
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
      .addCase(createGroup.pending, (s) => {
        setStatus(s, 'createGroup', 'loading');
        setError(s, 'createGroup', null);
      })
      .addCase(createGroup.fulfilled, (s, a) => {
        setStatus(s, 'createGroup', 'succeeded');
        s.currentGroup = a.payload;
        // Note: whether to insert into availableGroups depends on server logic.
        // You can re-fetch available groups in the page after creation.
      })
      .addCase(createGroup.rejected, (s, a) => {
        setStatus(s, 'createGroup', 'failed');
        setError(s, 'createGroup', (a.payload as string) || 'Create group failed');
      });

    // fetch available groups
    builder
      .addCase(fetchAvailableGroups.pending, (s) => {
        setStatus(s, 'fetchAvailableGroups', 'loading');
        setError(s, 'fetchAvailableGroups', null);
      })
      .addCase(fetchAvailableGroups.fulfilled, (s, a) => {
        setStatus(s, 'fetchAvailableGroups', 'succeeded');
        s.availableGroups = a.payload.groups;
        s.availableGroupsPagination = a.payload.pagination;
      })
      .addCase(fetchAvailableGroups.rejected, (s, a) => {
        setStatus(s, 'fetchAvailableGroups', 'failed');
        setError(
          s,
          'fetchAvailableGroups',
          (a.payload as string) || 'Fetch available groups failed'
        );
      });
  },
});

export const { resetGroupsState, setCurrentGroup } = groupsSlice.actions;
export default groupsSlice.reducer;
