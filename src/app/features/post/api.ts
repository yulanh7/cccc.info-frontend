import apiRequest from '../request';
import { PostProps, CreatePostCredentials, EditPostCredentials, CreatePostResponse, FetchPostsResponse, GetPostResponse, EditPostResponse, DeletePostResponse } from '@/app/types/post';

export const createPost = async (groupId: number, credentials: CreatePostCredentials): Promise<CreatePostResponse> => {
  const response = await apiRequest<PostProps>(
    'POST',
    `/group/${groupId}/content`,
    credentials,
    true
  );
  return response;
};

export const fetchPosts = async (groupId: number): Promise<FetchPostsResponse> => {
  const response = await apiRequest<PostProps[]>(
    'GET',
    `/group/${groupId}/content`,
    null,
    true
  );
  return response;
};

export const getPost = async (groupId: number, postId: number): Promise<GetPostResponse> => {
  const response = await apiRequest<PostProps>(
    'GET',
    `/group/${groupId}/content/${postId}`,
    null,
    true
  );
  return response;
};

export const editPost = async (groupId: number, postId: number, credentials: EditPostCredentials): Promise<EditPostResponse> => {
  const response = await apiRequest<PostProps>(
    'PUT',
    `/group/${groupId}/content/${postId}`,
    credentials,
    true
  );
  return response;
};

export const deletePost = async (groupId: number, postId: number): Promise<DeletePostResponse> => {
  const response = await apiRequest<null>(
    'DELETE',
    `/group/${groupId}/content/${postId}`,
    null,
    true
  );
  return response;
};