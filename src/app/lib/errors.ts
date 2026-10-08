/**
 * catch 到的错误是 unknown：apiRequest 抛出 { code, message, errorCode }，
 * thunk 的 rejectWithValue 常常是一句字符串，也可能是原生 Error。
 */

/** 错误里给用户看的那句话；拿不到就用 fallback */
export function errorMessage(e: unknown, fallback: string): string {
  if (typeof e === 'string') return e || fallback;
  if (e && typeof e === 'object' && 'message' in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === 'string' && m) return m;
  }
  return fallback;
}

/** HTTP 状态码（apiRequest 抛出的错误里的 code），没有就是 undefined */
export function errorCode(e: unknown): number | undefined {
  if (e && typeof e === 'object' && 'code' in e) {
    const c = (e as { code?: unknown }).code;
    if (typeof c === 'number') return c;
  }
  return undefined;
}
