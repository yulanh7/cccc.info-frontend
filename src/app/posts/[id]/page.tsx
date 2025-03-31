"use client";

import React, { useState } from 'react';
import { mockPostList } from '@/app/data/mockData';
import { CalendarIcon, UserCircleIcon, UserGroupIcon, EyeIcon } from '@heroicons/react/24/outline';
import CustomHeader from '@/components/CustomHeader';
import PostModal from '@/components/PostModal';

export default function PostDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsPromise);
  const initialPost = mockPostList.find((p) => p.id === Number(params.id));
  const [post, setPost] = useState(initialPost);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  if (!post) {
    return <div>Post not found</div>;
  }

  const handleDelete = (id: number) => {
    console.log(`Delete post with id: ${id}`);
    window.history.back();
  };

  const handleEdit = () => {
    setIsPostModalOpen(true);
  };

  const handleAdd = () => {
    setIsNewModalOpen(true);
  };

  const handleSave = (updatedPost: typeof post) => {
    console.log('Saved post:', updatedPost);
    setPost(updatedPost);
    setIsPostModalOpen(false);
    setIsNewModalOpen(false);
  };

  return (
    <div className="container mx-auto p-4">
      <CustomHeader
        item={post}
        showEdit={true}
        showDelete={true}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onAdd={handleAdd}
      />
      <div className="aspect-w-16 aspect-h-9 mb-4 mt-16">
        {post.videoUrl ? (
          <iframe
            src={post.videoUrl}
            title={post.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-[200px] md:h-[400px] rounded-sm"
          ></iframe>
        ) : (
          <div className="w-full min-h-30 md:min-h-60 bg-[url('/images/bg-for-homepage.png')] bg-cover bg-center rounded-t-xs md:rounded-t-sm flex items-center justify-center">
            <h2 className="text-dark-gray text-xl md:text-5xl font-'Apple Color Emoji' font-semibold text-center px-4">
              {post.title}
            </h2>
          </div>
        )}
      </div>
      <h1 className="text-2xl mb-2">{post.title}</h1>
      <div className="text-xs text-dark-green md:text-sm mb-1 flex items-center">
        <UserGroupIcon className="h-4 w-4 mr-1 text-dark-green" />{post.group}
      </div>

      <div className="text-xs text-dark-green md:text-sm mb-4 flex items-center">
        <CalendarIcon className="h-4 w-4 mr-1 text-dark-green" /> {post.date}
      </div>
      <p className="text-gray">{post.description}</p>

      {post.files && post.files.length > 0 && (
        <div className="mt-4 shadow-md p-4">
          <h3 className="text-lg font-semibold text-dark-gray mb-2">「課件」</h3>
          <ul className="space-y-2">
            {post.files.map((file, index) => (
              <li key={index} className="flex items-center space-x-4">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex text-sm items-center text-dark-green hover:text-green underline"
                >
                  <EyeIcon className="h-5 w-5 mr-2" />
                  {file.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isPostModalOpen && (
        <PostModal
          item={post}
          isNew={false}
          onSave={handleSave}
          onClose={() => setIsPostModalOpen(false)}
        />
      )}

      {isNewModalOpen && (
        <PostModal
          item={undefined}
          isNew={true}
          onSave={handleSave}
          onClose={() => setIsNewModalOpen(false)}
        />
      )}
    </div>
  );
}