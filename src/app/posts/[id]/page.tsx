// app/posts/[id]/page.tsx
import React from 'react';

interface Post {
  id: number;
  title: string;
  date: string;
  author: string;
  group: string;
  description: string;
  videoUrl: string;
}

const mockPosts: Post[] = [
  {
    id: 1,
    title: 'How to Build a Next.js App',
    date: '2023-10-01',
    author: 'John Doe',
    group: 'Next.js Developers',
    description: 'In this video, we will learn how to build a Next.js app from scratch. We will cover everything from setting up the project to deploying it.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // YouTube 嵌入链接
  },
  {
    id: 2,
    title: 'Tailwind CSS Tutorial',
    date: '2023-09-25',
    author: 'Jane Smith',
    group: 'Frontend Designers',
    description: 'Learn how to use Tailwind CSS to create beautiful and responsive designs with minimal effort.',
    videoUrl: 'https://www.youtube.com/embed/UBOj6rqRUME',
  },
  {
    id: 3,
    title: 'React Hooks Explained',
    date: '2023-09-15',
    author: 'Alice Johnson',
    group: 'React Enthusiasts',
    description: 'A deep dive into React Hooks, including useState, useEffect, and custom hooks.',
    videoUrl: 'https://www.youtube.com/embed/dpw9EHDh2bM',
  },
];

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const post = mockPosts.find((p) => p.id === Number(params.id));

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