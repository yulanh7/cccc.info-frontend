import { notificationText, notificationDetail, badgeText, mergeNotifications, notificationHref } from './notification';
import type { AppNotification } from './notification';
import type { JoinRequestStatus } from './group';

const n = (over: Partial<AppNotification>): AppNotification => ({
  id: 1, type: 'post_like', created_at: '2026-10-07T10:00:00', read: false,
  actor: { id: 3, firstName: 'Bob' }, post: { id: 5, title: 'Friday study' }, comment: null, target_available: true, ...over,
});

describe('notificationText', () => {
  it('describes each type', () => {
    expect(notificationText(n({}))).toBe('Bob liked your post "Friday study"');
    expect(notificationText(n({ type: 'post_comment', comment: { id: 9, excerpt: 'Amen' } }))).toBe('Bob commented on your post: Amen');
    expect(notificationText(n({ type: 'comment_reply', comment: { id: 9, excerpt: 'Agreed' } }))).toBe('Bob replied to you: Agreed');
    expect(notificationText(n({ type: 'comment_like', comment: { id: 9, excerpt: 'Nice' } }))).toBe('Bob liked your comment: Nice');
  });
  it('handles missing post / comment (no longer visible)', () => {
    expect(notificationText(n({ post: null, target_available: false }))).toBe('Bob liked your post');
    expect(notificationText(n({ type: 'comment_reply', comment: null, target_available: false }))).toBe('Bob replied to you');
  });
});

describe('badgeText', () => {
  it('caps at 99+', () => {
    expect(badgeText(0)).toBe('');
    expect(badgeText(7)).toBe('7');
    expect(badgeText(100)).toBe('99+');
  });
});

describe('mergeNotifications', () => {
  it('appends older items and drops duplicates', () => {
    const a = [n({ id: 9 }), n({ id: 8 })];
    expect(mergeNotifications(a, [n({ id: 8 }), n({ id: 7 })]).map((x) => x.id)).toEqual([9, 8, 7]);
  });
});

describe('notificationHref', () => {
  it('links to the post, with the comment when there is one', () => {
    expect(notificationHref(n({}))).toBe('/posts/5');
    expect(notificationHref(n({ type: 'comment_reply', comment: { id: 9, excerpt: 'x' } }))).toBe('/posts/5?comment=9');
  });
  it('returns null when the target is gone', () => {
    expect(notificationHref(n({ target_available: false }))).toBeNull();
  });
});

describe('join request notifications', () => {
  const jr = (over: Partial<AppNotification>): AppNotification =>
    n({ type: 'join_request', post: null, group: { id: 4, name: 'Choir' },
        join_request: { id: 31, status: 'pending', message: 'New here', handled_by: null }, ...over });

  it('describes the three types', () => {
    expect(notificationText(jr({}))).toBe('Bob asked to join Choir');
    expect(notificationText(jr({ type: 'join_approved' }))).toBe('Your request to join Choir was approved');
    expect(notificationText(jr({ type: 'join_declined', actor: null }))).toBe('Your request to join Choir was not approved');
    expect(notificationText(jr({ type: 'join_declined', actor: null, group: null }))).toBe('Your request to join a group was not approved');
  });

  it('shows the message, and the result once handled', () => {
    expect(notificationDetail(jr({}))).toEqual({ message: 'New here', result: null });
    const handled = (status: JoinRequestStatus, handled_by: { id: number; firstName: string } | null = null) =>
      notificationDetail(jr({ join_request: { id: 31, status, message: null, handled_by } })).result;
    expect(handled('approved', { id: 3, firstName: 'Alice' })).toBe('Approved by Alice');
    expect(handled('approved')).toBe('Joined via invite link');
    expect(handled('declined', { id: 3, firstName: 'Alice' })).toBe('Declined by Alice');
    expect(handled('withdrawn')).toBe('Request withdrawn');
    expect(handled('cancelled')).toBe('Request cancelled');
    // 申请人自己的通知不显示留言 / 结果
    expect(notificationDetail(jr({ type: 'join_approved' }))).toEqual({ message: null, result: null });
    expect(notificationDetail(n({}))).toEqual({ message: null, result: null });
  });

  it('links to the group (join requests list for managers)', () => {
    expect(notificationHref(jr({}))).toBe('/groups/4?requests=1');
    expect(notificationHref(jr({ type: 'join_approved' }))).toBe('/groups/4');
    expect(notificationHref(jr({ type: 'join_declined', target_available: false, group: null }))).toBeNull();
  });
});
