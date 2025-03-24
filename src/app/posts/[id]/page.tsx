import React from 'react';
import { mockPostList } from '@/app/data/mockData'
import { CalendarIcon, UserCircleIcon, UserGroupIcon, EyeIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';


export default function PostDetailPage({ params }: { params: { id: string } }) {
  const post = mockPostList.find((p) => p.id === Number(params.id));

  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <div className="container mx-auto p-4 shadow-md">
      <div className="aspect-w-16 aspect-h-9 mb-4">
        <iframe
          src={post.videoUrl}
          title={post.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full max-w-[600px] h-[200px] md:h-[400px] rounded-sm"
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

      {post.files && post.files.length > 0 && (
        <div className="mt-4">
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
    </div>
  );
}