import Link from 'next/link';
import { PostProps } from '@/app/types/post';
import { CalendarIcon, UserCircleIcon, UserGroupIcon, ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import { PlayIcon } from '@heroicons/react/24/solid';
import { getYouTubeThumbnail } from '@/app/ultility';



export default function Post({ post }: { post: PostProps }) {
  const {
    id,
    title,
    date,
    author,
    group,
    description,
    videoUrl,
    files,
  } = post
  const truncatedDescription = description.length > 100 ? `${description.slice(0, 100)}...` : description;
  const thumbnail = videoUrl ? getYouTubeThumbnail(videoUrl, 'hqdefault') : null;

  return (
    <div className="card cursor-pointer">
      <Link href={`/posts/${id}`}>
        <div className="aspect-w-16 aspect-h-9 mb-1">
          {thumbnail ? (
            <div className="relative">
              <img
                src={thumbnail}
                alt={title}
                className="w-full h-60 md:h-80 object-cover rounded-t-xs md:rounded-t-sm"
              />
              <div className="absolute top-3 right-3 bg-[rgba(255,255,255,0.2)] rounded-full transition py-[5px] pl-[6px] pr-[3px]">
                <PlayIcon className="h-4 w-4 text-white" />
              </div>
            </div>
          ) : (
            <div
              className="w-full h-40 md:h-50 bg-[url('/images/bg-for-homepage.png')] bg-cover bg-center rounded-t-xs md:rounded-t-sm flex items-center justify-center"
            >
              <h2 className="text-dark-gray text-xl md:text-2xl font-'Apple Color Emoji' font-semibold text-center px-4">
                {title}
              </h2>
            </div>
          )}
        </div>
        <div className='p-1.5 md:p-3'>
          <h2 className="text-sm md:text-xl mb-1 md:mb-2">{title}</h2>
          <div className="text-xs text-dark-gray md:text-sm mb-1 flex items-center">
            <UserGroupIcon className="h-4 w-4 mr-1 text-dark-gray" />{group}
          </div>
          {/* <p className="hidden md:block text-gray md:mb-4">{truncatedDescription}</p> */}
          <div className="absolute left-2 top-28 md:top-1/3 transform -translate-x-1/2 -translate-y-1/2 -rotate-90 bg-yellow text-dark-gray text-xs md:text-sm flex items-center justify-center px-2 py-0">
            <CalendarIcon className="h-4 w-4 mr-1" /> {date}
          </div>
          <div className='flex justify-between items-center mt-2 md:mt-4'>
            <span className='flex items-center text-[10px] md:text-sm text-gray'>
              <UserCircleIcon className="h-4 w-4 mr-1 text-gray" /> {author}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}


