import { ApiResponseProps } from './api';

export interface PostProps {
  id: number;
  title: string;
  content: string;
  group_id: number;
  user_id: number;
  created_at: string;
}

export interface CreatePostCredentials {
  title: string;
  content: string;
}

export interface EditPostCredentials {
  title: string;
  content: string;
}

export type CreatePostResponse = ApiResponseProps<PostProps>;
export type FetchPostsResponse = ApiResponseProps<PostProps[]>;
export type GetPostResponse = ApiResponseProps<PostProps>;
export type EditPostResponse = ApiResponseProps<PostProps>;
export type DeletePostResponse = ApiResponseProps<null>;