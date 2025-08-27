import type { ApiResponseProps } from './api';
import type { UserProps } from './user';

/** ===================== UI Model ===================== */
export interface GroupProps {
  id: number;
  title: string;
  description: string;
  createdDate: string;
  creator: UserProps;
  subscribed: boolean;
  editable: boolean;
  isPrivate: boolean;

}

export interface GroupListProps {
  Groups: GroupProps[];
}

export type GroupListResponse = ApiResponseProps<GroupListProps>;
export type GroupDetailResponse = ApiResponseProps<GroupProps>;

/** ===================== UI Pagination Props (for component) ===================== */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  buildHref?: (page: number) => string;
  onPageChange?: (page: number) => void;
  siblingCount?: number;
  className?: string;
}

/** ===================== API Model ===================== */
export interface GroupApi {
  id: number;
  name: string;
  description: string;
  creator: number | string;
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
export type MembersListResponseApi = ApiResponseProps<MembersListData>;
export type GroupStatsResponseApi = ApiResponseProps<GroupStats>;

/** ===================== Mapping: API -> UI ===================== */
export const mapGroupApiToProps = (g: GroupApi): GroupProps => {
  const creatorId =
    typeof g.creator === 'number'
      ? g.creator
      : Number.isFinite(Number(g.creator))
        ? Number(g.creator)
        : 0;

  const creatorName =
    g.creator_name ?? (typeof g.creator === 'string' ? g.creator : '');

  return {
    id: g.id,
    title: g.name,
    description: g.description,
    createdDate: g.time,
    creator: {
      id: creatorId,
      firstName: creatorName,
      email: '',
      admin: false,
    },
    subscribed: g.is_member,
    editable: g.is_creator,
    isPrivate: g.isPrivate,
  };
};


/** ========== Posts API & UI Types ========== */
export interface GroupPostApi {
  id: number;
  title: string;
  author: { id: number; firstName: string };
  created_at: string;
  summary: string;
  like_count: number;
  has_files: boolean;
  has_videos: boolean;
}

export interface GroupPostsData {
  posts: GroupPostApi[];
  total_pages: number;
  current_page: number;
  total_posts: number;
}

export type GroupPostsResponseApi = ApiResponseProps<GroupPostsData>;

export interface GroupSubscriber {
  id: number;
  firstName: string;
  email: string;
}

export interface PostListItem {
  id: number;
  title: string;
  authorName: string;
  createdAt: string;
  summary: string;
  likeCount: number;
  hasFiles: boolean;
  hasVideos: boolean;
}

export const mapPostApiToListItem = (p: GroupPostApi): PostListItem => ({
  id: p.id,
  title: p.title,
  authorName: p.author?.firstName ?? '',
  createdAt: p.created_at,
  summary: p.summary,
  likeCount: p.like_count,
  hasFiles: p.has_files,
  hasVideos: p.has_videos,
});
