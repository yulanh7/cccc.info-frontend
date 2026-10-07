import { appendUnique, catalogGroupKey } from './infiniteList';

describe('appendUnique', () => {
  it('appends the next page and drops items already shown', () => {
    const page1 = [{ id: 3 }, { id: 2 }];
    const page2 = [{ id: 2 }, { id: 1 }];
    expect(appendUnique(page1, page2, (x) => x.id).map((x) => x.id)).toEqual([3, 2, 1]);
  });
  it('keeps the original items when the next page is empty', () => {
    expect(appendUnique([{ id: 1 }], [], (x) => x.id).map((x) => x.id)).toEqual([1]);
  });
});

describe('catalogGroupKey', () => {
  it('builds a key from category, title, creator, publisher and type', () => {
    const g = { category: 'C', title: 'T', creator: null, publisher: 'P', item_type: 'book' } as any;
    expect(catalogGroupKey(g)).toBe('C|T||P|book');
  });
});
