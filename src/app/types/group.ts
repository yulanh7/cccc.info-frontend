import type { ApiResponseProps } from './api';
import type { UserProps } from './user';

/** ===================== UI Model (unchanged) ===================== */
export interface GroupProps {
  id: number;
  title: string;
  description: string;
  createdDate: string;
  creator: UserProps;
  subscribed: boolean;
  editable: boolean;
  inviteOnly: boolean;
}

export interface GroupListProps {
  Groups: GroupProps[];
}
export type GroupListResponse = ApiResponseProps<GroupListProps>;
export type GroupDetailResponse = ApiResponseProps<GroupProps>;

/** ===================== API Model (UPDATED) ===================== */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  buildHref?: (page: number) => string;
  onPageChange?: (page: number) => void;
  siblingCount?: number;
  className?: string;
}

export interface GroupApi {
  id: number;
  name: string;
  description: string;
  creator: number;
  creator_name: string;
  time: string;
  isPrivate: boolean;
  subscriber_count: number;
  is_member: boolean;
  is_creator: boolean;
}

export interface GroupsListData {
  groups: GroupApi[];
  pagination: PaginationProps;
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
  pagination: PaginationProps;
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

/** API response wrappers */
export type CreateGroupResponse = ApiResponseProps<{ group: GroupApi }>;
export type UpdateGroupResponse = ApiResponseProps<{ group: GroupApi }>;
export type GroupsListResponseApi = ApiResponseProps<GroupsListData>;
export type GroupDetailResponseApi = ApiResponseProps<GroupDetailData>;
export type MembersListResponseApi = ApiResponseProps<MembersListData>;
export type GroupStatsResponseApi = ApiResponseProps<GroupStats>;

/** ===================== Mapping: API -> UI (UPDATED) ===================== */
export const mapGroupApiToProps = (g: GroupApi): GroupProps => ({
  id: g.id,
  title: g.name,
  description: g.description,
  createdDate: g.time,
  creator: {
    id: g.creator,
    firstName: g.creator_name,
    email: '',
    admin: false,
  },
  subscribed: g.is_member,
  editable: g.is_creator,
  inviteOnly: g.isPrivate,
});
