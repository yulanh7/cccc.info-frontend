import { ApiResponseProps } from './api';
import { UserProps } from './user';

export interface GroupProps {
  id: number;
  title: string;
  requiresInvitation?: boolean;
  creator: UserProps;
  createdAt: string;
}

export interface GroupListProps {
  Groups: GroupProps[];
}
export type GroupListResponse = ApiResponseProps<GroupListProps>;

export type GroupDetailResponse = ApiResponseProps<GroupProps>;