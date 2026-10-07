/** ===================== 站内通知（对应后端 /api/notifications） ===================== */

export type NotificationType = 'post_like' | 'comment_like' | 'post_comment' | 'comment_reply';

export type AppNotification = {
  id: number;
  type: NotificationType;
  created_at: string;
  read: boolean;
  actor: { id: number; firstName: string };
  /** 看不到的帖子为 null */
  post: { id: number; title: string } | null;
  /** post_like 以外有；看不到时为 null */
  comment?: { id: number; excerpt: string } | null;
  /** false：帖子 / 评论已删除，或已经看不到 */
  target_available: boolean;
};

export type NotificationsPage = {
  notifications: AppNotification[];
  /** null = 没有更多了；下一页原样作为 before_id 传回 */
  next_before_id: number | null;
};

/** 一条通知的文字 */
export function notificationText(n: AppNotification): string {
  const who = n.actor?.firstName || 'Someone';
  const excerpt = n.comment?.excerpt;
  switch (n.type) {
    case 'post_like':
      return n.post ? `${who} liked your post "${n.post.title}"` : `${who} liked your post`;
    case 'post_comment':
      return excerpt ? `${who} commented on your post: ${excerpt}` : `${who} commented on your post`;
    case 'comment_reply':
      return excerpt ? `${who} replied to you: ${excerpt}` : `${who} replied to you`;
    case 'comment_like':
      return excerpt ? `${who} liked your comment: ${excerpt}` : `${who} liked your comment`;
    default:
      return `${who} interacted with your post`;
  }
}

/** 角标文字：0 不显示，超过 99 显示 99+ */
export const badgeText = (count: number): string => (count <= 0 ? '' : count > 99 ? '99+' : String(count));

/** 无限滚动：追加更旧的一页，按 id 去重 */
export function mergeNotifications(existing: AppNotification[], incoming: AppNotification[]): AppNotification[] {
  const seen = new Set(existing.map((x) => x.id));
  return [...existing, ...incoming.filter((x) => !seen.has(x.id))];
}

/** 点通知要去的地方；有评论时带 ?comment=<id>，帖子页会定位到那条评论。看不到时为 null */
export function notificationHref(n: AppNotification): string | null {
  if (!n.target_available || !n.post) return null;
  return n.comment ? `/posts/${n.post.id}?comment=${n.comment.id}` : `/posts/${n.post.id}`;
}
