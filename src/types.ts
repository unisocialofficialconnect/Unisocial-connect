export interface User {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  verified: boolean;
  bio?: string;
  cover?: string;
  followers?: number;
  following?: number;
  postsCount?: number;
  productsCount?: number;
  reputation?: number;
  xp?: number;
  level?: number;
  achievements?: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  icon: string;
  description: string;
  date: string;
}

export interface Post {
  id: string;
  userId: string;
  user?: User;
  text: string;
  image?: string;
  video?: string;
  likes: number;
  likedBy?: string[];
  comments: number;
  shares: number;
  timestamp: any;
  pinned?: boolean;
}

export interface Story {
  id: string;
  userId: string;
  user?: User;
  image: string;
  timestamp: any;
  viewed?: boolean;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  image: string;
  cover: string;
  membersCount: number;
  category: string;
  rules?: string[];
  moderators?: string[];
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  userId: string;
  user?: User;
  rating: number;
  reviewsCount: number;
  isVerified?: boolean;
  status: 'active' | 'sold';
  timestamp: any;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId?: string; // For DMs
  groupId?: string; // For groups/channels/communities
  text: string;
  image?: string;
  video?: string;
  file?: string;
  reactions?: Record<string, string[]>; // emoji -> userIds
  replyTo?: string; // messageId
  timestamp: any;
  isEdited?: boolean;
  isPinned?: boolean;
  readBy?: string[];
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
  command?: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  deadline?: string;
}
