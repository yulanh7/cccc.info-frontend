import type { ApiResponseProps } from "./api";
import type { UserProps } from "./user";

/** 发帖权限：members = 所有成员可发帖；leaders_only = 仅组长可发帖/编辑/删帖 */
export type PostPolicy = "members" | "leaders_only";
export const DEFAULT_POST_POLICY: PostPolicy = "members";

/** 评论权限：everyone = 所有人可评论；leaders_only = 仅 admin / 创建者 / 组长可评论 */
export type CommentPolicy = "everyone" | "leaders_only";
export const DEFAULT_COMMENT_POLICY: CommentPolicy = "everyone";
export const COMMENT_POLICY_LABELS: Record<CommentPolicy, string> = {
  everyone: "Everyone can comment",
  leaders_only: "Only leaders can comment",
};


export type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange?: (p: number) => void;
  siblingCount?: number;
  className?: string;
  buildHref?: (page: number) => string;
};

/** ===================== API Models (mirror backend) ===================== */
export interface GroupApi {
  id: number;
  name: string;
  description: string;
  creator: number;
  creator_name?: string;
  time: string;
  isPrivate: boolean;
  subscriber_count: number;
  is_member: boolean;
  is_creator: boolean;
  is_leader?: boolean;
  post_policy?: PostPolicy;
  comment_policy?: CommentPolicy;
  post_count?: number;
  /** 仅创建者 / 组长的响应有：是否允许用链接加入 */
  invite_enabled?: boolean;
  /** 仅创建者 / 组长、且已打开时有 */
  invite_code?: string | null;
}

export interface GroupListPaginationApi {
  page: number;
  per_page: number;
  total: number;
  pages: number;
}

export interface GroupsListData {
  groups: GroupApi[];
  pagination: GroupListPaginationApi;
}

export interface GroupDetailData extends GroupApi {
  subscribers: Array<{
    id: number;
    firstName: string;
    email: string;
    is_creator?: boolean;
    is_leader?: boolean;
  }>;
}

export interface MembersListData {
  members: Array<{
    id: number;
    firstName: string;
    email: string;
    is_creator: boolean;
    is_leader?: boolean;
  }>;
  pagination: GroupListPaginationApi;
}

export interface GroupStats {
  member_count: number;
  post_count: number;
  today_posts: number;
  week_posts: number;
  latest_activity: string;
  created_at: string;
}

export interface CreateOrUpdateGroupBody {
  name: string;
  description: string;
  isPrivate: boolean;
  post_policy?: PostPolicy;
  comment_policy?: CommentPolicy;
}

/** ===================== API Response Wrappers ===================== */
export type CreateGroupResponse = ApiResponseProps<{ group: GroupApi }>;
export type UpdateGroupResponse = ApiResponseProps<{ group: GroupApi }>;
export type GroupsListResponseApi = ApiResponseProps<GroupsListData>;
export type GroupDetailResponseApi = ApiResponseProps<GroupDetailData>;
export type AddMemberRequest = { user_id?: number; email?: string };
export type AddMemberResponseApi = ApiResponseProps<{
  member: { id: number; firstName: string; email: string; is_creator?: boolean };
}>;
export type KickMemberResponseApi = ApiResponseProps<{}>;
export type TransferOwnershipResponseApi = ApiResponseProps<{ group: GroupApi }>;
export type AddLeaderResponseApi = ApiResponseProps<{
  leader: { id: number; firstName: string; email: string };
}>;
export type MembersListResponseApi = ApiResponseProps<MembersListData>;
export type GroupStatsResponseApi = ApiResponseProps<GroupStats>;

/** 编辑小组设置 / 管理成员 / 加撤组长：admin、创建者、任一组长 */
export const canEditGroup = (group: GroupApi, user?: UserProps | null): boolean =>
  !!user?.admin || group.is_creator || !!group.is_leader;

/** 转让创建者：仅 admin、当前创建者 */
export const canTransferOwnership = (group: GroupApi, user?: UserProps | null): boolean =>
  !!user?.admin || group.is_creator;

/** 删除小组：仅 admin、创建者（组长不行） */
export const canDeleteGroup = (group: GroupApi, user?: UserProps | null): boolean =>
  !!user?.admin || group.is_creator;


export type RawUserGroup = {
  id: number;
  name: string;
  description: string;
  creator: { id: number; firstName: string };
  time: string;
  isPrivate: boolean;
  subscriber_count: number;
  post_count: number;
  post_policy?: PostPolicy;
  comment_policy?: CommentPolicy;
  is_leader?: boolean;
};

export type RawAllGroup = {
  id: number;
  name: string;
  description: string;
  creator: number;
  creator_name?: string;
  time: string;
  isPrivate: boolean;
  subscriber_count: number;
  is_member?: boolean;
  is_creator?: boolean;
  is_leader?: boolean;
  post_policy?: PostPolicy;
  comment_policy?: CommentPolicy;
};

export const normalizeFromUserGroups = (
  g: RawUserGroup,
  currentUserId?: number
): GroupApi => ({
  id: g.id,
  name: g.name,
  description: g.description,
  creator: g.creator.id,
  creator_name: g.creator.firstName,
  time: g.time,
  isPrivate: g.isPrivate,
  subscriber_count: g.subscriber_count,
  post_count: g.post_count,
  is_member: true, // 已订阅列表，恒为 true
  is_creator: currentUserId ? g.creator.id === Number(currentUserId) : false,
  is_leader: g.is_leader,
  post_policy: g.post_policy,
  comment_policy: g.comment_policy,
});

export const normalizeFromAllGroups = (
  g: RawAllGroup
): GroupApi => ({
  id: g.id,
  name: g.name,
  description: g.description,
  creator: g.creator,
  creator_name: g.creator_name,
  time: g.time,
  isPrivate: g.isPrivate,
  subscriber_count: g.subscriber_count,
  is_member: Boolean(g.is_member),
  is_creator: Boolean(g.is_creator),
  is_leader: Boolean(g.is_leader),
  post_policy: g.post_policy,
  comment_policy: g.comment_policy,
});

/** ===================== 邀请链接 ===================== */
export type GroupInviteState = { invite_enabled: boolean; invite_code: string | null };

export type InvitePreview = {
  group: { id: number; name: string; description: string; subscriber_count: number };
  is_member: boolean;
};

export type InviteJoinResult = { group: GroupApi; already_member: boolean };

/** 分享用的完整网址 */
export const inviteUrl = (code: string, origin: string): string =>
  `${origin}/groups/join/${encodeURIComponent(code)}`;
