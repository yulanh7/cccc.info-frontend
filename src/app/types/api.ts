export type ApiResponseProps<T = unknown> =
  | { success: true; code: number; message: string; data: T }
  | { success: false; code: number; message: string; data: null };

export type ApiResponseRaw<T = unknown> = Partial<{
  success: boolean;
  code: number;
  message: string;
  data: T | null;
}>;


export type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

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