// posts.ts
import type { ApiResponseProps } from "./api";
import type { UserProps } from "./user";

/* ===================== Shared UI fragments ===================== */
export type AuthorLite = { id: number; firstName: string };

export type UiFile = {
  url: string;
  name: string;
  size?: number;
  type?: string;
  uploadedAt?: string;
};


/* ===================== UI Base & Variants ===================== */
/** 最小公共 UI 基类：列表/详情都具备 */
export interface PostBaseUi {
  id: number;
  title: string;
  date: string;
  author: AuthorLite;
  like_count: number;
}

/** 列表形态（轻信息） */
export interface PostListUi extends PostBaseUi {
  group: string;
  description: string;
  hasFiles: boolean;
  videos: string[];
}

/** 详情形态（重信息） */
export interface PostDetailUi extends PostBaseUi {
  group: string;
  description: string;
  contentHtml?: string;
  videos: string[];
  files: UiFile[];
}

/** 如需兼容原来的 PostProps：把详情形态当作 PostProps */
export type PostProps = PostDetailUi;

/* ===================== API Models（忠实后端 3.1–3.9） ===================== */
// 3.1 Create
export interface CreatePostRequest {
  title: string;
  content: string;
  description: string;
  videos: string[];
  file_ids: number[];
}
export interface PostDetailFileApi {
  id: number;
  filename: string;
  url: string;
  file_size: number;
  file_type: string;
  upload_time: string;
}
export interface PostDetailVideoApi { id: number; url: string; }
export interface PostDetailApi {
  id: number;
  title: string;
  content: string;
  description: string;
  videos: PostDetailVideoApi[];
  files: PostDetailFileApi[];
  group_id: number;
  user_id: number;
  created_at: string;
  like_count: number;
}
export type CreatePostResponseApi = ApiResponseProps<{ post: PostDetailApi }>;

// 3.2 Group list
export interface GroupPostApi {
  id: number;
  title: string;
  author: { id: number; firstName: string };
  created_at: string;
  summary: string;
  like_count: number;
  has_files: boolean;
  has_videos: boolean;
  videos: string[];
}
export interface GroupPostsDataApi {
  posts: GroupPostApi[];
  total_pages: number;
  current_page: number;
  total_posts: number;
}
export type GroupPostsResponseApi = ApiResponseProps<GroupPostsDataApi>;
export type GroupPostsPaginationApi = {
  total_pages: number;
  current_page: number;
  total_posts: number;
};

// 3.3 Detail
export type PostDetailResponseApi = ApiResponseProps<PostDetailApi>;

// 3.4 Update
export interface UpdatePostRequest extends CreatePostRequest { }
export type UpdatePostResponseApi = ApiResponseProps<{ post: PostDetailApi }>;



// 3.6 / 3.7 Like / Unlike
export type LikeCountResponseApi = ApiResponseProps<{ like_count: number }>;

// 3.8 Likes list
export interface PostLikeItemApi {
  id: number;
  user: { id: number; firstName: string };
  created_at: string;
}
export interface PostLikesDataApi {
  likes: PostLikeItemApi[];
  pagination: { total_pages: number; current_page: number; total_likes: number };
}
export type PostLikesResponseApi = ApiResponseProps<PostLikesDataApi>;

// 3.9 Files IDs
export type PostFileIdsResponseApi = ApiResponseProps<{ file_ids: number[] }>;

/* ===================== Narrow helpers（保留你原 ApiResponseProps） ===================== */
export function unwrapData<T>(res: ApiResponseProps<T>): T {
  if (!res.success || res.data == null) {
    throw new Error(res.message || `Request failed (${res.code})`);
  }
  return res.data;
}
export function isOk<T>(res: ApiResponseProps<T>): res is {
  success: true; code: number; message: string; data: T;
} {
  return !!res.success && res.data != null;
}

/* ===================== API → UI Mappers ===================== */
// 列表 → PostListUi
export const mapGroupPostApiToListUi = (
  p: GroupPostApi,
  groupId: number | string
): PostListUi => ({
  id: p.id,
  title: p.title ?? "",
  date: p.created_at ?? "",
  author: { id: p.author?.id ?? 0, firstName: p.author?.firstName ?? "" },
  like_count: p.like_count ?? 0,
  group: String(groupId ?? ""),
  description: p.summary ?? "",
  hasFiles: !!p.has_files,
  videos: Array.isArray(p.videos) ? p.videos.filter(Boolean) : [],
});


// 详情 → PostDetailUi
export const mapPostDetailApiToUi = (p: PostDetailApi): PostDetailUi => {
  const videos = (p.videos ?? []).map(v => v.url).filter(Boolean);
  const files: UiFile[] = (p.files ?? []).map(f => ({
    url: f.url,
    name: f.filename,
    size: f.file_size,
    type: f.file_type,
    uploadedAt: f.upload_time,
  }));

  return {
    id: p.id,
    title: p.title ?? "",
    date: p.created_at ?? "",
    author: { id: p.user_id ?? 0, firstName: "" },
    like_count: p.like_count ?? 0,
    group: String(p.group_id ?? ""),
    description: p.description ?? "",
    contentHtml: p.content ?? "",
    videos,
    files,
  };
};

// Create/Update 响应统一入口 → PostDetailUi
export const mapCreateOrUpdateResponseToPostProps = (
  res: CreatePostResponseApi | UpdatePostResponseApi
): PostDetailUi => {
  const { post } = unwrapData(res);
  return mapPostDetailApiToUi(post);
};

/* ===================== UI → API DTO (表单到请求体) ===================== */
export interface CreatePostFormModel {
  title: string;
  contentHtml: string;
  description: string;
  videos: string[];
  fileIds: number[];
  localFiles?: File[];
}
export type UpdatePostFormModel = CreatePostFormModel;

export const toCreateRequest = (m: CreatePostFormModel): CreatePostRequest => ({
  title: m.title,
  content: m.contentHtml,
  description: m.description,
  videos: m.videos,
  file_ids: m.fileIds,
});
export const toUpdateRequest = (m: UpdatePostFormModel): UpdatePostRequest =>
  toCreateRequest(m);

/* ===================== Permissions & small helpers ===================== */
export const canEditPost = (post: PostBaseUi, user?: UserProps | null) =>
  !!user && Number(post.author?.id) === Number(user.id);

export const hasVideos = (post: PostDetailUi | PostListUi) =>
  post.videos.length > 0;

/* ============ 可选：列表 + 详情“补水合并”到完整 UI（用于卡片点开后） ============ */
export const mergeListWithDetailToUi = (
  list: GroupPostApi,
  detail: PostDetailApi,
  groupId: number | string
): PostDetailUi =>
  mapPostDetailApiToUi({
    ...detail,
    // 以详情为准，但可用列表的 title/summary 兜底
    title: detail.title ?? list.title,
    description: detail.description ?? list.summary ?? "",
    created_at: detail.created_at ?? list.created_at,
    group_id: Number(groupId ?? detail.group_id),
  });


export const mapPostDetailApiToUiWithAuthor = (
  p: PostDetailApi,
  fallbackAuthor?: string
): PostDetailUi => {
  const ui = mapPostDetailApiToUi(p);
  if (fallbackAuthor) ui.author.firstName = fallbackAuthor;
  return ui;
};