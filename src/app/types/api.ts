export type ApiResponseProps<T = any> =
  | { success: true; code: number; message: string; data: T }
  | { success: false; code: number; message: string; data: null };
