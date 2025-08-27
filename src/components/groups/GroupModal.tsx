"use client";

import { useState, useRef } from 'react';
import { mockUsers } from '@/app/data/mockData';
import { GroupProps } from '@/app/types';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from "@/components/ui/Button";
import SaveConfirmModal from "../SaveConfirmModal";

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
    isPrivate: false,
  };

  const [editedItem, setEditedItem] = useState<GroupProps>(
    isNew ? defaultItem : { ...group }
  );
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // errors + refs for focusing invalid fields
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleChange = (field: keyof GroupProps, value: any) => {
    setEditedItem((prev) => ({ ...prev, [field]: value }));
    // clear error on typing
    if (field === 'title' && errors.title) setErrors((e) => ({ ...e, title: undefined }));
    if (field === 'description' && errors.description) setErrors((e) => ({ ...e, description: undefined }));
  };

  // Validate required fields and focus the first invalid
  const validate = () => {
    const next: { title?: string; description?: string } = {};
    if (!editedItem.title.trim()) next.title = 'Title is required';
    if (!editedItem.description.trim()) next.description = 'Description is required';
    setErrors(next);

    if (next.title && titleRef.current) {
      titleRef.current.focus();
    } else if (next.description && descRef.current) {
      descRef.current.focus();
    }
    return Object.keys(next).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return; // stop submit, show errors, focus invalid
    const cleaned: GroupProps = {
      ...editedItem,
      title: editedItem.title.trim(),
      description: editedItem.description.trim(),
    };
    onSave(cleaned);
    onClose();
  };

  const hasChanges =
    JSON.stringify(editedItem) !== JSON.stringify(isNew ? defaultItem : group);

  const handleCloseClick = () => {
    if (hasChanges) setIsConfirmOpen(true);
    else onClose();
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
      return { top: rect.bottom - rect.top + 8, right: 8 };
    }
    return { top: 0, right: 0 };
  };

  const nameId = "group-name";
  const descId = "group-description";
  const privId = "group-private";

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

        {/* Title */}
        <label htmlFor={nameId} className="block text-sm font-medium mb-1">
          Title
        </label>
        <input
          id={nameId}
          ref={titleRef}
          type="text"
          value={editedItem.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className={`w-full p-2 mb-1 border rounded-sm ${errors.title ? 'border-red-500' : 'border-border'
            }`}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && (
          <p id="title-error" className="text-red-600 text-sm mb-3">
            {errors.title}
          </p>
        )}

        {/* Description */}
        <label htmlFor={descId} className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          id={descId}
          ref={descRef}
          value={editedItem.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className={`w-full p-2 mb-1 border rounded-sm ${errors.description ? 'border-red-500' : 'border-border'
            }`}
          placeholder="Description"
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
          rows={6}
        />
        {errors.description && (
          <p id="description-error" className="text-red-600 text-sm mb-3">
            {errors.description}
          </p>
        )}

        {/* Invite Only */}
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={editedItem.isPrivate}
              onChange={(e) => handleChange('isPrivate', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-dark-gray">Invite Only</span>
          </label>
        </div>

        {/* Actions */}
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save
          </Button>
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
