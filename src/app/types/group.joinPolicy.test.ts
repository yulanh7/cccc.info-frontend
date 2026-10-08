import { joinPolicyOf, isLockedForMe } from './group';
import type { GroupApi } from './group';
import type { UserProps } from './user';

const g = (over: Partial<GroupApi>): GroupApi => ({
  id: 1, name: 'Choir', description: '', creator: 2, time: '', isPrivate: false,
  subscriber_count: 3, is_member: false, is_creator: false, ...over,
});
const user = (over: Partial<UserProps> = {}): UserProps => ({ id: 9, firstName: 'Bob', email: 'b@x', admin: false, permissions: [], ...over } as UserProps);

describe('joinPolicyOf', () => {
  it('uses join_policy, falling back to isPrivate for old responses', () => {
    expect(joinPolicyOf(g({ join_policy: 'request' }))).toBe('request');
    expect(joinPolicyOf(g({ isPrivate: true }))).toBe('private');
    expect(joinPolicyOf(g({}))).toBe('open');
  });
});

describe('isLockedForMe', () => {
  it('locks request groups for non-members only', () => {
    expect(isLockedForMe(g({ join_policy: 'request' }), user())).toBe(true);
    expect(isLockedForMe(g({ join_policy: 'request', is_member: true }), user())).toBe(false);
    expect(isLockedForMe(g({ join_policy: 'open' }), user())).toBe(false);
  });
  it('does not lock group managers (admin + manage_groups)', () => {
    expect(isLockedForMe(g({ join_policy: 'request' }), user({ admin: true, permissions: ['manage_groups'] } as any))).toBe(false);
    expect(isLockedForMe(g({ join_policy: 'request' }), user({ admin: true } as any))).toBe(true);
  });
});
