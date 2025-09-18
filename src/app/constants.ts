export const POSTS_PER_PAGE = 30;
export const GROUPS_PER_PAGE = 30;
export const COMMENTS_PER_PAGE = 30;
export const MEMBERS_PER_PAGE = 20;
export const MIN_USER_NAME_LEN = 2;
export const MAX_USER_NAME_LEN = 20;
export const MAX_COMMENT_LEN = 1000;
export const FIRST_NAME_RULE = /^[a-zA-Z0-9_\u4e00-\u9fa5]{2,20}$/;
export const FIRST_NAME_ERR =
  'First name is required (2-20 characters), letters/numbers/underscore/Chinese only, and must not contain spaces';

// 常量（图片/文档限制）
export const TARGET_IMAGE_BYTES = 300 * 1024; // 单图目标上限
export const MAX_INPUT_IMAGE_BYTES = 25 * 1024 * 1024; // 极端大图拦截
export const MAX_LONG_EDGE = 1920; // 最长边
export const MAX_DOC_MB = 10;
export const MAX_DOC_FILE_SIZE = MAX_DOC_MB * 1024 * 1024;

