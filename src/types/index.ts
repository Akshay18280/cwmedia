export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: Author;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  category: string;
  coverImage?: string;
  readingTime: number;
  views: number;
  likes: number;
  featured: boolean;
}

export interface Author {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
}

export interface Comment {
  id: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
  };
  createdAt: string;
  postId: string;
}

export interface Newsletter {
  email: string;
  subscriptionDate: string;
  status: 'active' | 'unsubscribed';
  preferences?: {
    weekly: boolean;
    marketing: boolean;
  };
}