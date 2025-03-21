import Post from '@/components/Post';
import { mockPostList } from '@/app/data/mockData'


export default function HomePage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 mt-6 flex justify-center align-middle">Home</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockPostList.map((post) => (
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
        ))}
      </div>
    </div>
  );
}