import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../request';
import { unwrapData } from '@/app/types';
import type { JoinRequest } from '@/app/types/group';
import { errorMessage, errorCode } from '@/app/lib/errors';

/** request 小组的加入申请（不单独存 state；小组页的 my_join_request / pending_request_count 由 detailSlice 更新） */
const JOIN_REQUEST_ENDPOINTS = {
  LIST: (groupId: number) => `/groups/${groupId}/join-requests`,
  MINE: (groupId: number) => `/groups/${groupId}/join-requests/mine`,
  APPROVE: (groupId: number, requestId: number) => `/groups/${groupId}/join-requests/${requestId}/approve`,
  DECLINE: (groupId: number, requestId: number) => `/groups/${groupId}/join-requests/${requestId}/decline`,
} as const;

/** 失败时带 HTTP 状态：409 = 已被别人处理，404 = 没有这条 / 已经没有待处理的申请 */
export type JoinRequestError = { code?: number; message: string };

const fail = (e: unknown, fallback: string): JoinRequestError => ({
  code: errorCode(e),
  message: errorMessage(e, fallback),
});

// ===== 申请：POST /api/groups/<id>/join-requests，留言可选（最多 200 字）
export const sendJoinRequest = createAsyncThunk<
  { groupId: number; join_request: JoinRequest },
  { groupId: number; message?: string },
  { rejectValue: JoinRequestError }
>('joinRequests/send', async ({ groupId, message }, { rejectWithValue }) => {
  try {
    const body = message?.trim() ? { message: message.trim() } : {};
    const data = unwrapData(await apiRequest<{ join_request: JoinRequest }>('POST', JOIN_REQUEST_ENDPOINTS.LIST(groupId), body));
    return { groupId, join_request: data.join_request };
  } catch (e) {
    return rejectWithValue(fail(e, 'Failed to send the request'));
  }
});

// ===== 撤回自己的申请：DELETE /api/groups/<id>/join-requests/mine
export const withdrawJoinRequest = createAsyncThunk<{ groupId: number }, number, { rejectValue: JoinRequestError }>(
  'joinRequests/withdraw',
  async (groupId, { rejectWithValue }) => {
    try {
      await apiRequest<Record<string, never>>('DELETE', JOIN_REQUEST_ENDPOINTS.MINE(groupId));
      return { groupId };
    } catch (e) {
      return rejectWithValue(fail(e, 'Failed to withdraw the request'));
    }
  }
);

// ===== 待处理列表（管理者）：GET /api/groups/<id>/join-requests，旧的在前
export const fetchJoinRequests = createAsyncThunk<JoinRequest[], number, { rejectValue: JoinRequestError }>(
  'joinRequests/list',
  async (groupId, { rejectWithValue }) => {
    try {
      return unwrapData(await apiRequest<{ join_requests: JoinRequest[] }>('GET', JOIN_REQUEST_ENDPOINTS.LIST(groupId))).join_requests;
    } catch (e) {
      return rejectWithValue(fail(e, 'Failed to load join requests'));
    }
  }
);

type HandleResult = { groupId: number; join_request: JoinRequest; pending_request_count: number };

const handleRequest = (action: 'approve' | 'decline') =>
  createAsyncThunk<HandleResult, { groupId: number; requestId: number }, { rejectValue: JoinRequestError }>(
    `joinRequests/${action}`,
    async ({ groupId, requestId }, { rejectWithValue }) => {
      try {
        const url = action === 'approve'
          ? JOIN_REQUEST_ENDPOINTS.APPROVE(groupId, requestId)
          : JOIN_REQUEST_ENDPOINTS.DECLINE(groupId, requestId);
        const data = unwrapData(await apiRequest<Omit<HandleResult, 'groupId'>>('POST', url));
        return { groupId, ...data };
      } catch (e) {
        return rejectWithValue(fail(e, action === 'approve' ? 'Approve failed' : 'Decline failed'));
      }
    }
  );

// ===== 批准 / 拒绝：POST .../approve | .../decline（409 = 已被别人处理）
export const approveJoinRequest = handleRequest('approve');
export const declineJoinRequest = handleRequest('decline');
