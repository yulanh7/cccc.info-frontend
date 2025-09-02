"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { mockUsers, mockMessages } from '@/app/data/mockData';
import { PencilSquareIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/app/ultility';
import PageTitle from '@/components/layout/PageTitle';
import MessageContactModal from '@/components/MessageContactModal';

export default function MessagesPage() {
  const initialMessages = mockMessages;
  const [messages, setMessages] = useState(initialMessages);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const currentUserId = 2;
  const router = useRouter();

  useEffect(() => {
    // fetchMessages().then(setMessages);
  }, []);

  const handleCreateChat = () => {
    if (selectedUserId) {
      const newMessageId = Date.now();
      const title = `Chat with ${mockUsers.find((u) => u.id === selectedUserId)?.firstName}`;
      const newMessage = {
        id: newMessageId,
        title,
        participants: [currentUserId, selectedUserId],
        messages: [],
      };
      setMessages([...messages, newMessage]);
      setIsNewChatOpen(false);
      setSelectedUserId(null);
      router.push(`/messages/${newMessageId}`);
    }
  };

  return (
    <>
      <PageTitle title="Messages" showPageTitle={true} />

      <div className="container mx-auto p-4 mt-0 md:mt-16">
        <button
          className="fixed bottom-32 right-10 z-99 shadow-lg rounded-[50%] bg-bg p-3"
          onClick={() => setIsNewChatOpen(true)}
        >
          <PencilSquareIcon className="h-7 w-7 text-green" />
        </button>
        <ul className="space-y-2">
          {messages.map((message) => (
            <li key={message.id} className="md:border-t-1 border-border">
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
                <span className="text-xs text-dark-gray whitespace-nowrap">
                  {message.messages[0] ? formatDate(message.messages[0].timestamp) : 'New'}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <MessageContactModal
          isOpen={isNewChatOpen}
          currentUserId={currentUserId}
          selectedUserId={selectedUserId}
          onUserSelect={(userId) => setSelectedUserId(userId)}
          onCreateChat={handleCreateChat}
          onClose={() => setIsNewChatOpen(false)}
        />
      </div>
    </>
  );
}