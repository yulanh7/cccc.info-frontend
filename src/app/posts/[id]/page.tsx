import React from 'react';
import { mockPostList } from '@/app/data/mockData'

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
      <h1 className="text-2xl font-bold mb-6">{post.title}</h1>
      <div className="aspect-w-16 aspect-h-9 mb-4">
        <iframe
          src={post.videoUrl}
          title={post.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-lg"
        ></iframe>
      </div>
      <div className="text-sm text-gray-600 mb-4">
        <span>{post.date}</span> • <span>{post.author}</span> • <span>{post.group}</span>
      </div>
      <p className="text-gray-700">{post.description}</p>
    </div>
  );
}