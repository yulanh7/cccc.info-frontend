// groups.ts
import type { ApiResponseProps } from "./api";
import type { UserProps } from "./user";
import { unwrapData } from '@/app/types'

/** ===================== UI Models ===================== */
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
  groups: GroupProps[];
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  buildHref?: (page: number) => string;
  onPageChange?: (page: number) => void;
  siblingCount?: number;
  className?: string;
}

/** UI helpers */
export type GroupMemberUi = { id: number; firstName: string; email: string; isCreator: boolean };

/** ===================== API Models (mirror backend) ===================== */
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
export type AddMemberRequest = { user_id?: number; email?: string };
export type AddMemberResponseApi = ApiResponseProps<{
  member: { id: number; firstName: string; email: string; is_creator?: boolean };
}>;
export type KickMemberResponseApi = ApiResponseProps<{}>;
export type MembersListResponseApi = ApiResponseProps<MembersListData>;
export type GroupStatsResponseApi = ApiResponseProps<GroupStats>;



/** ===================== Small Utils ===================== */
const toNumber = (v: number | string | undefined | null): number =>
  typeof v === "number" ? v : Number.isFinite(Number(v)) ? Number(v) : 0;

/** ===================== Mapping: API -> UI ===================== */
export const mapGroupApiToProps = (g: GroupApi): GroupProps => {
  const creatorId = toNumber(g.creator);
  const creatorName =
    g.creator_name ?? (typeof g.creator === "string" ? g.creator : "");

  return {
    id: g.id,
    title: g.name ?? "",
    description: g.description ?? "",
    createdDate: g.time ?? "",
    creator: {
      id: creatorId,
      firstName: creatorName ?? "",
      email: "",
      admin: false,
    },
    subscribed: Boolean(g.is_member),
    editable: Boolean(g.is_creator),
    isPrivate: Boolean((g as any).isPrivate ?? (g as any).is_private ?? g.isPrivate),
  };
};

/** 列表响应 -> UI 列表 + 分页 */
export const mapGroupsListApiToUi = (
  res: GroupsListResponseApi
): { groups: GroupProps[]; pagination: PaginationProps } => {
  const data = unwrapData(res);
  return {
    groups: (data.groups ?? []).map(mapGroupApiToProps),
    pagination: {
      currentPage: data.pagination?.page ?? 1,
      totalPages: data.pagination?.pages ?? 1,
    },
  };
};

/** 详情响应 -> UI（附带 subscribers -> UserProps[]） */
export const mapGroupDetailApiToUi = (
  res: GroupDetailResponseApi
): GroupProps & { subscribers: UserProps[] } => {
  const data = unwrapData(res);
  const base = mapGroupApiToProps(data as GroupApi); // GroupDetailData extends GroupApi
  const subscribers: UserProps[] = (data.subscribers ?? []).map((s) => ({
    id: s.id,
    firstName: s.firstName ?? "",
    email: s.email ?? "",
    admin: false,
  }));
  return { ...base, subscribers };
};
export type GroupSubscriberUi = { id: number; firstName: string; email: string };

/** 成员列表响应 -> UI */
export const mapMembersListApiToUi = (
  res: MembersListResponseApi
): { members: GroupMemberUi[]; pagination: PaginationProps } => {
  const data = unwrapData(res);
  return {
    members: (data.members ?? []).map((m) => ({
      id: m.id,
      firstName: m.firstName ?? "",
      email: m.email ?? "",
      isCreator: Boolean(m.is_creator),
    })),
    pagination: {
      currentPage: data.pagination?.page ?? 1,
      totalPages: data.pagination?.pages ?? 1,
    },
  };
};

/** 统计响应 -> UI（如需要在 UI 使用可直接返回） */
export const mapGroupStatsApiToUi = (res: GroupStatsResponseApi): GroupStats =>
  unwrapData(res);

/** ===================== Permissions ===================== */
export const canEditGroup = (g: GroupProps) => g.editable === true;

/** ===================== (Optional) UI -> API DTO ===================== */
export const toCreateOrUpdateGroupBody = (
  g: Pick<GroupProps, "title" | "description" | "isPrivate">
): CreateOrUpdateGroupBody => ({
  name: g.title,
  description: g.description,
  isPrivate: g.isPrivate,
});

export interface GroupEditModalProps {
  group?: GroupProps | any;
  isNew?: boolean;
  onSave: (updatedGroup: GroupProps) => void;
  onClose: () => void;
  saving?: boolean;
  externalErrors?: { title?: string; description?: string } | null;
}