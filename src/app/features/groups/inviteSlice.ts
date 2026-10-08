import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../request';
import { unwrapData } from '@/app/types';
import type { GroupInviteState, InvitePreview, InviteJoinResult } from '@/app/types/group';
import { errorMessage, errorCode } from '@/app/lib/errors';

/** 私密小组邀请链接的请求（不存 state）。接口名以后端 frontend-api.md 为准 */
const GROUP_INVITE_ENDPOINTS = {
  SET: (groupId: number) => `/groups/${groupId}/invite`,
  RESET: (groupId: number) => `/groups/${groupId}/invite/reset`,
  PREVIEW: (code: string) => `/invites/${encodeURIComponent(code)}`,
  JOIN: (code: string) => `/invites/${encodeURIComponent(code)}/join`,
} as const;

const errMsg = (e: unknown, fallback: string) => errorMessage(e, fallback);

// ===== 打开 / 关闭：PUT /api/groups/<id>/invite（创建者 / 组长）
export const setGroupInvite = createAsyncThunk<GroupInviteState, { groupId: number; enabled: boolean }>(
  'groupInvite/set',
  async ({ groupId, enabled }, { rejectWithValue }) => {
    try {
      return unwrapData(await apiRequest<GroupInviteState>('PUT', GROUP_INVITE_ENDPOINTS.SET(groupId), { enabled }));
    } catch (e) {
      return rejectWithValue(errMsg(e, 'Failed to update the invite link')) as any;
    }
  }
);

// ===== 重新生成：POST /api/groups/<id>/invite/reset（旧链接马上失效）
export const resetGroupInvite = createAsyncThunk<GroupInviteState, number>(
  'groupInvite/reset',
  async (groupId, { rejectWithValue }) => {
    try {
      return unwrapData(await apiRequest<GroupInviteState>('POST', GROUP_INVITE_ENDPOINTS.RESET(groupId)));
    } catch (e) {
      return rejectWithValue(errMsg(e, 'Failed to reset the invite link')) as any;
    }
  }
);

// ===== 用代码看小组简介：GET /api/invites/<code>（无效 → 404）
export const fetchInvite = createAsyncThunk<InvitePreview, string>(
  'groupInvite/preview',
  async (code, { rejectWithValue }) => {
    try {
      return unwrapData(await apiRequest<InvitePreview>('GET', GROUP_INVITE_ENDPOINTS.PREVIEW(code)));
    } catch (e) {
      return rejectWithValue({ code: errorCode(e), message: errMsg(e, 'This invite link is no longer valid') }) as any;
    }
  }
);

// ===== 用代码加入：POST /api/invites/<code>/join（已是成员也成功）
export const joinByInvite = createAsyncThunk<InviteJoinResult, string>(
  'groupInvite/join',
  async (code, { rejectWithValue }) => {
    try {
      return unwrapData(await apiRequest<InviteJoinResult>('POST', GROUP_INVITE_ENDPOINTS.JOIN(code)));
    } catch (e) {
      return rejectWithValue({ code: errorCode(e), message: errMsg(e, 'Join failed') }) as any;
    }
  }
);
