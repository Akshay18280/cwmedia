import { Timestamp } from 'firebase/firestore';

// User interface for Firebase
export interface FirebaseUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Social login fields
  provider?: string;
  providerId?: string;
  company?: string;
  position?: string;
  linkedinUrl?: string;
  profileImage?: string;
  verified?: boolean;
  lastLogin?: Timestamp;
}

// Post interface for Firebase
export interface FirebasePost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  authorId: string;
  publishedAt: Timestamp;
  updatedAt: Timestamp;
  category: string;
  tags: string[];
  coverImage?: string;
  readingTime: number;
  views: number;
  likes: number;
  featured: boolean;
  status: 'draft' | 'published' | 'archived';
}

// Newsletter interface for Firebase
export interface FirebaseNewsletter {
  id: string;
  email: string;
  subscriptionDate: Timestamp;
  status: 'active' | 'unsubscribed' | 'bounced';
  preferences: {
    weekly: boolean;
    marketing: boolean;
  };
  unsubscribeToken?: string;
  lastEmailSent?: Timestamp;
}

// Comment interface for Firebase
export interface FirebaseComment {
  id: string;
  content: string;
  authorId: string;
  postId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  likes: number;
  replies?: string[]; // Array of comment IDs
  parentId?: string; // For nested comments
  status: 'published' | 'moderated' | 'deleted';
}

// Review interface for Firebase
export interface FirebaseReview {
  id: string;
  userId: string;
  title: string;
  content: string;
  rating: number;
  reviewerName: string;
  reviewerEmail: string;
  reviewerPosition: string;
  reviewerCompany: string;
  reviewerImage?: string;
  reviewerLinkedInUrl?: string;
  workRelationship: 'colleague' | 'direct_report' | 'manager' | 'client' | 'vendor' | 'other';
  skills?: string[];
  projectsWorkedOn?: string[];
  verified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  moderatorNotes?: string;
}

// Analytics interface for Firebase
export interface FirebaseAnalytics {
  id: string;
  type: 'page_view' | 'post_view' | 'newsletter_signup' | 'like' | 'share';
  data: Record<string, any>;
  timestamp: Timestamp;
  userId?: string;
  sessionId: string;
  userAgent?: string;
  referrer?: string;
  country?: string;
  device?: string;
}

// Utility type for Firestore documents
export type FirestoreDocument<T> = T & {
  id: string;
};

// Utility type for creating documents (without id and timestamps)
export type CreateFirebaseUser = Omit<FirebaseUser, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateFirebasePost = Omit<FirebasePost, 'id' | 'publishedAt' | 'updatedAt'>;
export type CreateFirebaseNewsletter = Omit<FirebaseNewsletter, 'id' | 'subscriptionDate'>;
export type CreateFirebaseComment = Omit<FirebaseComment, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateFirebaseReview = Omit<FirebaseReview, 'id' | 'submittedAt'>;

// Query options
export interface FirebaseQueryOptions {
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  where?: {
    field: string;
    operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in' | 'array-contains-any';
    value: any;
  }[];
  startAfter?: any;
  startAt?: any;
} 