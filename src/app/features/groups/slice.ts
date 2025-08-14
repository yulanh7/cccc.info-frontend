import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiRequest } from '../request';
import type {
  GroupProps,
  GroupApi,
  CreateOrUpdateGroupBody,
} from '@/app/types/group';
import { mapGroupApiToProps } from '@/app/types/group';

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

const GROUP_ENDPOINTS = {
  CREATE_GROUP: '/groups',
} as const;

interface GroupsState {
  currentGroup: GroupProps | null;
  status: Record<string, LoadStatus>;
  error: Record<string, string | null>;
}

const initialState: GroupsState = {
  currentGroup: null,
  status: {},
  error: {},
};

const setStatus = (state: GroupsState, key: string, value: LoadStatus) => {
  state.status[key] = value;
};
const setError = (state: GroupsState, key: string, value: string | null) => {
  state.error[key] = value;
};

/** Create group: POST /api/groups -> { group: GroupApi } */
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
    builder
      .addCase(createGroup.pending, (s) => {
        setStatus(s, 'createGroup', 'loading');
        setError(s, 'createGroup', null);
      })
      .addCase(createGroup.fulfilled, (s, a) => {
        setStatus(s, 'createGroup', 'succeeded');
        s.currentGroup = a.payload;
      })
      .addCase(createGroup.rejected, (s, a) => {
        setStatus(s, 'createGroup', 'failed');
        setError(s, 'createGroup', (a.payload as string) || 'Create group failed');
      });
  },
});

export const { resetGroupsState, setCurrentGroup } = groupsSlice.actions;
export default groupsSlice.reducer;
