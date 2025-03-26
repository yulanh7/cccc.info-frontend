import { ApiResponseProps } from './api';

export interface MessageProps {
  id: number;
  title: string;
  participants: number[]; // 用户 ID 数组
  messages: { senderId: number; content: string; timestamp: string }[];
}

export interface MessageListProps {
  posts: MessageProps[];
}
export type MessageListResponse = ApiResponseProps<MessageListProps>;

export type MessageDetailResponse = ApiResponseProps<MessageProps>;