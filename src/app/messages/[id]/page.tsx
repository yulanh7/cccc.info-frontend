"use client";

import React, { useState, useEffect } from 'react';
import { mockUsers, mockMessages } from '@/app/data/mockData';
import CustomHeader from '@/components/CustomHeader';

export default function MessageDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsPromise);
  const id = Number(params.id);
  const initialMessage = mockMessages.find((p) => p.id === Number(params.id));

  const [message, setMessage] = useState(initialMessage);
  const [newMessage, setNewMessage] = useState('');
  const currentUserId = 2;

  useEffect(() => {
  }, [id]);

  const handleSend = () => {

  };

  if (!message) {
    return <div>Message not found</div>;
  }

  const otherUserId = message.participants.find((p) => p !== currentUserId);
  const otherUser = mockUsers.find((u) => u.id === otherUserId);

  return (
    <>
      <CustomHeader
        item={{ author: otherUser?.first_name }}
        showEdit={false}
        showDelete={false}
        showAdd={false}
        pageTitle={message.title}
      />
      <div className="max-w-[760px] mx-auto p-4 flex flex-col mt-16">
        <div>
          {message.messages.map((msg, index) => (
            <div
              key={index}
              className={`flex mb-3 ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div className=""

              >
                <p className={` p-2 rounded-sm ${msg.senderId === currentUserId ? 'bg-green text-white' : 'bg-light-gray text-dark-gray'
                  }`}>{msg.content}</p>
                <span className="block text-xs mt-1 opacity-70">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="fixed bottom-0 left-0 right-0 md:left-10 md:right-10  flex items-center p-4 bg-bg">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 p-2 border border-border rounded-sm mr-2"
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-green text-white rounded-sm hover:bg-green"
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}