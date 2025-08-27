"use client";

import { PostProps } from "@/app/types/post";
import {
  CalendarIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { PlayIcon } from '@heroicons/react/24/solid';
import { CheckIcon, TrashIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import IconButton from "@/components/ui/IconButton";

import { ellipsize } from '@/app/ultility';
import Link from "next/link";
import { getYouTubeThumbnail } from '@/app/ultility';

type Props = {
  post: PostProps;
  formatDate: (timestamp: string, showTime?: boolean) => string;
  showEnterArrow?: boolean;
};

export default function PostCardSimple({
  post,
  formatDate,
  showEnterArrow = true,
}: Props) {
  const { id, title, date, author, group, description, videoUrls } = post;

  const thumbnail = videoUrls && videoUrls[0] ? getYouTubeThumbnail(videoUrls[0], 'hqdefault') : null;

  return (
    <div className="card relative cursor-pointer border border-border">
      <div
        className="absolute left-2 top-[100px] md:top-1/2 -rotate-90 origin-left
             z-10 bg-yellow text-xs text-dark-gray px-2 py-0.5 rounded"
      >
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 mr-1" />
          <time>{formatDate(date)}</time>
        </div>
      </div>
      <div className="aspect-w-16 aspect-h-9 mb-1">
        {thumbnail ? (
          <div className="relative">
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-30 md:h-40 object-cover rounded-t-xs md:rounded-t-sm"
            />
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="rounded-full bg-[rgba(0,0,0,0.35)] p-2">
                <PlayIcon className="h-3 w-3  text-white" />
              </div>
            </div>
          </div>

        ) : (
          <div
            className="w-full h-20 md:h-30 bg-[url('/images/bg-for-homepage.png')] bg-cover bg-center rounded-t-xs md:rounded-t-sm flex items-center justify-center"
          >
            <h2 className="text-dark-gray  font-'Apple Color Emoji' font-semibold text-center px-4">
              {title}
            </h2>
          </div>
        )}
      </div>
      <div className='py-2 pl-4 pr-2'>
        {/* <h2 className="font-semibold text-dark-gray">{title}</h2> */}
        {/* <div className="flex items-center">
          <UserGroupIcon className="h-4 w-4 mr-1 text-dark-gray" />
          <span className="truncate">{group}</span>
        </div> */}
        {description && (
          <p className="text-gray text-sm mt-1 line-clamp-3">
            {ellipsize(description, 160, { byWords: true })}
          </p>
        )}
        <div className="mt-2 space-y-1 text-xs text-gray">


          <span className="inline-flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-dark-green/10 text-dark-green text-xs font-semibold">
              {(author.firstName?.[0] || "?").toUpperCase()}
            </span>
            <span>{author?.firstName}</span>
          </span>
        </div>
      </div>

    </div>
  );
}
