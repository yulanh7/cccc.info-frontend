import { ApiResponse } from './api';
import { User } from './user';

export interface Group {
  id: number;
  title: string;
  requiresInvitation?: boolean;
  creator: User;
  createdAt: string;
}

export interface GroupList {
  Groups: Group[];
}
export type GroupListResponse = ApiResponse<GroupList>;

export type GroupDetailResponse = ApiResponse<Group>;