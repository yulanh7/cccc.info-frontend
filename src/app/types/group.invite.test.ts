import { inviteUrl } from './group';

describe('inviteUrl', () => {
  it('builds the join page url', () => {
    expect(inviteUrl('k7Qx_abc', 'https://canberra-ccc.info')).toBe('https://canberra-ccc.info/groups/join/k7Qx_abc');
  });
  it('encodes unsafe characters', () => {
    expect(inviteUrl('a/b c', 'http://localhost:3000')).toBe('http://localhost:3000/groups/join/a%2Fb%20c');
  });
});
