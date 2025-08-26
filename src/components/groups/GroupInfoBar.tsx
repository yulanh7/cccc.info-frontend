"use client";

import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
  CalendarIcon,
  UserPlusIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import type { GroupProps } from "@/app/types/group";

type Props = {
  group: GroupProps;
  subscriberCount: number;
  onShowMembers: () => void;
  onNewPost: () => void;
  onEditGroup: () => void;
  onDeleteGroup: () => void;
  formatDate: (timestamp: string, showTime?: boolean) => string;

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


                <IconButton
                  title="Edit group"
                  onClick={onEditGroup}
                  variant="outline"
                  size="md"
                >
                  <PencilIcon className="h-5 w-5" />
                </IconButton>

                <IconButton
                  title="Delete group"
                  onClick={onDeleteGroup}
                  variant="danger"
                  size="md"
                >
                  <TrashIcon className="h-5 w-5" />
                </IconButton>
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

          <Button
            onClick={onShowMembers}
            variant="outline"
            size="sm"
            leftIcon={<UserPlusIcon className="h-4 w-4" />}
            title="View members"
          >
            <span className="text-[11px] uppercase tracking-wide text-dark-gray/70">
              Members
            </span>
            <span className="ml-1 font-semibold">{subscriberCount}</span>
          </Button>
        </div>
      </section>

      {/* 移动端：动作分布（可根据你现有布局保留） */}
      <section className="flex justify-end gap-2 px-4">
        {group.editable && (
          <>
            <Button
              onClick={onToggleSelectMode}
              variant={selectMode ? "warning" : "outline"}
              size="sm"
              leftIcon={<CheckCircleIcon className="h-5 w-5" />}
              active={selectMode}
            >
              {selectMode ? "Cancel" : "Select"}
            </Button>

            {selectMode && (
              <Button
                onClick={onBulkDeleteSelected}
                variant="danger"
                size="sm"
                leftIcon={<TrashIcon className="h-5 w-5" />}
                disabled={selectedCount === 0}
              >
                Delete{selectedCount > 0 ? ` (${selectedCount})` : ""}
              </Button>
            )}

            <Button
              onClick={onNewPost}
              variant="primary"
              size="sm"
              leftIcon={<PlusIcon className="h-5 w-5" />}
            >
              New
            </Button>
          </>
        )}
      </section>
    </>
  );
}
