"use client";

import { useState } from 'react';
import { mockUsers } from '@/app/data/mockData';
import { GroupProps } from '@/app/types';

interface GroupEditModalProps {
  group?: GroupProps;
  isNew?: boolean;
  onSave: (updatedGroup: GroupProps) => void;
  onClose: () => void;
}

export default function GroupEditModal({
  group = {
    id: 0,
    title: '',
    description: '',
    createdDate: new Date().toISOString().split('T')[0],
    creator: mockUsers[1], // 默认 Bob 作为当前用户
    subscribed: false,
    editable: true,
    inviteOnly: false,
  },
  isNew = false,
  onSave,
  onClose,
}: GroupEditModalProps) {
  const [editedGroup, setEditedGroup] = useState(group);

  const handleChange = (field: string, value: any) => {
    setEditedGroup((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(editedGroup);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-20">
      <div className="bg-white p-6 rounded-sm shadow-lg w-full max-w-md">
        <h2 className="text-xl mb-4">{isNew ? 'Add New Group' : 'Edit Group'}</h2>

        <input
          type="text"
          value={editedGroup.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full p-2 mb-4 border border-border rounded-sm"
          placeholder="Group Title"
        />
        <textarea
          value={editedGroup.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="w-full p-2 mb-4 border border-border rounded-sm"
          placeholder="Description"
        />
        <input
          type="date"
          value={editedGroup.createdDate}
          onChange={(e) => handleChange('createdDate', e.target.value)}
          className="w-full p-2 mb-4 border border-border rounded-sm"
          placeholder="Created Date"
          disabled={!isNew} // 编辑时不可修改
        />
        <div className="mb-4">
          <label className="block text-sm text-dark-gray mb-2">Creator</label>
          <select
            value={editedGroup.creator.id}
            onChange={(e) =>
              handleChange('creator', mockUsers.find((u) => u.id === Number(e.target.value))!)
            }
            className="w-full p-2 border border-border rounded-sm"
            disabled={!isNew} // 编辑时不可修改
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
              checked={editedGroup.subscribed}
              onChange={(e) => handleChange('subscribed', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-dark-gray">Subscribed</span>
          </label>
        </div>
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={editedGroup.editable}
              onChange={(e) => handleChange('editable', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-dark-gray">Editable</span>
          </label>
        </div>
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={editedGroup.inviteOnly}
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
      </div>
    </div>
  );
}