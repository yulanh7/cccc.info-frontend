import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../request';
import { unwrapData } from '@/app/types';
import type { LoadStatus } from '@/app/types';
import type { AppNotification, NotificationsPage } from '@/app/types/notification';
import { mergeNotifications } from '@/app/types/notification';

const NOTIFICATION_ENDPOINTS = {
  LIST: '/notifications',
  UNREAD_COUNT: '/notifications/unread-count',
  READ: (id: number) => `/notifications/${id}/read`,
  READ_ALL: '/notifications/read-all',
} as const;

export const NOTIFICATIONS_PAGE_SIZE = 20;

interface NotificationsState {
  unread: number;
  list: AppNotification[];
  /** null = 没有更多了 */
  nextBeforeId: number | null;
  /** 第一次加载过没有（区分“还没加载”和“没有更多”） */
  loaded: boolean;
  status: LoadStatus;
  error: string | null;
}

const initialState: NotificationsState = {
  unread: 0,
  list: [],
  nextBeforeId: null,
  loaded: false,
  status: 'idle',
  error: null,
};

const errMsg = (e: any, fallback: string) => (typeof e === 'string' ? e : e?.message) || fallback;

// ===== 未读数：GET /api/notifications/unread-count
export const fetchUnreadCount = createAsyncThunk<number, void>(
  'notifications/unreadCount',
  async (_, { rejectWithValue }) => {
    try {
      return unwrapData(await apiRequest<{ unread: number }>('GET', NOTIFICATION_ENDPOINTS.UNREAD_COUNT)).unread;
    } catch (e: any) {
      return rejectWithValue({ code: e?.code, message: errMsg(e, 'Failed to load notifications') }) as any;
    }
  }
);

// ===== 列表：GET /api/notifications?limit=&before_id=（游标分页，新的在前）
export const fetchNotifications = createAsyncThunk<NotificationsPage, { beforeId?: number | null }>(
  'notifications/list',
  async ({ beforeId }, { rejectWithValue }) => {
    try {
      const qs = new URLSearchParams({ limit: String(NOTIFICATIONS_PAGE_SIZE) });
      if (beforeId) qs.set('before_id', String(beforeId));
      return unwrapData(await apiRequest<NotificationsPage>('GET', `${NOTIFICATION_ENDPOINTS.LIST}?${qs}`));
    } catch (e: any) {
      return rejectWithValue(errMsg(e, 'Failed to load notifications')) as any;
    }
  }
);

// ===== 标为已读：POST /api/notifications/<id>/read
export const markNotificationRead = createAsyncThunk<AppNotification, number>(
  'notifications/read',
  async (id, { rejectWithValue }) => {
    try {
      return unwrapData(await apiRequest<AppNotification>('POST', NOTIFICATION_ENDPOINTS.READ(id)));
    } catch (e: any) {
      return rejectWithValue(errMsg(e, 'Failed to mark as read')) as any;
    }
  }
);

// ===== 全部已读：POST /api/notifications/read-all
export const markAllNotificationsRead = createAsyncThunk<number, void>(
  'notifications/readAll',
  async (_, { rejectWithValue }) => {
    try {
      return unwrapData(await apiRequest<{ unread: number }>('POST', NOTIFICATION_ENDPOINTS.READ_ALL)).unread;
    } catch (e: any) {
      return rejectWithValue(errMsg(e, 'Failed to mark all as read')) as any;
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    resetNotifications: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUnreadCount.fulfilled, (s, a) => {
      s.unread = a.payload;
    });

    builder
      .addCase(fetchNotifications.pending, (s) => {
        s.status = 'loading';
        s.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (s, a) => {
        s.status = 'succeeded';
        // 不带 before_id = 第一页：替换；否则追加
        s.list = a.meta.arg.beforeId ? mergeNotifications(s.list, a.payload.notifications) : a.payload.notifications;
        s.nextBeforeId = a.payload.next_before_id;
        s.loaded = true;
      })
      .addCase(fetchNotifications.rejected, (s, a) => {
        s.status = 'failed';
        s.error = (a.payload as string) || 'Failed to load notifications';
      });

    builder.addCase(markNotificationRead.fulfilled, (s, a) => {
      const idx = s.list.findIndex((x) => x.id === a.payload.id);
      const wasUnread = idx >= 0 ? !s.list[idx].read : true;
      if (idx >= 0) s.list[idx] = { ...s.list[idx], read: true };
      if (wasUnread) s.unread = Math.max(0, s.unread - 1);
    });

    builder.addCase(markAllNotificationsRead.fulfilled, (s, a) => {
      s.unread = a.payload;
      s.list = s.list.map((x) => ({ ...x, read: true }));
    });
  },
});

export const { resetNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;
