import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AxiosProgressEvent, AxiosResponse } from "axios";
import api from "@/app/features/request";
import type { ApiResponseRaw } from "@/app/types/api";
import { errMsg } from '@/app/features/auth/slice'


export type FileCategory = "avatar" | "content" | "attachment";

export type UploadApiPayload = {
  file: File;
  file_category?: FileCategory;
  post_id?: number;
  description?: string;
  onProgress?: (percent: number) => void;
};

export type UploadedFile = {
  id: number;
  url: string;
  file_size: number;
  file_type: string;
  file_category: FileCategory;
  upload_time: string;
  filename: string;
};

export const uploadFile = createAsyncThunk<UploadedFile, UploadApiPayload>(
  "files/uploadFile",
  async (args, { rejectWithValue }) => {
    const { file, file_category, post_id, description, onProgress } = args;

    // —— 前端快速校验（可选，避免多余请求）
    const MAX_SIZE = 40 * 1024 * 1024; // 40MB
    if (file.size > MAX_SIZE) {
      return rejectWithValue("File exceeds 40MB limit") as any;
    }
    // 允许类型（和后端保持一致）
    const okExt = /\.(doc|docx|pdf|png|jpe?g|gif|bmp|webp)$/i.test(file.name);
    if (!okExt) {
      return rejectWithValue("Unsupported file type") as any;
    }

    try {
      const form = new FormData();
      form.append("file", file);
      if (file_category) form.append("file_category", file_category);
      if (typeof post_id === "number") form.append("post_id", String(post_id));
      if (description) form.append("description", description);

      const res: AxiosResponse<ApiResponseRaw<any>> = await api.post(
        "/upload",
        form,
        {
          headers: {
            // 覆盖实例的默认 JSON，交给浏览器自动带 boundary
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (evt: AxiosProgressEvent) => {
            if (!onProgress || !evt.total) return;
            const p = Math.round((evt.loaded * 100) / evt.total);
            onProgress(p);
          },
        }
      );

      if (!res.data?.success || !res.data?.data) {
        throw new Error(res.data?.message || "Upload failed");
      }
      const d = res.data.data;
      const normalized: UploadedFile = {
        id: d.file_id,
        filename: d.filename,
        url: d.url,
        file_size: d.file_size,
        file_type: d.file_type,
        file_category: d.file_category,
        upload_time: d.upload_time,
      };
      return normalized;
    } catch (e: any) {
      return rejectWithValue(errMsg(e, "Upload failed"));
    }
  }
);
