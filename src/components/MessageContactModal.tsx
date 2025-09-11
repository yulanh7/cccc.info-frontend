"use client";

import React from 'react';
import { mockUsers } from '@/app/data/mockData';
import { UserCircleIcon } from '@heroicons/react/24/outline';

interface NewChatModalProps {
  isOpen: boolean;
  currentUserId: number;
  selectedUserId: number | null;
  onUserSelect: (userId: number) => void;
  onCreateChat: () => void;
  onClose: () => void;
}

export default function NewChatModal({
  isOpen,
  currentUserId,
  selectedUserId,
  onUserSelect,
  onCreateChat,
  onClose,
}: NewChatModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 min-h-[100dvh] bg-gray-600 bg-opacity-50 flex items-center justify-center z-20">
      <div className="bg-white p-6 rounded-sm shadow-lg w-full max-w-md max-h-[70vh] overflow-y-auto relative">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={onClose}
            className="text-dark-gray hover:text-dark-green focus:outline-none"
          >
            Cancel
          </button>
          {selectedUserId && (
            <button
              onClick={onCreateChat}
              className="text-dark-green hover:text-green focus:outline-none"
            >
              Done
            </button>
          )}
        </div>
        <h2 className="text-xl mb-4">Start New Chat</h2>
        <ul className="space-y-2">
          {mockUsers
            .filter((user) => user.id !== currentUserId)
            .map((user) => (
              <li key={user.id} className="flex items-center p-2 hover:bg-gray-100 rounded-sm">
                <input
                  type="radio"
                  name="user"
                  value={user.id}
                  checked={selectedUserId === user.id}
                  onChange={() => onUserSelect(user.id)}
                  className="mr-2"
                />
                <UserCircleIcon className="h-6 w-6 text-gray mr-2" />
                <span>{user.firstName}</span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}