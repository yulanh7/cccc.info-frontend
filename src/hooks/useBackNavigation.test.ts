import { shouldScrollToTop } from './useBackNavigation';

describe('shouldScrollToTop', () => {
  const now = 100_000;
  it('scrolls to the top when opening a new page', () => {
    expect(shouldScrollToTop('/groups', '/groups/1', 0, now)).toBe(true);
  });
  it('leaves the position alone when coming back (restore handles it)', () => {
    expect(shouldScrollToTop('/groups/1', '/groups', now - 500, now)).toBe(false);
  });
  it('a return mark that is too old does not count', () => {
    expect(shouldScrollToTop('/groups', '/groups/1', now - 10_000, now)).toBe(true);
  });
  it('does nothing on first load or when only the query changes', () => {
    expect(shouldScrollToTop(null, '/groups', 0, now)).toBe(false);
    expect(shouldScrollToTop('/groups', '/groups', 0, now)).toBe(false);
  });
});
