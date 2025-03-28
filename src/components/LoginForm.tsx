"use client";

import { useState, useEffect } from 'react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=6LeVQAIrAAAAAG_UnrI3up7fDN2muaqOtmfIhYv0';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.grecaptcha.ready(() => {
        window.grecaptcha.execute('6LeVQAIrAAAAAG_UnrI3up7fDN2muaqOtmfIhYv0', { action: 'login' })
          .then((token: string) => setRecaptchaToken(token));
      });
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recaptchaToken) {
      alert('reCAPTCHA 未加载');
      return;
    }

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, recaptchaToken }),
    });

    const data = await response.json();
    if (data.success) {
      alert('登录成功');
    } else {
      alert('登录失败: ' + data.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 space-y-4">
      {/* <h2 className="text-xl text-dark-gray">Login</h2> */}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full p-2 border border-border rounded-sm"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full p-2 border border-border rounded-sm"
        required
      />
      <button
        type="submit"
        className="w-full p-2 bg-dark-green text-white rounded-sm hover:bg-green"
      >
        Login
      </button>
    </form>
  );
}