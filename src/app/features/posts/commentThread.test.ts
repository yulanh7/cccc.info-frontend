import { insertReplyInOrder, applyLikeResult } from './commentThread';
import type { CommentItemApi } from '@/app/types/comments';

const c = (id: number, created_at: string, extra: object = {}) =>
  ({ id, created_at, body: 'x', user: { id: 1, firstName: 'A' }, post_id: 1, parent_id: 10, reply_to: null,
     updated_at: created_at, is_edited: false, edit_count: 0, like_count: 0, clicked_like: false, children_count: 0, ...extra }) as unknown as CommentItemApi;

describe('insertReplyInOrder', () => {
  it('appends a new reply after older ones (oldest first)', () => {
    const items = [c(1, '2026-10-07T10:00:00'), c(2, '2026-10-07T11:00:00')];
    expect(insertReplyInOrder(items, c(3, '2026-10-07T12:00:00')).map((x) => x.id)).toEqual([1, 2, 3]);
  });
  it('keeps time order even if the new reply is older', () => {
    const items = [c(1, '2026-10-07T10:00:00'), c(2, '2026-10-07T12:00:00')];
    expect(insertReplyInOrder(items, c(3, '2026-10-07T11:00:00')).map((x) => x.id)).toEqual([1, 3, 2]);
  });
  it('does not duplicate an existing reply', () => {
    const items = [c(1, '2026-10-07T10:00:00')];
    expect(insertReplyInOrder(items, c(1, '2026-10-07T10:00:00')).map((x) => x.id)).toEqual([1]);
  });
});

describe('applyLikeResult', () => {
  it('copies like_count and clicked_like from the server', () => {
    const out = applyLikeResult(c(5, '2026-10-07T10:00:00', { like_count: 2 }), { like_count: 3, clicked_like: true });
    expect(out.like_count).toBe(3);
    expect(out.clicked_like).toBe(true);
    expect(out.id).toBe(5);
  });
});
