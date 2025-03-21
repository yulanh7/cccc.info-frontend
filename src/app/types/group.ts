import { ApiResponseProps } from './api';
import { User } from './user';

export interface GroupProps {
  id: number;
  title: string;
  requiresInvitation?: boolean;
  creator: User;
  createdAt: string;
}

export interface GroupListProps {
  Groups: GroupProps[];
}
export type GroupListResponse = ApiResponseProps<GroupListProps>;

export type GroupDetailResponse = ApiResponseProps<GroupProps>;