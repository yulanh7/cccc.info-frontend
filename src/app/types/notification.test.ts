import { notificationText, badgeText, mergeNotifications, notificationHref } from './notification';
import type { AppNotification } from './notification';

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
