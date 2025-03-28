"use client";

import { useState } from 'react';
import Image from 'next/image';
import LoginForm from '@/components/LoginForm';
import SignUpForm from '@/components/SignUpForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center -mb-30 -mt-16 md:-mt-30">
      <div className="p-6 rounded-sm shadow-lg ">
        <div className='flex flex-col items-center justify-center mb-6'>
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={0}
            height={30}
            className="h-[40px] w-auto md:h-[50px] lg:h-[60px] "
            sizes="(max-width: 767px) 40px, (max-width: 1023px) 80px, 120px"
            priority
          />
          <h1 className='text-lg md:text-xl  font-semibold'>Canberra Chinese Christian Chur Info</h1>
        </div>
        {isLogin ? <LoginForm /> : <SignUpForm />}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-4 text-dark-green hover:underline px-4"
        >
          {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
}