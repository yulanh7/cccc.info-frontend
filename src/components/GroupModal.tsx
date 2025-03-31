"use client";

import { useState, useRef } from 'react';
import { mockUsers } from '@/app/data/mockData';
import { GroupProps } from '@/app/types';
import { TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import SaveConfirmModal from "./SaveConfirmModal";

interface GroupEditModalProps {
  group?: GroupProps | any;
  isNew?: boolean;
  onSave: (updatedGroup: GroupProps) => void;
  onClose: () => void;
}

export default function GroupEditModal({
  group = {},
  isNew = false,
  onSave,
  onClose,
}: GroupEditModalProps) {

  const defaultItem: GroupProps = {
    id: isNew ? Date.now() : group?.id || 0,
    title: '',
    description: '',
    createdDate: new Date().toISOString().split('T')[0],
    creator: mockUsers[1],
    subscribed: false,
    editable: true,
    inviteOnly: false,
  }
  const [editedItem, setEditedItem] = useState(isNew ? defaultItem : { ...group });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleChange = (field: string, value: any) => {
    setEditedItem((prev: GroupProps) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(editedItem);
    onClose();
  };

  const handleCloseClick = () => {
    const hasChanges = JSON.stringify(editedItem) !== JSON.stringify(isNew ? defaultItem : group);
    if (hasChanges) {
      setIsConfirmOpen(true);
    } else {
      onClose();
    }
  };

  const confirmSaveAndClose = () => {
    handleSave();
    setIsConfirmOpen(false);
  };

  const confirmCancel = () => {
    setIsConfirmOpen(false);
  };

  const confirmCloseWithoutSaving = () => {
    onClose();
    setIsConfirmOpen(false);
  };

  const getConfirmPosition = () => {
    if (closeButtonRef.current) {
      const rect = closeButtonRef.current.getBoundingClientRect();
      return {
        top: rect.bottom - rect.top + 8,
        right: 8,
      };
    }
    return { top: 0, right: 0 };
  };

  return (
    <div className="fixed inset-0 min-h-screen bg-gray bg-opacity-50 flex items-center justify-center z-20 overflow-y-auto">
      <div className="bg-white p-6 rounded-sm shadow-lg w-full md:max-w-[80vw] max-h-[90vh] overflow-y-auto relative">
        <button
          ref={closeButtonRef}
          onClick={handleCloseClick}
          className="absolute top-6 right-4 text-dark-gray hover:text-dark-green focus:outline-none"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-xl mb-4">{isNew ? 'Add New Group' : 'Edit Group'}</h2>
        <input
          type="text"
          value={editedItem.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full p-2 mb-4 border border-border rounded-sm"
          placeholder="Group Title"
        />
        <textarea
          value={editedItem.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="w-full p-2 mb-4 border border-border rounded-sm"
          placeholder="Description"
        />
        <input
          type="date"
          value={editedItem.createdDate}
          onChange={(e) => handleChange('createdDate', e.target.value)}
          className="w-full p-2 mb-4 border border-border rounded-sm"
          placeholder="Created Date"
          disabled={!isNew}
        />
        <div className="mb-4">
          <label className="block text-sm text-dark-gray mb-2">Creator</label>
          <select
            value={editedItem.creator.id}
            onChange={(e) =>
              handleChange('creator', mockUsers.find((u) => u.id === Number(e.target.value))!)
            }
            className="w-full p-2 border border-border rounded-sm"
            disabled={!isNew}
          >
            {mockUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.first_name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={editedItem.inviteOnly}
              onChange={(e) => handleChange('inviteOnly', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-dark-gray">Invite Only</span>
          </label>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-dark-gray hover:text-dark-green"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-dark-green text-white rounded-sm hover:bg-green"
          >
            Save
          </button>
        </div>
        <SaveConfirmModal
          onConfirm={confirmSaveAndClose}
          onCancel={confirmCloseWithoutSaving}
          onOutsideClick={confirmCancel}
          isOpen={isConfirmOpen}
          position={getConfirmPosition()}
        />
      </div>
    </div>
  );
}