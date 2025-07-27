export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: Author | null;
  published_at: string;
  updated_at: string;
  tags: string[] | null;
  category: string;
  cover_image?: string | null;
  reading_time: number;
  views: number;
  likes: number;
  featured: boolean;
}

export interface Author {
  id: string;
  name: string;
  bio?: string;
  avatar?: string;
  avatar_url?: string | null;
  socialLinks?: {
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