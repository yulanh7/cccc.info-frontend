import Link from 'next/link';
import { PostProps } from '@/app/types/post';




export default function Post({ id, title, date, author, group, description, videoUrl }: PostProps) {
  const truncatedDescription = description.length > 100 ? `${description.slice(0, 100)}...` : description;

  return (
    <Link href={`/posts/${id}`} className="block">
      <div className="bg-white p-6 rounded-lg shadow-md md:rounded-lg md:shadow-md md:p-6">
        {/* YouTube 视频 */}
        <div className="aspect-w-16 aspect-h-9 mb-4">
          <iframe
            src={videoUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full rounded-lg md:rounded-lg"
          ></iframe>
        </div>

        {/* 标题 */}
        <h2 className="text-xl font-bold mb-2">{title}</h2>

        {/* 元信息 */}
        <div className="text-sm text-gray-600 mb-4">
          <span>{date}</span> • <span>{author}</span> • <span>{group}</span>
        </div>

        {/* 描述 */}
        <p className="text-gray-700 mb-4 md:mb-4">{truncatedDescription}</p>

        {/* 按钮（仅中大屏幕显示） */}
        <div className="hidden md:block">
          <button className="w-full bg-yellow text-black py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
            View Details
          </button>
        </div>
      </div>
    </Link>
  );
}