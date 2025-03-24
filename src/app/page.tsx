import Post from '@/components/Post';
import { mockPostList } from '@/app/data/mockData'
import PageTitle from '@/components/PageTitle';

export default function HomePage() {
  return (
    <>
      <PageTitle title="Home" showPageTitle={true} />
      <div className="container mx-auto md:p-6 p-4 md:mt-20">
        <div className="columns-2 gap-1 md:columns-2 lg:columns-3 md:gap-8">
          {mockPostList.map((post) => (
            <div className="break-inside-avoid mb-1 md:mb-8" key={post.id}>
              <Post post={post} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}