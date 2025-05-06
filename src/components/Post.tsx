import Link from 'next/link';
import { PostProps } from '@/app/types/post';
import { CalendarIcon, UserCircleIcon, UserGroupIcon, EyeIcon, ArrowRightCircleIcon } from '@heroicons/react/24/outline';



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

  return (
    <div className="card">
      <div className="aspect-w-16 aspect-h-9 mb-1.5 md:mb-4">
        {videoUrl ? (
          <iframe
            src={videoUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-40 md:h-60 rounded-t-xs md:rounded-t-sm"
          ></iframe>
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
        <Link href={`/posts/${id}`}>
          <h2 className="text-sm md:text-xl mb-1 md:mb-2 hover:underline">{title}</h2>
        </Link>
        <div className="text-xs text-dark-gray md:text-sm mb-1 flex items-center">
          <UserGroupIcon className="h-4 w-4 mr-1 text-dark-gray" />{group}
        </div>
        {/* <div className="text-xs text-dark-gray md:text-sm mb-1 flex items-center">
          <UserCircleIcon className="h-4 w-4 mr-1 text-dark-gray" /> {author}
        </div> */}
        <p className="hidden md:block text-gray md:mb-4">{truncatedDescription}</p>
        <div className="absolute left-2 top-28 md:top-1/3 transform -translate-x-1/2 -translate-y-1/2 -rotate-90 bg-yellow text-dark-gray text-xs md:text-sm flex items-center justify-center px-2 py-0">
          <CalendarIcon className="h-4 w-4 mr-1" /> {date}
        </div>
        {files && files.length > 0 && (
          <div className="md:mt-2 p-1 shadow-sm">
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li key={index} className="flex items-center space-x-4">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-xs md:text-sm text-dark-green hover:text-green underline"
                  >
                    {/* <EyeIcon className="hidden md:inline-block h-5 w-5 mr-2" /> */}
                    {file.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className='flex justify-between items-center mt-2 md:mt-4'>
          <span className='flex items-center text-[10px] md:text-sm text-gray'>
            <UserCircleIcon className="h-4 w-4 mr-1 text-gray" /> {author}
          </span>
          <Link href={`/posts/${id}`} className="text-under-line text-green text-sm hover:text-dark-green">
            <ArrowRightCircleIcon className="h-6 md:h-8 w-6 md:w-8" />
          </Link>
        </div>
      </div>
    </div>
  );
}