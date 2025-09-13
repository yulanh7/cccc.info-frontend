import { ApiResponseProps, UserProps } from '@/app/types'

export type postsPagination = {
  current_page: number;
  total_pages: number;
  total_posts: number;
};

export type PostFileApi = {
  id: number;
  filename: string;
  url: string;
  file_size: number;
  file_type: string;
  upload_time: string;
};



export type PostGroupApi = {
  id: number;
  name: string;
  isPrivate: boolean;
  creator: number;
};


export type PostVideoApi = {
  id: number;
  url: string;
};

/** 1) 创建帖子 - POST /api/groups/{group_id}/posts */
export type CreatePostRequest = {
  title: string;
  content: string;
  description: string;
  video_urls?: string[];
  file_ids?: number[];
};

export type CreatedPostData = {
  post: {
    id: number;
    title: string;
    description: string;
    videos: PostVideoApi[];
    files: PostFileApi[]; // 直接使用文件元数据类型
    group_id: number;
    user_id: number;
    created_at: string;
  };
};
export type CreatePostResponse = ApiResponseProps<CreatedPostData>;

/** 2) 获取群组帖子列表 - GET /api/groups/{group_id}/posts */
export type PostListItemApi = {
  id: number;
  title: string;
  author: {
    id: number;
    firstName: string;
  };
  created_at: string;
  summary: string;
  like_count: number;
  has_files: boolean;
  has_videos: boolean;
  videos: string[];
  files: string[];
  clicked_like: boolean;
  group: PostGroupApi;
};

export type PostListData = {
  posts: PostListItemApi[];
} & postsPagination;

export type PostListResponse = ApiResponseProps<PostListData>;

/** 3) 获取帖子详情 - GET /api/posts/{post_id} */
export type PostDetailData = {
  id: number;
  title: string;
  content: string;
  description: string;
  videos: PostVideoApi[];
  files: PostFileApi[];
  author: {
    id: number;
    firstName: string;
  };
  created_at: string;
  like_count: number;
  clicked_like: boolean;
  group: PostGroupApi;
};

export type PostDetailResponse = ApiResponseProps<PostDetailData>;

/** 4) 更新/删除 */
export type UpdatePostRequest = CreatePostRequest;

export type UpdatePostData = {
  post: PostDetailData;
};
export type UpdatePostResponse = ApiResponseProps<UpdatePostData>;

export type DeletePostData = {};
export type DeletePostResponse = ApiResponseProps<DeletePostData>;

/** 5) 点赞 / 取消点赞 */
export type LikePostData = { like_count: number };
export type LikePostResponse = ApiResponseProps<LikePostData>;

export type UnlikePostData = { like_count?: number };
export type UnlikePostResponse = ApiResponseProps<UnlikePostData>;

/** 6) 点赞列表 - GET /api/posts/{post_id}/likes */
export type PostLikeItemApi = {
  id: number;
  user: { id: number; firstName: string };
  created_at: string;
};

export type PostLikesData = {
  likes: PostLikeItemApi[];
  pagination: postsPagination;
};
export type PostLikesResponse = ApiResponseProps<PostLikesData>;

/** 7) 附件 ID 列表 - GET /api/posts/{post_id}/files */
export type PostFileIdsData = { file_ids: number[] };
export type PostFileIdsResponse = ApiResponseProps<PostFileIdsData>;

/* ======================================================
 *                  通用权限判断（列表/详情）
 * ====================================================== */

export const canEditPostList = (post: PostListItemApi, user?: UserProps | null) =>
  !!user && Number(post.author.id) === Number(user.id);


export const canEditPostDetail = (
  post?: PostDetailData | null,
  user?: UserProps | null
): boolean => {
  if (!post || !user) return false;

  // Prefer a stable author id field if your API has one
  const postAuthorId =
    post.author?.id ??
    // fallback fields if your API provides creator id separately
    (post as any).author_id ??
    (post as any).created_by_id ??
    null;

  if (!postAuthorId || !user.id) return false;
  return Number(postAuthorId) === Number(user.id);
};

export function isPostAuthor(
  post: PostListItemApi | PostDetailData | null | undefined,
  user?: UserProps | null
): boolean {
  if (!post || !user) return false;

  // 列表与详情字段略不同：列表一定有 author.id；详情可能有其他备用字段
  const authorId =
    (post as any).author?.id ??
    (post as any).author_id ??
    (post as any).created_by_id ??
    null;

  return authorId != null && Number(authorId) === Number(user.id);
}

/**
 * 判断当前用户是否是该帖子所在群组的创建者
 */
export function isGroupCreatorOfPost(
  post: PostListItemApi | PostDetailData | null | undefined,
  user?: UserProps | null
): boolean {
  if (!post || !user) return false;
  // group.creator 现在是 number
  const creatorId = (post as any).group?.creator ?? null;
  return creatorId != null && Number(creatorId) === Number(user.id);
}
