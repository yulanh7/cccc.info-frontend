import type { ApiResponseProps, ApiResponseRaw } from '@/app/types/api';

export function normalizeApiResponse<T>(
  raw: ApiResponseRaw<T> | undefined,
  httpStatus: number
): ApiResponseProps<T> {
  const success = raw?.success === true;
  const code = typeof raw?.code === 'number' ? raw!.code : httpStatus;
  const message =
    typeof raw?.message === 'string' && raw!.message.trim()
      ? raw!.message
      : (success ? 'Success' : 'Error');

  if (success) {
    return {
      success: true,
      code,
      message,
      data: (raw?.data as T)
    };
  }
  return {
    success: false,
    code,
    message,
    data: null
  };
}
