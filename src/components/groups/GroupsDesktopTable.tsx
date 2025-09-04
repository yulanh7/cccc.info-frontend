import React from "react";
import Link from "next/link";
import { PencilSquareIcon, TrashIcon, ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import Pagination from "@/components/ui/Pagination";
import TableSkeleton from "@/components/feedback/TableSkeleton";
import type { GroupApi } from "@/app/types";
import { ellipsize } from '@/app/ultility';

type Props = {
  rows: GroupApi[];
  listLoading: boolean;
  canEdit: (g: GroupApi) => boolean;
  isUserSubscribed: (g: GroupApi) => boolean;
  onEdit: (g: GroupApi) => void;
  onDelete: (id: number) => void;
  onToggleSubscription: (g: GroupApi) => void;
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
  saving: boolean;
  deleting: boolean;
  toggling: boolean;
  formatDate: (timestamp: string, showTime?: boolean) => string;
};


export default function GroupsDesktopTable({
  rows,
  listLoading,
  canEdit,
  isUserSubscribed,
  toggling,
  onToggleSubscription,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  buildHref,
  saving,
  deleting,
  formatDate,
}: Props) {
  return (
    <div className="hidden overflow-x-auto p-4">
      <table className="min-w-full bg-bg shadow-lg">
        <thead>
          <tr className="bg-light-gray text-dark-gray">
            <th className="py-2 px-4 text-left">Title</th>
            <th className="py-2 px-4 text-left">Description</th>
            <th className="py-2 px-4 text-left">Created Date</th>
            <th className="py-2 px-4 text-left">Creator</th>
            <th className="py-2 px-4 text-left">Membership</th>
            <th className="py-2 px-4 text-left">View</th>
            <th className="py-2 px-4 text-left">Manage</th>
          </tr>
        </thead>

        {listLoading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : (
          <tbody>
            {rows.map((group, index) => {
              const subbed = isUserSubscribed(group);
              return (
                <tr key={group.id} className={`${index % 2 === 0 ? '' : 'bg-gray-50'}`}>
                  <td className="py-2 px-4 text-gray">{group.name}</td>
                  <td
                    className="py-2 px-4 text-gray"
                    title={group.description}
                  >
                    {ellipsize(group.description, 80, { byWords: true })}
                  </td>
                  <td className="py-2 px-4 text-gray">{formatDate(group.time)}</td>
                  <td className="py-2 px-4 text-gray">{group.creator_name}</td>
                  <td className="py-2 px-4">
                    <button
                      className={`w-28 py-1 rounded-md text-white ${subbed ? 'bg-yellow hover:bg-dark-yellow' : 'bg-green hover:bg-dark-green'}`}
                      disabled={saving || deleting || toggling}
                      onClick={() => onToggleSubscription(group)}
                    >
                      {subbed ? 'Unsubscribe' : 'Subscribe'}
                    </button>
                  </td>
                  <td className="py-2 px-4">
                    <Link href={`/groups/${group.id}`}>
                      <ArrowRightCircleIcon className="h-7 w-7 text-green hover:text-dark-green cursor-pointer" />
                    </Link>
                  </td>
                  <td className="py-2 px-4">
                    {canEdit(group) && (
                      <div className="flex items-center gap-2">
                        <button disabled={saving || deleting}>
                          <PencilSquareIcon className="h-5 w-5 text-green hover:text-dark-green cursor-pointer" onClick={() => onEdit(group)} />
                        </button>
                        <button disabled={saving || deleting}>
                          <TrashIcon className="h-5 w-5 text-green hover:text-dark-green cursor-pointer" onClick={() => onDelete(group.id)} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        )}
      </table>

      {!listLoading && (
        <div className="mt-6 flex justify-center">
          <Pagination currentPage={currentPage} totalPages={totalPages} buildHref={buildHref} />
        </div>
      )}
    </div>
  );
}
