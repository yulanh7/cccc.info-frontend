export type ApiResponseProps<T = any> =
  | { success: true; code: number; message: string; data: T }
  | { success: false; code: number; message: string; data: null };

export type ApiResponseRaw<T = any> = Partial<{
  success: boolean;
  code: number;
  message: string;
  data: T | null;
}>;


export type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';
