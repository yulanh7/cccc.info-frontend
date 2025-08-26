"use client";

import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
  CalendarIcon,
  UserPlusIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import IconBtn from "@/components/ui/IconBtn";
import type { GroupProps } from "@/app/types/group";

type Props = {
  group: GroupProps;
  subscriberCount: number;
  onShowMembers: () => void;
  onNewPost: () => void;
  onEditGroup: () => void;
  onDeleteGroup: () => void;
  formatDate: (timestamp: string, showTime?: boolean) => string;

  /** 选择模式控制（外部受控） */
  selectMode: boolean;
  selectedCount: number;
  onToggleSelectMode: () => void;
  onBulkDeleteSelected: () => void;
};

export default function GroupInfoBar({
  group,
  subscriberCount,
  onShowMembers,
  onNewPost,
  onEditGroup,
  onDeleteGroup,
  formatDate,
  selectMode,
  selectedCount,
  onToggleSelectMode,
  onBulkDeleteSelected,
}: Props) {
  return (
    <>
      <section className="mb-4 md:mb-6 rounded-xl border border-border bg-bg p-4 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            {group.description && (
              <p className="mt-1 text-sm text-dark-gray">{group.description}</p>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {group.editable && (
              <>
                <IconBtn title="Edit group" onClick={onEditGroup}>
                  <PencilIcon className="h-5 w-5" />
                </IconBtn>
                <IconBtn title="Delete group" intent="danger" onClick={onDeleteGroup}>
                  <TrashIcon className="h-5 w-5" />
                </IconBtn>
              </>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-dark-gray">
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-dark-green/10 text-dark-green text-xs font-semibold">
              {(group.creator?.firstName?.[0] || "?").toUpperCase()}
            </span>
          </span>

          <span className="inline-flex items-center gap-1.5">
            <CalendarIcon className="h-5 w-5" />
            <time dateTime={group.createdDate} className="font-medium">
              {group.createdDate ? formatDate(group.createdDate) : "—"}
            </time>
          </span>

          <button
            onClick={onShowMembers}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border hover:bg-white/5"
            aria-label="View members"
            title="View members"
          >
            <UserPlusIcon className="h-4 w-4" />
            <span className="text-[11px] uppercase tracking-wide text-dark-gray/70">
              Members
            </span>
            <span className="font-semibold">{subscriberCount}</span>
          </button>
        </div>
      </section>
      <section className="flex justify-end gap-3">
        <div>
          <button
            onClick={onToggleSelectMode}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-2 transition-colors ${selectMode
              ? "border-yellow-500/60 text-yellow-600 hover:bg-yellow-50"
              : "bg-green hover:bg-dark-green text-white"
              }`}
            title={selectMode ? "Cancel select" : "Select posts"}
          >
            <CheckCircleIcon className="h-5 w-5" />
            <span className="text-sm">{selectMode ? "Cancel Select" : "Select Posts"}</span>
          </button>
          {selectMode && (
            <button
              onClick={onBulkDeleteSelected}
              disabled={selectedCount === 0}
              className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-2 ml-2 border-red/50 text-red hover:bg-red/10 disabled:opacity-50"
              title="Delete selected"
            >
              <TrashIcon className="h-5 w-5" />
              <span className="text-sm">
                Delete{selectedCount > 0 ? ` (${selectedCount})` : ""}
              </span>
            </button>
          )}
        </div>



        <button
          onClick={onNewPost}
          className={`inline-flex items-center gap-1.5 rounded-md text-white px-2.5 py-2  bg-green hover:bg-dark-green
            `}
          title={selectMode ? "Cancel select" : "Select posts"}
        >
          <PlusIcon className="h-5 w-5" />
          <span className="text-sm">New Post</span>
        </button>
      </section>
    </>
  );
}
