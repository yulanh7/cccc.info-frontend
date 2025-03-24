"use client";

import { mockGroups } from '@/app/data/mockData';
import Link from 'next/link';
import { PencilSquareIcon, TrashIcon, ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import PageTitle from '@/components/PageTitle';

export default function GroupsPage() {
  return (
    <>
      <PageTitle title="Groups" showPageTitle={true} />
      <div className="container mx-auto p-4">

        {/* Table for medium and larger screens */}
        <div className="hidden md:block overflow-x-auto p-4">
          <table className="min-w-full bg-bg   shadow-lg">
            <thead>
              <tr className="bg-light-gray text-dark-gray">
                <th className="py-2 px-4 text-left">Title</th>
                <th className="py-2 px-4 text-left">Description</th>
                <th className="py-2 px-4 text-left">Created Date</th>
                <th className="py-2 px-4 text-left">Creator</th>
                <th className="py-2 px-4 text-left">Subscription</th>
                <th className="py-2 px-4 text-left">Actions</th>
                <th className="py-2 px-4 text-left">View</th>
              </tr>
            </thead>
            <tbody>
              {mockGroups.map((group, index) => (
                <tr
                  key={group.id}
                  className={`${index % 2 === 0 ? '' : 'bg-gray-50'}`}
                >
                  <td className="py-2 px-4 text-gray">{group.title}</td>
                  <td className="py-2 px-4 text-gray">{group.description}</td>
                  <td className="py-2 px-4 text-gray">{group.createdDate}</td>
                  <td className="py-2 px-4 text-gray">{group.creator.first_name}</td>
                  <td className="py-2 px-4">
                    <button className={`w-28 py-1 rounded-md text-white ${group.subscribed ? 'bg-yellow hover:bg-dark-yellow' : 'bg-green hover:bg-dark-green'}`} >
                      {group.subscribed ? 'Unsubscribe' : 'Subscribe'}
                    </button>
                  </td>
                  <td className="py-2 px-4 flex justify-center items-center space-x-2 min-h-[60px]">
                    {group.editable && (
                      <>
                        <PencilSquareIcon className="h-5 w-5 text-green hover:text-dark-green cursor-pointer" />
                        <TrashIcon className="h-5 w-5 text-green hover:text-dark-green cursor-pointer" />
                      </>
                    )}
                  </td>
                  <td className="py-2 px-4">
                    <Link href={`/ groups / ${group.id}`}>
                      <ArrowRightCircleIcon className="h-7 w-7 text-green hover:text-dark-green cursor-pointer" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-4">
          {mockGroups.map((group) => (
            <div
              className={`p-4 bg-white border border-border rounded-base shadow-md transition-all ${group.inviteOnly ? 'backdrop-blur-sm bg-opacity-80' : ''
                }`}
              key={group.id}
            >
              <div className="absolute right-10 t-5 flex space-x-2">
                {group.editable && (
                  <>
                    <PencilSquareIcon className="h-5 w-5 text-green hover:text-dark-green cursor-pointer" />
                    <TrashIcon className="h-5 w-5 text-green hover:text-dark-green cursor-pointer" />
                  </>
                )}
              </div>
              <h2 className="text-lg font-semibold text-dark-gray mt-5">{group.title}</h2>
              <p className="text-gray text-sm">{group.description}</p>
              <p className="text-xs text-gray mt-1">
                Created: {group.createdDate} by {group.creator.first_name}
                {group.inviteOnly && <span className="text-dark-green"> (Invite Only)</span>}
              </p>
              <div className="mt-2 flex justify-between items-center">
                <button className={`w-28 py-1 rounded-md text-white ${group.subscribed ? 'bg-yellow hover:bg-dark-yellow' : 'bg-green hover:bg-dark-green'}`} >
                  {group.subscribed ? 'Unsubscribe' : 'Subscribe'}
                </button>

                <ArrowRightCircleIcon className="h-7 w-7 text-green hover:text-dark-green cursor-pointer" />

              </div>
            </div>
          ))}
        </div>
      </div >
    </>

  );
}