/** ===================== 站内通知（对应后端 /api/notifications） ===================== */

import type { JoinRequestStatus } from './group';

export type NotificationType =
  | 'post_like' | 'comment_like' | 'post_comment' | 'comment_reply'
  | 'join_request' | 'join_approved' | 'join_declined';

export type AppNotification = {
  id: number;
  type: NotificationType;
  created_at: string;
  read: boolean;
  /** join_declined 一律为 null（申请人看不到是谁拒绝的） */
  actor: { id: number; firstName: string } | null;
  /** 看不到的帖子为 null */
  post: { id: number; title: string } | null;
  /** post_like 以外有；看不到时为 null */
  comment?: { id: number; excerpt: string } | null;
  /** 只有加入申请类有；小组已删除或看不到时为 null */
  group?: { id: number; name: string } | null;
  /** 只有加入申请类有：这条申请现在的状态 */
  join_request?: {
    id: number;
    status: JoinRequestStatus;
    message: string | null;
    handled_by: { id: number; firstName: string } | null;
  } | null;
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
    case 'join_request':
      return `${who} asked to join ${n.group?.name ?? 'your group'}`;
    case 'join_approved':
      return `Your request to join ${n.group?.name ?? 'a group'} was approved`;
    case 'join_declined':
      return `Your request to join ${n.group?.name ?? 'a group'} was not approved`;
    default:
      return `${who} interacted with your post`;
  }
}

/** join_request 通知的第二行：申请留言，和处理后的结果（灰色显示）。其他类型都是 null */
export function notificationDetail(n: AppNotification): { message: string | null; result: string | null } {
  const jr = n.type === 'join_request' ? n.join_request : null;
  if (!jr) return { message: null, result: null };
  const by = jr.handled_by?.firstName;
  const result =
    jr.status === 'approved' ? (by ? `Approved by ${by}` : 'Joined via invite link')
    : jr.status === 'declined' ? (by ? `Declined by ${by}` : 'Declined')
    : jr.status === 'withdrawn' ? 'Request withdrawn'
    : jr.status === 'cancelled' ? 'Request cancelled'
    : null;
  return { message: jr.message || null, result };
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
  if (!n.target_available) return null;
  // 加入申请类：管理者去小组的 Join requests 列表，申请人去小组页
  if (n.type === 'join_request' || n.type === 'join_approved' || n.type === 'join_declined') {
    if (!n.group) return null;
    return n.type === 'join_request' ? `/groups/${n.group.id}?requests=1` : `/groups/${n.group.id}`;
  }
  if (!n.post) return null;
  return n.comment ? `/posts/${n.post.id}?comment=${n.comment.id}` : `/posts/${n.post.id}`;
}
