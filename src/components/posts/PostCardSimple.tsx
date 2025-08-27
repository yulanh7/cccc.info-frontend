"use client";

import { PostProps } from "@/app/types/post";
import {
  CalendarIcon,
  UserCircleIcon,
  UserGroupIcon,
  ArrowRightCircleIcon,
} from "@heroicons/react/24/outline";
import { ellipsize } from '@/app/ultility';
import Link from "next/link";

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
  const { id, title, date, author, group, description } = post;

  return (
    <div className="card px-3 pt-6 pb-3">
      <h2 className="text-lg font-semibold text-dark-gray">{title}</h2>

      {description && (
        <p className="text-gray text-sm mt-1 line-clamp-3">
          {ellipsize(description, 80, { byWords: true })}
        </p>
      )}

      <div className="mt-2 space-y-1 text-xs text-gray">
        <div className="flex items-center">
          <UserGroupIcon className="h-4 w-4 mr-1 text-dark-gray" />
          <span className="truncate">{group}</span>
        </div>
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 mr-1 text-dark-gray" />
          <time>{formatDate(date)}</time>
        </div>
        <div className="flex items-center">
          <UserCircleIcon className="h-4 w-4 mr-1 text-dark-gray" />
          <span className="truncate">{author}</span>
        </div>
      </div>


    </div>
  );
}
