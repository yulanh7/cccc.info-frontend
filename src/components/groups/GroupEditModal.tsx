"use client";

import { useState } from 'react';
import type { GroupProps, CreateOrUpdateGroupBody } from '@/app/types/group';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface GroupEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  group?: GroupProps | null;
  onSubmit: (body: CreateOrUpdateGroupBody) => void;
}

export default function GroupEditModal({
  isOpen,
  onClose,
  group,
  onSubmit,
}: GroupEditModalProps) {
  if (!isOpen) return null;

  const [name, setName] = useState(group?.title ?? '');
  const [description, setDescription] = useState(group?.description ?? '');
  const [isPrivate, setIsPrivate] = useState<boolean>(group?.inviteOnly ?? false);

  const handleSave = () => {
    const body: CreateOrUpdateGroupBody = {
      name: name.trim(),
      description: description.trim(),
      isPrivate,
    };
    onSubmit(body);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg rounded-md border border-border bg-white p-5">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-dark-gray hover:text-foreground"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-lg font-semibold mb-4">{group ? 'Edit Group' : 'Create Group'}</h2>

        <label className="block text-sm mb-1">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-3 p-2 border border-border rounded-sm"
          placeholder="Group name"
        />

        <label className="block text-sm mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full mb-3 p-2 border border-border rounded-sm min-h-[90px] resize-y"
          placeholder="Describe this group"
        />

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="h-4 w-4"
          />
          Private (invite only)
        </label>

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="px-3 py-1.5 border border-border rounded-sm">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 rounded-sm bg-dark-green text-white hover:bg-green"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
