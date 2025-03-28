"use client";

import { useState } from 'react';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('密码不匹配');
      return;
    }

    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, firstName, password }),
    });

    const data = await response.json();
    if (data.success) {
      alert('注册成功');
    } else {
      alert('注册失败: ' + data.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 space-y-4">
      {/* <h2 className="text-xl  text-dark-gray">Sign Up</h2> */}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full p-2 border border-border rounded-sm"
        required
      />
      <input
        type="text"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="First Name"
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
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm Password"
        className="w-full p-2 border border-border rounded-sm"
        required
      />
      <button
        type="submit"
        className="w-full p-2 bg-dark-green text-white rounded-sm hover:bg-green"
      >
        Sign Up
      </button>
    </form>
  );
}