// app/types/comments.ts

import type { ApiResponseProps } from "@/app/types";

/* ======================================================
 *                      Types
 * ====================================================== */

export type CommentsPagination = {
  current_page: number;
  total_pages: number;
  total_comments: number;
};

export type CommentUser = {
  id: number;
  firstName: string;
};

export type CommentItemApi = {
  id: number;
  body: string;
  user: CommentUser;
  post_id: number;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  edit_count: number;
  like_count: number;
  children_count: number;
};

/** 列表（根/子） */
export type CommentListData = {
  comments: CommentItemApi[];
  pagination: CommentsPagination;
};
export type CommentListResponse = ApiResponseProps<CommentListData>;

/** 详情 */
export type CommentDetailData = CommentItemApi;
// 若后端返回 data: { comment: CommentItemApi }，则改成：ApiResponseProps<{ comment: CommentItemApi }>
export type CommentDetailResponse = ApiResponseProps<CommentDetailData>;

/** 创建/回复 */
export type CreateCommentRequest = {
  body: string;
  parent_id?: number | null;
};
export type CreateCommentData = { comment: CommentItemApi };
export type CreateCommentResponse = ApiResponseProps<CreateCommentData>;

/** 更新 */
export type UpdateCommentRequest = { body: string };
export type UpdateCommentData = { comment: CommentItemApi };
export type UpdateCommentResponse = ApiResponseProps<UpdateCommentData>;

/** 删除 */
export type DeleteCommentData = {};
export type DeleteCommentResponse = ApiResponseProps<DeleteCommentData>;
