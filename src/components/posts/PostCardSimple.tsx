"use client";
import React, { useMemo } from "react";
import type { PostListItemApi } from "@/app/types";
import {
  CalendarIcon,
  UserGroupIcon,
  HandThumbUpIcon
} from "@heroicons/react/24/outline";
import { PlayIcon } from '@heroicons/react/24/solid';
import { ellipsize } from '@/app/ultility';
import { getYouTubeThumbnail } from '@/app/ultility';

type Props = {
  post: PostListItemApi;
  formatDate: (timestamp: string, showTime?: boolean) => string;
  showEnterArrow?: boolean;
};

const BG_URLS = [
  "/images/bg-card-2.jpg",
  // "/images/bg-card-3.jpg",
  // "/images/bg-card-4.jpg",
  // "/images/bg-card-5.jpg",
  "/images/bg-for-homepage.png",
];

export default function PostCardSimple({
  post,
  formatDate,
  showEnterArrow = true,
}: Props) {
  const { id, title, created_at, author, group, summary, videos, like_count } = post;
  const bgUrl = useMemo(
    () => BG_URLS[Math.abs(post.id) % BG_URLS.length],
    [post.id]
  );
  const thumbnail = videos && videos[0] ? getYouTubeThumbnail(videos[0], 'hqdefault') : null;

  return (
    <div className="card relative cursor-pointer border border-border">
      {/* <div
        className="absolute left-2 top-[100px]  -rotate-90 origin-left
             z-10 bg-yellow text-xs text-dark-gray px-2 py-0.5 rounded"
      >
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 mr-1" />
          <time>{formatDate(date)}</time>
        </div>
      </div> */}
      <div className="aspect-w-16 aspect-h-9 mb-1">
        {thumbnail ? (
          <div className="relative">
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-25 md:h-30 object-cover rounded-t-xs md:rounded-t-sm"
            />
            <div className="absolute top-2 right-2 pointer-events-none">
              <div className="rounded-full bg-[rgba(0,0,0,0.35)] p-2">
                <PlayIcon className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>

        ) : (
          <div
            className="
              w-full pt-7 pb-4 px-3 min-h-20 
               bg-cover bg-center rounded-t-xs md:rounded-t-sm 
              items-center justify-center
            "
            style={{ backgroundImage: `url(${bgUrl})` }}

          >
            <h2 className="text-dark-gray  font-'Apple Color Emoji' font-semibold text-center px-4">
              {title}
            </h2>
          </div>
        )}
      </div>
      <div className='px-2 pb-2'>
        <h2 className="font-semibold text-dark-gray leading-[1.3] md:leading-[1.3] mb-2">
          {ellipsize(title, 50, { byWords: true })}
        </h2>
        {/* <div className="flex items-center">
          <UserGroupIcon className="h-4 w-4 mr-1 text-dark-gray" />
          <span className="truncate">{group}</span>
        </div> */}
        {summary && (
          <p className="text-gray text-sm line-clamp-3 leading-[1.1] md:leading-[1.2] whitespace-pre-line">
            {ellipsize(summary, 160, { byWords: true })}
          </p>
        )}
        <div className="mt-2 space-y-1 text-xs text-gray">
          <span className="inline-flex items-center gap-1 text-xs">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-dark-green/10 text-dark-green  font-semibold">
              {(author.firstName?.[0] || "?").toUpperCase()}
            </span>
            <span className="text-[9px]">
              {ellipsize(author.firstName, 10, { byWords: true })}
            </span>
          </span>
          <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
            <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-2 py-1 shadow">
              <HandThumbUpIcon className="h-4 w-4 text-dark-gray" />
              <span className="text-xs text-dark-gray">{like_count}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
