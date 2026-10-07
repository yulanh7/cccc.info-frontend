import { safeNextPath } from './safeNextPath';

describe('safeNextPath', () => {
  it('returns a same-site path as is', () => {
    expect(safeNextPath('/groups/join/abc', '/')).toBe('/groups/join/abc');
    expect(safeNextPath('/library?q=x&page=2', '/')).toBe('/library?q=x&page=2');
  });
  it('decodes an encoded path', () => {
    expect(safeNextPath('%2Fgroups%2Fjoin%2Fabc', '/')).toBe('/groups/join/abc');
  });
  it('falls back for empty values', () => {
    expect(safeNextPath(null, '/')).toBe('/');
    expect(safeNextPath('', '/groups')).toBe('/groups');
  });
  it('rejects other sites and protocol-relative urls', () => {
    expect(safeNextPath('https://evil.com', '/')).toBe('/');
    expect(safeNextPath('//evil.com', '/')).toBe('/');
    expect(safeNextPath('/\\evil.com', '/')).toBe('/');
    expect(safeNextPath('javascript:alert(1)', '/')).toBe('/');
  });
  it('does not send people back to the auth page', () => {
    expect(safeNextPath('/auth', '/')).toBe('/');
    expect(safeNextPath('/auth?next=%2F', '/')).toBe('/');
  });
});
