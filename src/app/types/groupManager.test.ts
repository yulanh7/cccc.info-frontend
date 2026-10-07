import { isGroupManager } from './user';
import { canEditGroup, canDeleteGroup, canTransferOwnership } from './group';
import { canWritePosts, canEditPost, canDeletePost } from './post';
import type { UserProps } from './user';
import type { GroupApi } from './group';

const user = (over: Partial<UserProps>): UserProps =>
  ({ id: 1, email: 'a@x.com', firstName: 'A', admin: false, permissions: [], ...over }) as UserProps;
const plainAdmin = user({ admin: true });
const manager = user({ admin: true, permissions: ['manage_groups'] });
const strayGrant = user({ admin: false, permissions: ['manage_groups'] });
const group = { id: 5, is_creator: false, is_leader: false, post_policy: 'leaders_only' } as GroupApi;
const post = (policy: 'members' | 'leaders_only') =>
  ({ id: 9, author: { id: 2, firstName: 'B' }, group: { id: 5, creator: 3, is_creator: false, is_leader: false, post_policy: policy } }) as any;

describe('group manager = admin + manage_groups', () => {
  it('needs both admin and the grant', () => {
    expect(isGroupManager(manager)).toBe(true);
    expect(isGroupManager(plainAdmin)).toBe(false);
    expect(isGroupManager(strayGrant)).toBe(false);
    expect(isGroupManager(null)).toBe(false);
  });
  it('a plain admin cannot manage other people\'s groups', () => {
    expect(canEditGroup(group, plainAdmin)).toBe(false);
    expect(canDeleteGroup(group, plainAdmin)).toBe(false);
    expect(canTransferOwnership(group, plainAdmin)).toBe(false);
  });
  it('a group manager can', () => {
    expect(canEditGroup(group, manager)).toBe(true);
    expect(canDeleteGroup(group, manager)).toBe(true);
    expect(canTransferOwnership(group, manager)).toBe(true);
  });
  it('leaders_only posts: manager yes, plain admin no', () => {
    expect(canWritePosts(group, manager)).toBe(true);
    expect(canWritePosts(group, plainAdmin)).toBe(false);
    expect(canEditPost(post('leaders_only'), manager)).toBe(true);
    expect(canEditPost(post('leaders_only'), plainAdmin)).toBe(false);
    expect(canDeletePost(post('leaders_only'), manager)).toBe(true);
    expect(canDeletePost(post('leaders_only'), plainAdmin)).toBe(false);
  });
  it('members posts: no automatic exemption for the manager', () => {
    expect(canEditPost(post('members'), manager)).toBe(false);
    expect(canDeletePost(post('members'), manager)).toBe(false);
  });
});
