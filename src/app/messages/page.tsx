"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { mockUsers, mockMessages } from '@/app/data/mockData';
import { PencilIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/app/ultility';
import PageTitle from '@/components/PageTitle';

export default function MessagesPage() {
  const initialMessages = mockMessages;
  const [messages, setMessages] = useState(initialMessages);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const currentUserId = 2
  useEffect(() => {
    // fetchMessages().then(setMessages);
  }, []);

  const handleCreateChat = () => {
    if (selectedUserId) {
      const title = `Chat with ${mockUsers.find((u) => u.id === selectedUserId)?.first_name}`;
      // createMessage(title, [2, selectedUserId]).then((newMessage: MessageProps) => {
      //   setMessages([...messages, newMessage]);
      //   setIsNewChatOpen(false);
      //   setSelectedUserId(null);
      // });
    }
  };



  return (
    <>
      <PageTitle title="Messages" showPageTitle={true} />

      <div className="container mx-auto p-4 mt-0 md:mt-16">
        <button className='fixed bottom-32 right-10 z-99 shadow-lg rounded-[50%] bg-bg p-3' onClick={() => setIsNewChatOpen(true)}>
          <PencilIcon className="h-7 w-7 text-green" />
        </button>
        <ul className="space-y-2">
          {messages.map((message) => (
            <li key={message.id} className='md:border-t-1 border-border'>
              <Link
                href={`/messages/${message.id}`}
                className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-sm cursor-pointer"
              >
                <div className="flex items-center">
                  <UserCircleIcon className="h-7 w-7 text-gray mr-1" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-dark-gray">Alice</span>
                    <span className="text-sm text-gray-600">{message.title}</span>
                  </div>
                </div>
                <span className="text-xs text-dark-gray whitespace-nowrap">{formatDate(message.messages[0].timestamp)}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* 新对话模态框 */}
        {isNewChatOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white p-6 rounded-sm shadow-lg w-full max-w-md">
              <h2 className="text-xl mb-4">Start New Chat</h2>
              <select
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(Number(e.target.value))}
                className="w-full p-2 mb-4 border border-border rounded-sm"
              >
                <option value="" disabled>Select a user</option>
                {mockUsers
                  .filter((user) => user.id !== 2) // 排除自己
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name}
                    </option>
                  ))}
              </select>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setIsNewChatOpen(false)}
                  className="px-4 py-2 text-dark-gray hover:text-dark-green"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChat}
                  disabled={!selectedUserId}
                  className="px-4 py-2 bg-dark-green text-white rounded-sm hover:bg-green disabled:bg-gray-400"
                >
                  Start
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}