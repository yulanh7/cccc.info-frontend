"use client";

import { useEffect, useState } from 'react';

export default function PageTitle({ title, showPageTitle }: { title?: string; showPageTitle?: boolean }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !showPageTitle || !title) return null;

  return (
    <div className='hidden md:flex justify-center items-center relative pd-20 mb-10'>

      <div className="flex justify-center items-center w-full bg-page-title-bg h-50 text-white text-4xl font-semibold px-6 relative overflow-hidden">
        {title}

      </div>
      <div className="absolute z-10 -bottom-1.5 left-1/2 transform -translate-x-1/2 w-6 h-6">
        <span className="absolute  top-0 left-1/2 w-1 h-10 bg-white transform -translate-x-1/2" />
        <span className="absolute top-1/2 left-0 w-6 h-1 bg-white transform -translate-y-1/2" />
      </div>
      <div className="waterdrop-shape" />
    </div>
  );
}