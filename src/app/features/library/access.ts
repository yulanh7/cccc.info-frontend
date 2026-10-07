/**
 * 图书馆访问码（普通用户每次都要通过链接 / 二维码进入）
 * - 存在 sessionStorage：关掉标签页就清空，下次要再扫码，这正是规则要求；不要存 localStorage
 * - 图书馆接口带请求头 X-Library-Access；图书管理员不需要，但带了也没关系
 */

export const LIBRARY_ACCESS_KEY = 'libraryAccessCode';
export const LIBRARY_ACCESS_HEADER = 'X-Library-Access';
export const LIBRARY_ACCESS_REQUIRED_TEXT = 'Please open the library through its link or QR code';

export const getLibraryAccessCode = (): string | null => {
  try {
    return sessionStorage.getItem(LIBRARY_ACCESS_KEY);
  } catch {
    return null;
  }
};

export const setLibraryAccessCode = (code: string) => {
  try {
    sessionStorage.setItem(LIBRARY_ACCESS_KEY, code);
  } catch {
    /* 隐私模式等：存不了就算了，接口会返回 LIBRARY_ACCESS_REQUIRED */
  }
};

export const clearLibraryAccessCode = () => {
  try {
    sessionStorage.removeItem(LIBRARY_ACCESS_KEY);
  } catch {
    /* 忽略 */
  }
};

/** 需要带访问码的图书馆接口；验证访问码本身的接口不用 */
export const needsLibraryAccessHeader = (url: string): boolean => {
  const path = url.replace(/^\/+/, '');
  return path.startsWith('library/') && !path.startsWith('library/access/');
};

/** 分享 / 二维码用的完整网址 */
export const libraryAccessUrl = (code: string, origin: string): string =>
  `${origin}/library/access/${encodeURIComponent(code)}`;
