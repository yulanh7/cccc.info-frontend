import { ApiResponseProps } from './api';

export interface PostProps {
  id: number;
  title: string;
  date: string;
  author: string;
  group: string;
  description: string;
  videoUrl: string;
}

export interface PostListProps {
  posts: PostProps[];
}
export type PostListResponse = ApiResponseProps<PostListProps>;

export type PostDetailResponse = ApiResponseProps<PostProps>;