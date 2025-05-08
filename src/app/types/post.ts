import { ApiResponseProps } from './api';

export interface PostProps {
  id: number;
  title: string;
  date: string;
  author: string;
  group: string;
  description: string;
  videoUrl: string;
  files?: { url: string; name: string }[];
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

