// app/ultility/recaptcha.ts
let recaptchaLoadingPromise: Promise<void> | null = null;

function isBrowser() {
  return typeof window !== 'undefined';
}

function isIpHost(host: string) {
  // 简单判断 IPv4 裸 IP（如果你有内网段或 IPv6 需求可扩展）
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

const RAW_ENABLED = (process.env.NEXT_PUBLIC_RECAPTCHA_ENABLED || '').toLowerCase() === 'true';
const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

function shouldEnableInThisContext(): boolean {
  if (!RAW_ENABLED || !SITE_KEY) return false;
  if (!isBrowser()) return false;

  const { protocol, hostname } = window.location;

  // 永远不要在本地启用
  if (hostname === 'localhost' || hostname === '127.0.0.1') return false;

  // 必须 HTTPS
  if (protocol !== 'https:') return false;

  // 裸 IP 不启用（等域名）
  if (isIpHost(hostname)) return false;

  // 正式域名 + HTTPS 才启用
  return true;
}

const ENABLED = shouldEnableInThisContext();

function waitForGrecaptchaReady(timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function poll() {
      if (window.grecaptcha && typeof window.grecaptcha.ready === 'function') {
        window.grecaptcha.ready(() => resolve());
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error('reCAPTCHA ready timeout'));
        return;
      }
      setTimeout(poll, 100);
    })();
  });
}

function loadRecaptchaScript(): Promise<void> {
  if (!ENABLED) return Promise.resolve();
  if (recaptchaLoadingPromise) return recaptchaLoadingPromise;

  recaptchaLoadingPromise = new Promise<void>((resolve, reject) => {
    if (!isBrowser()) {
      resolve();
      return;
    }
    if (document.querySelector('script[data-recaptcha="v3"]')) {
      waitForGrecaptchaReady().then(resolve).catch(reject);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-recaptcha', 'v3');

    script.addEventListener('error', () => reject(new Error('Failed to load reCAPTCHA script')));
    script.addEventListener('load', () => {
      waitForGrecaptchaReady().then(resolve).catch(reject);
    });

    document.body.appendChild(script);
  });

  return recaptchaLoadingPromise;
}

/** 获取 token（本地或 IP/HTTP 下将直接返回 null） */
export async function getRecaptchaToken(action: string): Promise<string | null> {
  if (!ENABLED || !isBrowser()) return null;

  try {
    await loadRecaptchaScript();
    if (!window.grecaptcha || typeof window.grecaptcha.execute !== 'function') return null;
    const token = await window.grecaptcha.execute(SITE_KEY, { action });
    return token || null;
  } catch {
    // 任意异常都降级为 null，不阻塞用户操作
    return null;
  }
}
