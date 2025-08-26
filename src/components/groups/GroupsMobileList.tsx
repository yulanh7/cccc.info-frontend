import React from "react";
import Link from "next/link";
import { PencilSquareIcon, TrashIcon, ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import CardSkeleton from "@/components/feedback/CardSkeleton";
import Spinner from "@/components/feedback/Spinner";
import type { GroupProps } from "@/app/types";
import Pagination from "@/components/Pagination";

type Props = {
  rows: GroupProps[];
  listLoading: boolean;

  canEdit: (g: GroupProps) => boolean;
  isUserSubscribed: (g: GroupProps) => boolean;

  onEdit: (g: GroupProps) => void;
  onDelete: (id: number) => void;
  onToggleSubscription: (g: GroupProps) => void;

  saving: boolean;
  deleting: boolean;
  toggling: boolean;

  /** 分页（移动端改为显式分页） */
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;

  formatDate: (timestamp: string, showTime?: boolean) => string;
};

export default function GroupsMobileList({
  rows,
  listLoading,
  canEdit,
  isUserSubscribed,
  onEdit,
  onDelete,
  onToggleSubscription,
  saving,
  deleting,
  toggling,
  currentPage,
  totalPages,
  buildHref,
  formatDate,
}: Props) {
  return (
    <div className="md:hidden space-y-4 mt-4">
      {listLoading && rows.length === 0 ? (
        <>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </>
      ) : (
        rows.map((group) => {
          const subbed = isUserSubscribed(group);
          return (
            <div
              className={`card p-3 ${group.inviteOnly ? "backdrop-blur-sm bg-opacity-80" : ""}`}
              key={group.id}
            >
              {/* 卡片右上角操作 */}
              <div className="absolute right-2 t-5 flex space-x-2">
                {canEdit(group) && (
                  <>
                    <button disabled={saving || deleting}>
                      <PencilSquareIcon
                        className="h-5 w-5 text-green hover:text-dark-green cursor-pointer"
                        onClick={() => onEdit(group)}
                      />
                    </button>
                    <button disabled={saving || deleting}>
                      <TrashIcon
                        className="h-5 w-5 text-green hover:text-dark-green cursor-pointer"
                        onClick={() => onDelete(group.id)}
                      />
                    </button>
                  </>
                )}
              </div>

              <h2 className="text-lg font-semibold text-dark-gray mt-5">{group.title}</h2>
              <p className="text-gray text-sm">{group.description}</p>
              <p className="text-xs text-gray mt-1">
                Created: {formatDate(group.createdDate)} by {group.creator.firstName}
                {group.inviteOnly && <span className="text-dark-green"> (Invite Only)</span>}
              </p>

              <div className="mt-2 flex justify-between items-center">
                <button
                  className={`min-w-28 px-3 py-1 rounded-md ${subbed
                    ? "bg-white text-dark-gray border border-border"
                    : "text-white bg-green hover:bg-dark-green"
                    }`}
                  disabled={saving || deleting || toggling}
                  onClick={() => onToggleSubscription(group)}
                >
                  {toggling && (
                    <span className="inline-flex items-center gap-1 mr-1">
                      <Spinner className="h-4 w-4" />
                    </span>
                  )}
                  {subbed ? "Unsubscribe" : "Subscribe"}
                </button>

                <Link
                  href={`/groups/${group.id}`}
                  className="text-dark-green hover:text-green underline text-sm"
                >
                  <ArrowRightCircleIcon className="h-7 w-7 text-green hover:text-dark-green cursor-pointer" />

                </Link>
              </div>
            </div>
          );
        })
      )}

      {!listLoading && (
        <div className="mt-6 flex justify-center">
          <Pagination currentPage={currentPage} totalPages={totalPages} buildHref={buildHref} />
        </div>
      )}
    </div>
  );
}
