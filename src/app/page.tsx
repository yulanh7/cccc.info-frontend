import { mockPostList } from '@/app/data/mockData'
import PageTitle from '@/components/layout/PageTitle';

export default function HomePage() {
  return (
    <>
      <PageTitle title="Home" showPageTitle={true} />
      <div className="container mx-auto md:p-6 p-4 md:mt-20">
        <div className="columns-2 gap-1 md:columns-2 lg:columns-3 md:gap-8">
          test
        </div>
      </div>
    </>
  );
}