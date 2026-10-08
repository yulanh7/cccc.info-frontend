"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearReadNotifications,
  fetchNotificationSettings,
  updateNotificationSettings,
} from "@/app/features/notifications/slice";
import { XMarkIcon } from "@heroicons/react/24/outline";
import ConfirmModal from "@/components/ConfirmModal";
import { notificationText, notificationHref } from "@/app/types/notification";
import type { AppNotification } from "@/app/types/notification";
import { formatDate } from "@/app/ultility";
import PageTitle from "@/components/layout/PageTitle";
import CustomHeader from "@/components/layout/CustomHeader";
import Button from "@/components/ui/Button";

const UNAVAILABLE_TEXT = "This content is no longer available.";

/** 通知列表：新的在前；滚到底用 next_before_id 继续加载（游标分页） */
export default function NotificationsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { list, nextBeforeId, loaded, status, error, unread, settings } = useAppSelector((s) => s.notifications);
  const [notice, setNotice] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 每次进来都从最新的开始，顺便更新未读数（不等轮询）和个人设定
  useEffect(() => {
    dispatch(fetchNotifications({}));
    dispatch(fetchUnreadCount());
    dispatch(fetchNotificationSettings());
  }, [dispatch]);

  const loading = status === "loading";
  const hasMore = loaded && nextBeforeId !== null;

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    dispatch(fetchNotifications({ beforeId: nextBeforeId }));
  }, [dispatch, loading, hasMore, nextBeforeId]);

  // 滚到底自动加载
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) loadMore();
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadMore]);

  const open = async (n: AppNotification) => {
    setNotice(null);
    if (!n.read) await dispatch(markNotificationRead(n.id));
    const href = notificationHref(n);
    if (href) router.push(href);
    else setNotice(UNAVAILABLE_TEXT);
  };

  // ===== 删除：单条直接删；“Clear read”先确认，删完从最新的重新加载（已读的可能还在没加载的页里）
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const fail = (e: any, fallback: string) => setNotice(typeof e === "string" ? e : e?.message || fallback);

  const remove = async (n: AppNotification) => {
    setNotice(null);
    setDeletingId(n.id);
    try {
      await dispatch(deleteNotification(n.id)).unwrap();
    } catch (e: any) {
      fail(e, "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const clearRead = async () => {
    setConfirmClear(false);
    setNotice(null);
    setClearing(true);
    try {
      await dispatch(clearReadNotifications()).unwrap();
      dispatch(fetchNotifications({}));
    } catch (e: any) {
      fail(e, "Clear failed");
    } finally {
      setClearing(false);
    }
  };

  const toggleAutoDelete = async (on: boolean) => {
    setNotice(null);
    setSavingSettings(true);
    try {
      await dispatch(updateNotificationSettings({ auto_delete_read_after_90_days: on })).unwrap();
    } catch (e: any) {
      fail(e, "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const markAll = async () => {
    setMarkingAll(true);
    await dispatch(markAllNotificationsRead());
    setMarkingAll(false);
  };

  return (
    <>
      <CustomHeader pageTitle="Notifications" showLogo={true} />
      <PageTitle title="Notifications" showPageTitle />
      <div className="mx-auto w-full max-w-3xl p-4 min-h-screen mt-0 md:mt-16">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-sm text-dark-gray/70">{unread > 0 ? `${unread} unread` : "All caught up"}</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setConfirmClear(true)} disabled={!list.some((n) => n.read)} loading={clearing}>
              Clear read
            </Button>
            <Button size="sm" variant="outline" tone="brand" onClick={markAll} disabled={unread === 0} loading={markingAll}>
              Mark all as read
            </Button>
          </div>
        </div>

        {/* 个人设定：默认永久保存；打开后 90 天以前的已读通知自动删除，未读的永远不删 */}
        {settings && (
          <label className={`mb-3 flex items-start gap-2 text-sm text-dark-gray ${savingSettings ? "opacity-60" : "cursor-pointer"}`}>
            <input
              type="checkbox"
              className="mt-1"
              checked={settings.auto_delete_read_after_90_days}
              disabled={savingSettings}
              onChange={(e) => toggleAutoDelete(e.target.checked)}
            />
            <span>
              Automatically delete read notifications older than 90 days
              <span className="block text-xs text-dark-gray/60">Unread notifications are never deleted.</span>
            </span>
          </label>
        )}

        {notice && <p className="mb-3 rounded-sm border border-border bg-gray-50 p-2 text-sm text-dark-gray" role="status">{notice}</p>}

        {loaded && list.length === 0 && !loading && <p className="text-sm text-dark-gray">No notifications yet.</p>}

        <ul className="divide-y divide-border rounded-md border border-border bg-white">
          {list.map((n) => (
            <li key={n.id} className="flex items-start">
              <button
                type="button"
                onClick={() => open(n)}
                className={`flex min-w-0 flex-1 items-start gap-2 p-3 text-left text-sm hover:bg-gray-50 ${n.read ? "text-dark-gray/80" : "text-dark-gray"}`}
              >
                {/* 未读圆点 */}
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-red"}`} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className={`block break-words ${n.read ? "" : "font-semibold"}`}>{notificationText(n)}</span>
                  <span className="mt-0.5 block text-xs text-dark-gray/60">
                    {formatDate(n.created_at, true)}
                    {!n.target_available && " · No longer available"}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => remove(n)}
                disabled={deletingId === n.id}
                className="shrink-0 p-3 text-dark-gray/50 hover:text-red disabled:opacity-40"
                aria-label="Delete notification"
                title="Delete"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>

        {/* 无限滚动的哨兵；失败时显示重试 */}
        <div ref={sentinelRef} className="py-4 text-center text-xs text-dark-gray/60">
          {loading && "Loading…"}
          {!loading && status === "failed" && (
            <span>
              {error}{" "}
              <button type="button" className="underline" onClick={() => dispatch(fetchNotifications({ beforeId: list.length ? nextBeforeId : null }))}>
                Retry
              </button>
            </span>
          )}
          {!loading && loaded && !hasMore && list.length > 0 && "No more notifications"}
        </div>

        <ConfirmModal
          isOpen={confirmClear}
          title="Clear read notifications"
          message="Delete all read notifications? Unread ones are kept."
          confirmLabel="Delete"
          confirmVariant="danger"
          cancelLabel="Cancel"
          cancelVariant="outline"
          onCancel={() => setConfirmClear(false)}
          onClose={() => setConfirmClear(false)}
          onConfirm={clearRead}
        />
      </div>
    </>
  );
}
