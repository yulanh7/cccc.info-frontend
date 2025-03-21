import { ApiResponse } from './api';

export interface Post {
  id: number;
  title: string;
  date: string;
  author: string;
  group: string;
  description: string;
  videoUrl: string;
}

export interface PostList {
  posts: Post[];
}
export type PostListResponse = ApiResponse<PostList>;

export type PostDetailResponse = ApiResponse<Post>;