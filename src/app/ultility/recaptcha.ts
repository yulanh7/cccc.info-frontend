let recaptchaLoadingPromise: Promise<void> | null = null;

const ENABLED =
  (process.env.NEXT_PUBLIC_RECAPTCHA_ENABLED || '').toLowerCase() === 'true';
const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

function loadRecaptchaScript(): Promise<void> {
  if (!ENABLED || !SITE_KEY) return Promise.resolve();

  if (recaptchaLoadingPromise) return recaptchaLoadingPromise;

  recaptchaLoadingPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }
    // 若已存在脚本，直接 resolve
    if (document.querySelector('script[data-recaptcha="v3"]')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-recaptcha', 'v3');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA script'));
    document.body.appendChild(script);
  });

  return recaptchaLoadingPromise;
}

/**
 * 获取 reCAPTCHA token（仅在启用时会真正执行；否则返回 null）
 */
export async function getRecaptchaToken(action: string): Promise<string | null> {
  if (!ENABLED || !SITE_KEY || typeof window === 'undefined') return null;

  await loadRecaptchaScript();

  return new Promise<string>((resolve, reject) => {
    try {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(SITE_KEY, { action })
          .then((token) => resolve(token))
          .catch((err) => reject(err));
      });
    } catch (e) {
      reject(e);
    }
  });
}
