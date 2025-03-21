import React from 'react';
import { mockPostList } from '@/app/data/mockData'
import { CalendarIcon, UserCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface Post {
  id: number;
  title: string;
  date: string;
  author: string;
  group: string;
  description: string;
  videoUrl: string;
}



export default function PostDetailPage({ params }: { params: { id: string } }) {
  const post = mockPostList.find((p) => p.id === Number(params.id));

  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="aspect-w-16 aspect-h-9 mb-4">
        <iframe
          src={post.videoUrl}
          title={post.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-[200px] md:h-[400px] rounded-lg"
        ></iframe>
      </div>
      <h1 className="text-2xl mb-2">{post.title}</h1>
      <div className="text-xs text-dark-green md:text-sm mb-1 flex items-center">
        <UserGroupIcon className="h-4 w-4 mr-1 text-dark-green" />{post.group}
      </div>
      <div className="text-xs text-dark-green md:text-sm mb-1 flex items-center">
        <UserCircleIcon className="h-4 w-4 mr-1 text-dark-green" /> {post.author}
      </div>
      <div className="text-xs text-dark-green md:text-sm mb-4 flex items-center">
        <CalendarIcon className="h-4 w-4 mr-1 text-dark-green" /> {post.date}
      </div>
      <p className="text-gray">{post.description}</p>
    </div>
  );
}