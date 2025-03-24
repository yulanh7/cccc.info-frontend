import { ApiResponseProps } from './api';
import { UserProps } from './user';

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