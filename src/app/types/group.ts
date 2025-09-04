import type { ApiResponseProps } from "./api";
import type { UserProps } from "./user";

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
  }>;
}

export interface MembersListData {
  members: Array<{
    id: number;
    firstName: string;
    email: string;
    is_creator: boolean;
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
export type MembersListResponseApi = ApiResponseProps<MembersListData>;
export type GroupStatsResponseApi = ApiResponseProps<GroupStats>;

/** 群组编辑权限：必须是群组创建者 */
export const canEditGroup = (group: GroupApi): boolean =>
  group.is_creator;
