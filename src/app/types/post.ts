import type { ApiResponseProps } from "./api";
import type { UserProps } from "./user";

/** ===================== UI Post ===================== */
export interface PostProps {
  id: number;
  title: string;
  date: string; // ISO
  author: { id: number; firstName: string };
  group: string;
  description: string;
  videoUrls: string[];               // unified: list & detail both map to this
  files?: { url: string; name: string }[];
  hasVideo?: boolean;
}

/** Optional payloads used elsewhere */
export interface CreatePostCredentials { title: string; content: string; }
export interface EditPostCredentials { title: string; content: string; }

/** ===================== Group Posts LIST API ===================== */
/** /api/groups/:id/posts returns posts with simple video urls */
export interface GroupPostApi {
  id: number;
  title: string;
  author: { id: number; firstName: string };
  created_at: string;
  summary: string;
  like_count: number;
  has_files: boolean;
  has_videos: boolean;
  videos?: string[]; // e.g. ["https://youtube.com/watch?v=xxx"]
}

export interface GroupPostsData {
  posts: GroupPostApi[];
  total_pages: number;
  current_page: number;
  total_posts: number;
}
export type GroupPostsResponseApi = ApiResponseProps<GroupPostsData>;

/** Optional compact list item (keep if you use it in cards/tables) */
export interface PostListItem {
  id: number;
  title: string;
  authorName: string;
  createdAt: string;
  summary: string;
  likeCount: number;
  hasFiles: boolean;
  hasVideos: boolean;
}
export const mapPostApiToListItem = (p: GroupPostApi): PostListItem => ({
  id: p.id,
  title: p.title,
  authorName: p.author?.firstName ?? "",
  createdAt: p.created_at,
  summary: p.summary,
  likeCount: p.like_count,
  hasFiles: p.has_files,
  hasVideos: p.videos ? p.videos.length > 0 : p.has_videos,
});

/** Map LIST API → UI PostProps (used on group pages) */
export const mapGroupPostApiToPostProps = (p: GroupPostApi): PostProps => ({
  id: p.id,
  title: p.title,
  date: p.created_at,
  author: { id: p.author?.id ?? 0, firstName: p.author?.firstName ?? "" },
  group: "", // fill if you have group id/name in the page context
  description: p.summary,
  videoUrls: p.videos ?? [],
  files: [],
  hasVideo: (p.videos?.length ?? 0) > 0 || p.has_videos === true,
});

/** ===================== Post DETAIL API ===================== */
/** /api/posts/:post_id returns rich objects for videos/files */
export interface PostDetailApi {
  id: number;
  title: string;
  content: string; // HTML
  description: string;
  videos: Array<{ id: number; url: string }>;
  files: Array<{
    id: number;
    filename: string;
    url: string;
    file_size: number;
    file_type: string;
    upload_time: string;
  }>;
  group_id: number;
  user_id: number;
  created_at: string;
  like_count: number;
}
export type PostDetailResponseApi = ApiResponseProps<PostDetailApi>;

/** Map DETAIL API → UI PostProps */
export const mapPostDetailApiToProps = (p: PostDetailApi): PostProps => ({
  id: p.id,
  title: p.title,
  date: p.created_at,
  author: { id: p.user_id, firstName: "" }, // fill name if you also fetch it
  group: String(p.group_id),
  description: p.description ?? "",
  videoUrls: (p.videos ?? []).map(v => v.url).filter(Boolean),
  files: (p.files ?? []).map(f => ({ url: f.url, name: f.filename })),
  hasVideo: (p.videos?.length ?? 0) > 0,
});

/** ===================== Permissions ===================== */
export const canEditPost = (post: PostProps, user?: UserProps | null) => {
  return !!user && Number(post.author?.id) === Number(user.id);
}
