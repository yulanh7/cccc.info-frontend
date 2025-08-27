import { PostProps, GroupProps, MessageProps, UserProps } from "@/app/types";

export const mockPostList: PostProps[] = [
  {
    id: 1,
    title: 'How to Build a Next.js App',
    date: '2023-10-01',
    author: 'John Doe',
    group: 'Next.js Developers',
    description: 'In this video, we will learn how to build a Next.js app from scratch. We will cover everything from setting up the project to deploying it.',
    videoUrl: '',
    files: [
      { url: "/files/peter.pdf", name: "彼得前書 第四課 2:11-3:12 課件.pdf" },
      { url: "/files/church-cross.png", name: "Image 1.png" },
    ],
  },
  {
    id: 2,
    title: 'Tailwind CSS Tutorial',
    date: '2023-09-25',
    author: 'Jane Smith',
    group: 'Frontend Designers',
    description: 'Learn how to use Tailwind CSS to create beautiful and responsive designs with minimal effort.',
    videoUrl: 'https://www.youtube.com/embed/UBOj6rqRUME',
    files: [
      { url: "/files/peter.pdf", name: "彼得前書 第四課 2:11-3:12 課件.pdf" },
      { url: "/files/church-cross.png", name: "Image 1.png" },
    ],
  },
  {
    id: 3,
    title: 'React Hooks Explained',
    date: '2023-09-15',
    author: 'Alice Johnson',
    group: 'React Enthusiasts',
    description: 'A deep dive into React Hooks, including useState, useEffect, and custom hooks.',
    videoUrl: 'https://www.youtube.com/embed/dpw9EHDh2bM',
    files: [
      { url: "/files/peter.pdf", name: "彼得前書 第四課 2:11-3:12 課件.pdf" },
    ],
  },
  {
    id: 4,
    title: 'How to Build a Next.js App',
    date: '2023-10-01',
    author: 'John Doe',
    group: 'Next.js Developers',
    description: 'In this video, we will learn how to build a Next.js app from scratch. We will cover everything from setting up the project to deploying it.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    files: [
      { url: "/files/peter.pdf", name: "彼得前書 第四課 2:11-3:12 課件.pdf" },
      { url: "/files/church-cross.png", name: "Image 1.png" },
    ],
  },
  {
    id: 5,
    title: 'Tailwind CSS Tutorial',
    date: '2023-09-25',
    author: 'Jane Smith',
    group: 'Frontend Designers',
    description: 'Learn how to use Tailwind CSS to create beautiful and responsive designs with minimal effort.',
    videoUrl: 'https://www.youtube.com/embed/UBOj6rqRUME',
    files: [
      { url: "/files/peter.pdf", name: "彼得前書 第四課 2:11-3:12 課件.pdf" },
      { url: "/files/church-cross.png", name: "Image 1.png" },
    ],
  },
  {
    id: 6,
    title: 'React Hooks Explained',
    date: '2023-09-15',
    author: 'Alice Johnson',
    group: 'React Enthusiasts',
    description: 'A deep dive into React Hooks, including useState, useEffect, and custom hooks.',
    videoUrl: 'https://www.youtube.com/embed/dpw9EHDh2bM',
    files: [
      { url: "/files/peter.pdf", name: "彼得前書 第四課 2:11-3:12 課件.pdf" },
      { url: "/files/church-cross.png", name: "Image 1.png" },
    ],
  },
  {
    id: 7,
    title: 'How to Build a Next.js App',
    date: '2023-10-01',
    author: 'John Doe',
    group: 'Next.js Developers',
    description: 'In this video, we will learn how to build a Next.js app from scratch. We will cover everything from setting up the project to deploying it.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    files: [
      { url: "/files/peter.pdf", name: "彼得前書 第四課 2:11-3:12 課件.pdf" },
      { url: "/files/church-cross.png", name: "Image 1.png" },
    ],
  },
  {
    id: 8,
    title: 'Tailwind CSS Tutorial',
    date: '2023-09-25',
    author: 'Jane Smith',
    group: 'Frontend Designers',
    description: 'Learn how to use Tailwind CSS to create beautiful and responsive designs with minimal effort.',
    videoUrl: 'https://www.youtube.com/embed/UBOj6rqRUME',
    files: [
      { url: "/files/peter.pdf", name: "彼得前書 第四課 2:11-3:12 課件.pdf" },
      { url: "/files/church-cross.png", name: "Image 1.png" },
    ],
  },
  {
    id: 9,
    title: 'React Hooks Explained',
    date: '2023-09-15',
    author: 'Alice Johnson',
    group: 'React Enthusiasts',
    description: 'A deep dive into React Hooks, including useState, useEffect, and custom hooks.',
    videoUrl: 'https://www.youtube.com/embed/dpw9EHDh2bM',
    files: [
      { url: "/files/peter.pdf", name: "彼得前書 第四課 2:11-3:12 課件.pdf" },
      { url: "/files/church-cross.png", name: "Image 1.png" },
    ],
  },
];


export const mockGroups: GroupProps[] = [
  {
    id: 1,
    title: "Tech Enthusiasts",
    description: "A group for tech lovers to share ideas.",
    createdDate: "2025-01-15",
    creator: { id: 1, email: "alice@example.com", first_name: "Alice" },
    subscribed: true,
    editable: true,
    isPrivate: false,
  },
  {
    id: 2,
    title: "Book Club",
    description: "Discuss your favorite books here.",
    createdDate: "2025-02-10",
    creator: { id: 2, email: "bob@example.com", first_name: "Bob" },
    subscribed: false,
    editable: false,
    isPrivate: true,
  },
  {
    id: 3,
    title: "Fitness Freaks",
    description: "Stay motivated with workout tips.",
    createdDate: "2025-03-01",
    creator: { id: 3, email: "charlie@example.com", first_name: "Charlie" },
    subscribed: true,
    editable: true,
    isPrivate: false,
  },
];

export const mockMessages: MessageProps[] = [
  {
    id: 1,
    title: "Chat with Alice",
    participants: [1, 2], // 当前用户 (假设 ID 2) 和 Alice (ID 1)
    messages: [
      { senderId: 1, content: "Hi, how are you?Hi, how are you?Hi, how are you?Hi, how are you?Hi, how are you?", timestamp: "2025-03-25T10:00:00Z" },
      { senderId: 2, content: "I'm good, thanks!", timestamp: "2025-03-25T10:01:00Z" },
      { senderId: 2, content: "This is a new message!", timestamp: "2025-03-26T10:01:00Z" },
    ],
  },
  {
    id: 2,
    title: "Chat with Charlie",
    participants: [2, 3], // 当前用户 (ID 2) 和 Charlie (ID 3)
    messages: [
      { senderId: 3, content: "Hey there!", timestamp: "2025-03-25T12:00:00Z" },
      { senderId: 2, content: "Hello!", timestamp: "2025-03-25T12:01:00Z" },
    ],
  },
  {
    id: 3,
    title: "Chat with Alice",
    participants: [1, 2], // 当前用户 (假设 ID 2) 和 Alice (ID 1)
    messages: [
      { senderId: 1, content: "Hi, how are you?Hi, how are you?Hi, how are you?Hi, how are you?Hi, how are you?", timestamp: "2025-03-25T10:00:00Z" },
      { senderId: 2, content: "I'm good, thanks!", timestamp: "2025-03-25T10:01:00Z" },
      { senderId: 2, content: "This is a new message!", timestamp: "2025-03-26T10:01:00Z" },
    ],
  },
  {
    id: 4,
    title: "Chat with Charlie",
    participants: [2, 3], // 当前用户 (ID 2) 和 Charlie (ID 3)
    messages: [
      { senderId: 3, content: "Hey there!", timestamp: "2025-03-25T12:00:00Z" },
      { senderId: 2, content: "Hello!", timestamp: "2025-03-25T12:01:00Z" },
    ],
  },
  {
    id: 5,
    title: "Chat with Alice",
    participants: [1, 2], // 当前用户 (假设 ID 2) 和 Alice (ID 1)
    messages: [
      { senderId: 1, content: "Hi, how are you?Hi, how are you?Hi, how are you?Hi, how are you?Hi, how are you?", timestamp: "2025-03-25T10:00:00Z" },
      { senderId: 2, content: "I'm good, thanks!", timestamp: "2025-03-25T10:01:00Z" },
      { senderId: 2, content: "This is a new message!", timestamp: "2025-03-26T10:01:00Z" },
    ],
  },
  {
    id: 6,
    title: "Chat with Charlie",
    participants: [2, 3], // 当前用户 (ID 2) 和 Charlie (ID 3)
    messages: [
      { senderId: 3, content: "Hey there!", timestamp: "2025-03-25T12:00:00Z" },
      { senderId: 2, content: "Hello!", timestamp: "2025-03-25T12:01:00Z" },
    ],
  },
  {
    id: 7,
    title: "Chat with Alice",
    participants: [1, 2], // 当前用户 (假设 ID 2) 和 Alice (ID 1)
    messages: [
      { senderId: 1, content: "Hi, how are you?Hi, how are you?Hi, how are you?Hi, how are you?Hi, how are you?", timestamp: "2025-03-25T10:00:00Z" },
      { senderId: 2, content: "I'm good, thanks!", timestamp: "2025-03-25T10:01:00Z" },
      { senderId: 2, content: "This is a new message!", timestamp: "2025-03-26T10:01:00Z" },
    ],
  },
  {
    id: 8,
    title: "Chat with Charlie",
    participants: [2, 3], // 当前用户 (ID 2) 和 Charlie (ID 3)
    messages: [
      { senderId: 3, content: "Hey there!", timestamp: "2025-03-25T12:00:00Z" },
      { senderId: 2, content: "Hello!", timestamp: "2025-03-25T12:01:00Z" },
    ],
  },
];

export const mockUsers: UserProps[] = [
  { id: 1, first_name: "Alice", email: "alice@example.com" },
  { id: 2, first_name: "Bob", email: "bob@example.com" },
  { id: 3, first_name: "Charlie", email: "charlie@example.com" },
];