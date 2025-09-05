import { ApiResponseProps } from '@/app/types'

export type FileMetaData = {
  file_id: number;
  filename: string;
  file_path: string;
  url: string;
  file_size: number;
  file_type: string;
  file_category: 'avatar' | 'content' | 'attachment';
  upload_time: string;
};

/** POST /api/upload (multipart/form-data) - 表单字段 */
export type UploadFileForm = {
  file: File;
  file_category?: 'avatar' | 'content' | 'attachment';
  post_id?: number;
  description?: string;
};

export type UploadFileData = FileMetaData;
export type UploadFileResponse = ApiResponseProps<UploadFileData>;

/** DELETE /api/files/{file_id} */
export type DeleteFileData = Record<string, never>;
export type DeleteFileResponse = ApiResponseProps<DeleteFileData>;

/** GET /api/files/{file_id} */
export type GetFileInfoData = FileMetaData;
export type GetFileInfoResponse = ApiResponseProps<GetFileInfoData>;

/** GET /api/files/{file_id}/download/shared
 *  返回文件流，不走 JSON；不定义响应类型包装。
 */

/** GET /api/files/{file_id}/download-url */
export type GetDownloadUrlData = {
  file_id: number;
  filename: string;
  file_size: number;
  file_type: string;
  download_url: string; // e.g. "/api/files/1/download/shared"
};
export type GetDownloadUrlResponse = ApiResponseProps<GetDownloadUrlData>;

/** POST /api/admin/cleanup-files */
export type AdminCleanupFilesData = Record<string, never>;
export type AdminCleanupFilesResponse = ApiResponseProps<AdminCleanupFilesData>;
