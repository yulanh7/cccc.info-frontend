// app/types/groups.ts
import type { ApiResponseProps } from './api';
import type { UserProps } from './user';

/** ===================== UI Model (keep your existing shape) ===================== */
export interface GroupProps {
  id: number;
  title: string;
  description: string;
  createdDate: string;      // ISO
  creator: UserProps;       // UserProps
  subscribed: boolean;      // is_member
  editable: boolean;        // is_creator or admin
  inviteOnly: boolean;      // isPrivate
}

export interface GroupListProps {
  Groups: GroupProps[];
}
export type GroupListResponse = ApiResponseProps<GroupListProps>;
export type GroupDetailResponse = ApiResponseProps<GroupProps>;

/** ===================== API Model (matches backend JSON) ===================== */
export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  pages: number;
}

export interface CreatorApi {
  id: number;
  firstName: string;
  email: string;
}

export interface GroupApi {
  id: number;
  name: string;
  description: string;
  creator: CreatorApi;      // <-- changed to object
  time: string;             // ISO
  isPrivate: boolean;
  subscriber_count: number;
  is_member: boolean;
  is_creator: boolean;
}

export interface GroupsListData {
  groups: GroupApi[];
  pagination: Pagination;
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
  pagination: Pagination;
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

export type CreateGroupResponse = ApiResponseProps<{ group: GroupApi }>;
export type UpdateGroupResponse = ApiResponseProps<{ group: GroupApi }>;
export type GroupsListResponseApi = ApiResponseProps<GroupsListData>;
export type GroupDetailResponseApi = ApiResponseProps<GroupDetailData>;
export type MembersListResponseApi = ApiResponseProps<MembersListData>;
export type GroupStatsResponseApi = ApiResponseProps<GroupStats>;

/** ===================== Mapping: API -> UI ===================== */
export const mapGroupApiToProps = (g: GroupApi): GroupProps => ({
  id: g.id,
  title: g.name,
  description: g.description,
  createdDate: g.time,
  creator: {
    id: g.creator.id,
    email: g.creator.email,
    firstName: g.creator.firstName,
    admin: false, // backend doesn't provide this; default to false
  },
  subscribed: g.is_member,
  editable: g.is_creator,
  inviteOnly: g.isPrivate,
});
