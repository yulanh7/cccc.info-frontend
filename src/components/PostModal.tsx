"use client";

import { useState, useRef } from 'react';
import { PostProps } from '@/app/types/post';
import { TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import SaveConfirmModal from './SaveConfirmModal';

interface EditModalProps {
  item?: PostProps | any;
  isNew?: boolean;
  onSave: (updatedItem: PostProps | any) => void;
  onClose: () => void;
}

export default function EditModal({
  item = {},
  isNew = false,
  onSave,
  onClose,
}: EditModalProps) {
  const defaultItem: PostProps = {
    id: isNew ? Date.now() : item?.id || 0,
    title: '',
    description: '',
    videoUrl: '',
    files: [],
    author: '',
    group: '',
    date: new Date().toISOString().split('T')[0],
  };
  const [editedItem, setEditedItem] = useState(isNew ? defaultItem : { ...item });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleChange = (field: string, value: any) => {
    setEditedItem((prev: PostProps) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFile = {
        name: files[0].name,
        url: '',
        file: files[0],
      };
      handleChange('files', [...(editedItem.files || []), newFile]);
      e.target.value = '';
    }
  };

  const handleDeleteFile = (index: number) => {
    handleChange('files', (editedItem.files || []).filter((_: any, i: number) => i !== index));
  };

  const handleSave = () => {
    const cleanedItem = {
      ...editedItem,
      files: editedItem.files.map(({ name, url }: { name: string; url: string }) => ({ name, url })),
    };
    onSave(cleanedItem);
    onClose();
  };

  const handleCloseClick = () => {
    const hasChanges = JSON.stringify(editedItem) !== JSON.stringify(isNew ? defaultItem : item);
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-20 overflow-y-auto">
      <div className="bg-white p-6 rounded-sm shadow-lg w-full md:max-w-[80vw] max-h-[90vh] overflow-y-auto relative">
        <button
          ref={closeButtonRef}
          onClick={handleCloseClick}
          className="absolute top-2 right-2 text-dark-gray hover:text-dark-green focus:outline-none"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-xl mb-4">{isNew ? 'Add New Item' : 'Edit Item'}</h2>
        <input
          type="text"
          value={editedItem.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full p-2 mb-4 border border-border rounded-sm"
          placeholder="Title"
        />
        <textarea
          value={editedItem.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          className="w-full p-2 mb-4 border border-border rounded-sm min-h-[100px] resize-y overflow-y-auto"
          placeholder="Description"
        />
        <input
          type="text"
          value={editedItem.videoUrl || ''}
          onChange={(e) => handleChange('videoUrl', e.target.value)}
          className="w-full p-2 mb-4 border border-border rounded-sm"
          placeholder="Video URL"
        />
        <div className="mb-4">
          <label className="block text-sm text-dark-gray mb-2">Files</label>
          <div className="space-y-2 max-h-[150px] overflow-y-auto">
            {(editedItem.files || []).map((file: { name: string; url: string }, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded-sm">
                <span>{file.name}</span>
                <button
                  onClick={() => handleDeleteFile(index)}
                  className="text-red-600 hover:text-red-800 focus:outline-none"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2">
            <label className="flex items-center p-2 border border-border rounded-sm cursor-pointer">
              <PlusIcon className="h-5 w-5 mr-2 text-dark-gray" />
              <span className="text-dark-gray">Upload File</span>
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </label>
          </div>
        </div>
        <input
          type="text"
          value={editedItem.author || ''}
          onChange={(e) => handleChange('author', e.target.value)}
          className="w-full p-2 mb-4 border border-border rounded-sm"
          placeholder="Author"
        />
        <input
          type="text"
          value={editedItem.group || ''}
          onChange={(e) => handleChange('group', e.target.value)}
          className="w-full p-2 mb-4 border border-border rounded-sm"
          placeholder="Group"
        />
        <input
          type="date"
          value={editedItem.date || ''}
          onChange={(e) => handleChange('date', e.target.value)}
          className="w-full p-2 mb-4 border border-border rounded-sm"
          placeholder="Date"
        />

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