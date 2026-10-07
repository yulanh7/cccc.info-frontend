/** 无限滚动：追加下一页时去重（浏览期间有新内容会让后面的页整体后移，可能拿到重复项） */
export function appendUnique<T>(existing: T[], incoming: T[], keyOf: (x: T) => string | number): T[] {
  const seen = new Set(existing.map(keyOf));
  const out = existing.slice();
  for (const x of incoming) {
    const k = keyOf(x);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
  }
  return out;
}

/** 图书馆目录的分组没有 id：用分类 + 书名 + 作者 + 出版社 + 类型作为键（和后端分组规则一致） */
export const catalogGroupKey = (g: {
  category: string;
  title: string;
  creator: string | null;
  publisher: string | null;
  item_type: string;
}): string => [g.category, g.title, g.creator ?? '', g.publisher ?? '', g.item_type].join('|');
