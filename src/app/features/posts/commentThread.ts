import type { CommentItemApi } from '@/app/types/comments';

/** 一串回复按时间先后（旧的在前）；新回复按 created_at 插进正确位置，已存在就不重复 */
export function insertReplyInOrder(items: CommentItemApi[], reply: CommentItemApi): CommentItemApi[] {
  if (items.some((x) => x.id === reply.id)) return items;
  const t = Date.parse(reply.created_at);
  const idx = items.findIndex((x) => Date.parse(x.created_at) > t);
  return idx < 0 ? [...items, reply] : [...items.slice(0, idx), reply, ...items.slice(idx)];
}

/** 点赞 / 取消点赞后，用后端返回的数字更新这一条 */
export function applyLikeResult(
  c: CommentItemApi,
  res: { like_count: number; clicked_like: boolean }
): CommentItemApi {
  return { ...c, like_count: res.like_count, clicked_like: res.clicked_like };
}
