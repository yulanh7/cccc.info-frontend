import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../request';
import { unwrapData } from '@/app/types';
import type { LoadStatus } from '@/app/types';
import type { AppNotification, NotificationsPage } from '@/app/types/notification';
import { mergeNotifications } from '@/app/types/notification';
import { errorMessage, errorCode } from '@/app/lib/errors';

const NOTIFICATION_ENDPOINTS = {
  LIST: '/notifications',
  UNREAD_COUNT: '/notifications/unread-count',
  READ: (id: number) => `/notifications/${id}/read`,
  READ_ALL: '/notifications/read-all',
  ONE: (id: number) => `/notifications/${id}`,
  CLEAR_READ: '/notifications/clear-read',
  SETTINGS: '/notifications/settings',
} as const;

/** 个人通知设定 */
export type NotificationSettings = { auto_delete_read_after_90_days: boolean };

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
  /** null = 还没读取 */
  settings: NotificationSettings | null;
}

const initialState: NotificationsState = {
  unread: 0,
  list: [],
  nextBeforeId: null,
  loaded: false,
  status: 'idle',
  error: null,
  settings: null,
};

const errMsg = (e: unknown, fallback: string) => errorMessage(e, fallback);

// ===== 未读数：GET /api/notifications/unread-count
export const fetchUnreadCount = createAsyncThunk<number, void>(
  'notifications/unreadCount',
  async (_, { rejectWithValue }) => {
    try {
      return unwrapData(await apiRequest<{ unread: number }>('GET', NOTIFICATION_ENDPOINTS.UNREAD_COUNT)).unread;
    } catch (e) {
      return rejectWithValue({ code: errorCode(e), message: errMsg(e, 'Failed to load notifications') }) as any;
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
    } catch (e) {
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
    } catch (e) {
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
    } catch (e) {
      return rejectWithValue(errMsg(e, 'Failed to mark all as read')) as any;
    }
  }
);

// ===== 删除单条：DELETE /api/notifications/<id>
export const deleteNotification = createAsyncThunk<{ id: number; unread_count: number }, number>(
  'notifications/delete',
  async (id, { rejectWithValue }) => {
    try {
      const data = unwrapData(await apiRequest<{ unread_count: number }>('DELETE', NOTIFICATION_ENDPOINTS.ONE(id)));
      return { id, unread_count: data.unread_count };
    } catch (e) {
      return rejectWithValue(errMsg(e, 'Delete failed')) as any;
    }
  }
);

// ===== 删除所有已读：POST /api/notifications/clear-read（未读的不动）
export const clearReadNotifications = createAsyncThunk<{ deleted: number; unread_count: number }, void>(
  'notifications/clearRead',
  async (_, { rejectWithValue }) => {
    try {
      return unwrapData(await apiRequest<{ deleted: number; unread_count: number }>('POST', NOTIFICATION_ENDPOINTS.CLEAR_READ));
    } catch (e) {
      return rejectWithValue(errMsg(e, 'Clear failed')) as any;
    }
  }
);

// ===== 个人设定：GET / PUT /api/notifications/settings
export const fetchNotificationSettings = createAsyncThunk<NotificationSettings, void>(
  'notifications/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      return unwrapData(await apiRequest<NotificationSettings>('GET', NOTIFICATION_ENDPOINTS.SETTINGS));
    } catch (e) {
      return rejectWithValue(errMsg(e, 'Failed to load settings')) as any;
    }
  }
);

export const updateNotificationSettings = createAsyncThunk<NotificationSettings, NotificationSettings>(
  'notifications/updateSettings',
  async (body, { rejectWithValue }) => {
    try {
      return unwrapData(await apiRequest<NotificationSettings>('PUT', NOTIFICATION_ENDPOINTS.SETTINGS, body));
    } catch (e) {
      return rejectWithValue(errMsg(e, 'Failed to save settings')) as any;
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

    // 删除：从列表拿掉，角标用后端返回的未读数
    builder.addCase(deleteNotification.fulfilled, (s, a) => {
      s.list = s.list.filter((x) => x.id !== a.payload.id);
      s.unread = a.payload.unread_count;
    });
    builder.addCase(clearReadNotifications.fulfilled, (s, a) => {
      s.list = s.list.filter((x) => !x.read);
      s.unread = a.payload.unread_count;
    });

    builder
      .addCase(fetchNotificationSettings.fulfilled, (s, a) => {
        s.settings = a.payload;
      })
      .addCase(updateNotificationSettings.fulfilled, (s, a) => {
        s.settings = a.payload;
      });
  },
});

export const { resetNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;
