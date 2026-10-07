/** 登录 / 注册后要回去的页面：只接受本站路径，防止被带去别的网站 */
export function safeNextPath(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback;
  let path = raw;
  try {
    path = decodeURIComponent(raw);
  } catch {
    return fallback;
  }
  // 必须以单个 / 开头；// 和 /\ 会被浏览器当成别的网站
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return fallback;
  if (path === '/auth' || path.startsWith('/auth?') || path.startsWith('/auth/')) return fallback;
  return path;
}
