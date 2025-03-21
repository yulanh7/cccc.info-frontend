import Link from 'next/link';
import { PostProps } from '@/app/types/post';
import { CalendarIcon, UserCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';



export default function Post({ id, title, date, author, group, description, videoUrl }: PostProps) {
  const truncatedDescription = description.length > 100 ? `${description.slice(0, 100)}...` : description;

  return (
    <div className="bg-white shadow-md md:shadow-md relative rounded-xs md:rounded-sm">
      <div className="aspect-w-16 aspect-h-9 mb-1.5 md:mb-4">
        <iframe
          src={videoUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-[160px] md:h-[200px] rounded-t-xs md:rounded-t-sm"
        ></iframe>
      </div>
      <div className='p-1.5 md:p-3'>
        <h2 className="text-sm md:text-xl mb-1 md:mb-2">{title}</h2>
        <div className="text-xs text-dark-gray md:text-sm mb-1 flex items-center">
          <UserGroupIcon className="h-4 w-4 mr-1 text-dark-gray" />{group}
        </div>
        <div className="text-xs text-dark-gray md:text-sm mb-1 flex items-center">
          <UserCircleIcon className="h-4 w-4 mr-1 text-dark-gray" /> {author}
        </div>
        <div className="text-xs text-gray md:text-sm text-gray-600 md:mb-2 flex items-center">
        </div>
        <p className="hidden md:block text-gray md:mb-4 md:mb-4">{truncatedDescription}</p>
        <Link href={`/posts/${id}`} className="block">
          <h3 className="text-xs md:text-base text-dark-green underline hover:text-dark-gray transition-colors">
            Read More
          </h3>
        </Link>
        <div className="absolute left-2.5 top-1/3 transform -translate-x-1/2 -translate-y-1/2 -rotate-90 bg-yellow text-dark-gray text-xs md:text-sm flex items-center justify-center px-2 py-0">
          <CalendarIcon className="h-4 w-4 mr-1" /> {date}
        </div>
      </div>
    </div>
  );
}