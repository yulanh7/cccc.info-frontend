import Post from '@/components/Post';
import { mockPostList } from '@/app/data/mockData'

export default function HomePage() {
  return (
    <div className="container mx-auto md:p-6 p-1">
      <div className="columns-2 gap-1 md:columns-2 lg:columns-3 md:gap-8">
        {mockPostList.map((post) => (
          <div className="break-inside-avoid mb-1 md:mb-8" key={post.id}>
            <Post
              key={post.id}
              id={post.id}
              title={post.title}
              date={post.date}
              author={post.author}
              group={post.group}
              description={post.description}
              videoUrl={post.videoUrl}
            />
          </div>
        ))}
      </div>
    </div>
  );
}