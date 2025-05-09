"use client";

import React, { useState } from 'react';
import Post from '@/components/Post';
import { mockPostList } from '@/app/data/mockData'
import PageTitle from '@/components/PageTitle';
import PostModal from '@/components/PostModal';
import { PlusIcon } from '@heroicons/react/24/outline';
import { PostProps } from '@/app/types';

export default function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { id } = React.use(params);

  const handleSave = (item: PostProps) => {
    console.log('Saved post:', { ...item, group: id });
    setIsModalOpen(false);
  };
  const handleAdd = () => {

    setIsModalOpen(true);
  };

  return (
    <>
      <PageTitle title="Single Group" showPageTitle={true} />

      <button
        onClick={handleAdd}
        className="fixed md:hidden bottom-23  z-20 left-1/2 -translate-x-1/2 bg-yellow px-3 py-3 rounded-[50%]"          >
        <PlusIcon className="h-7 w-7 text-white" />
      </button>

      <div className="container mx-auto md:p-6 p-4 md:mt-16">
        <div className='hidden md:flex justify-end'>
          <button
            onClick={handleAdd}
            className="mb-4 flex items-center px-4 py-2 bg-dark-green text-white rounded-sm hover:bg-green"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New
          </button>
        </div>
        <div className="columns-2 gap-1 md:columns-2 lg:columns-3 md:gap-8">
          {mockPostList.map((post) => (
            <div className="break-inside-avoid mb-2 md:mb-8" key={post.id}>
              <Post post={post} />
            </div>
          ))}
        </div>
      </div>
      {isModalOpen &&
        <PostModal
          item={undefined}
          isNew={true}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      }

    </>
  );
}