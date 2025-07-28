# API Reference
## Carelwave Media Service Layer Documentation

### Overview

This document provides comprehensive documentation for all service layer APIs in the Carelwave Media application. All services are built with TypeScript and follow modern async/await patterns.

## Table of Contents

- [Authentication Service](#authentication-service)
- [Posts Service](#posts-service)
- [Newsletter Service](#newsletter-service)
- [Reviews Service](#reviews-service)
- [Analytics Service](#analytics-service)
- [Email Service](#email-service)
- [SMS Service](#sms-service)
- [Error Handling](#error-handling)
- [Type Definitions](#type-definitions)

## Authentication Service

### UnifiedAuthService

Handles user and admin authentication with Firebase Auth and custom verification.

#### Methods

##### `initializeRecaptcha(containerId?: string): Promise<void>`

Initializes reCAPTCHA verifier for phone authentication.

**Parameters:**
- `containerId` (optional): HTML element ID for reCAPTCHA container. Default: 'recaptcha-container'

**Returns:** Promise that resolves when reCAPTCHA is initialized

**Throws:**
- `Error`: When reCAPTCHA initialization fails

**Example:**
```typescript
import { unifiedAuthService } from '../services/auth';

try {
  await unifiedAuthService.initializeRecaptcha('my-recaptcha');
  console.log('reCAPTCHA ready');
} catch (error) {
  console.error('reCAPTCHA failed:', error);
}
```

##### `signInWithPhone(phoneNumber: string): Promise<void>`

Initiates phone number authentication with OTP.

**Parameters:**
- `phoneNumber`: Phone number in E.164 format (e.g., "+1234567890")

**Returns:** Promise that resolves when OTP is sent

**Throws:**
- `Error`: When phone number is invalid or SMS sending fails
- `AuthenticationError`: When too many attempts are made

**Example:**
```typescript
try {
  await unifiedAuthService.signInWithPhone('+1234567890');
  // Redirect user to OTP verification
} catch (error) {
  console.error('Phone sign-in failed:', error);
}
```

##### `verifyOTP(otp: string): Promise<FirebaseUser>`

Verifies OTP code and completes authentication.

**Parameters:**
- `otp`: 6-digit OTP code

**Returns:** Promise resolving to authenticated user data

**Throws:**
- `Error`: When OTP is invalid or expired
- `AuthenticationError`: When verification fails

**Example:**
```typescript
try {
  const user = await unifiedAuthService.verifyOTP('123456');
  console.log('Authenticated user:', user);
} catch (error) {
  console.error('OTP verification failed:', error);
}
```

##### `signInWithGoogle(): Promise<FirebaseUser>`

Authenticates user with Google OAuth.

**Returns:** Promise resolving to authenticated user data

**Throws:**
- `Error`: When Google sign-in is cancelled or fails
- `AuthenticationError`: When OAuth verification fails

**Example:**
```typescript
try {
  const user = await unifiedAuthService.signInWithGoogle();
  console.log('Google user:', user);
} catch (error) {
  console.error('Google sign-in failed:', error);
}
```

##### `generateAdminOTP(phoneNumber: string): Promise<void>`

Generates and sends OTP for admin verification.

**Parameters:**
- `phoneNumber`: Admin phone number

**Returns:** Promise that resolves when OTP is sent

**Throws:**
- `Error`: When phone number is not admin number
- `SMSError`: When SMS sending fails

**Example:**
```typescript
try {
  await unifiedAuthService.generateAdminOTP('+916264507878');
  console.log('Admin OTP sent');
} catch (error) {
  console.error('Admin OTP failed:', error);
}
```

##### `verifyAdminOTP(otp: string): Promise<boolean>`

Verifies admin OTP code.

**Parameters:**
- `otp`: 6-digit OTP code

**Returns:** Promise resolving to verification result

**Throws:**
- `Error`: When OTP is invalid or expired
- `AuthenticationError`: When verification fails

**Example:**
```typescript
try {
  const isValid = await unifiedAuthService.verifyAdminOTP('654321');
  if (isValid) {
    // Grant admin access
  }
} catch (error) {
  console.error('Admin verification failed:', error);
}
```

##### `signOut(): Promise<void>`

Signs out the current user.

**Returns:** Promise that resolves when sign-out is complete

**Example:**
```typescript
await unifiedAuthService.signOut();
console.log('User signed out');
```

## Posts Service

### FirebasePostsService

Manages blog posts with Firestore database operations.

#### Methods

##### `getAllPosts(options?: GetPostsOptions): Promise<Post[]>`

Retrieves all published posts with optional filtering.

**Parameters:**
- `options` (optional): Filtering and pagination options

**Options Interface:**
```typescript
interface GetPostsOptions {
  limit?: number;        // Maximum posts to return (default: 10)
  offset?: number;       // Number of posts to skip (default: 0)
  category?: string;     // Filter by category
  tags?: string[];       // Filter by tags
  sortBy?: 'date' | 'views' | 'title';  // Sort criteria
  sortOrder?: 'asc' | 'desc';           // Sort direction
}
```

**Returns:** Promise resolving to array of posts

**Throws:**
- `DatabaseError`: When Firestore query fails
- `NetworkError`: When connection is unavailable

**Example:**
```typescript
import { firebasePostsService } from '../services/posts';

try {
  const posts = await firebasePostsService.getAllPosts({
    limit: 5,
    category: 'technology',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  console.log('Latest tech posts:', posts);
} catch (error) {
  console.error('Failed to fetch posts:', error);
}
```

##### `getPostById(id: string): Promise<Post | null>`

Retrieves a specific post by ID.

**Parameters:**
- `id`: Post identifier

**Returns:** Promise resolving to post data or null if not found

**Throws:**
- `DatabaseError`: When Firestore query fails

**Example:**
```typescript
try {
  const post = await firebasePostsService.getPostById('post-123');
  if (post) {
    console.log('Post found:', post.title);
  }
} catch (error) {
  console.error('Failed to fetch post:', error);
}
```

##### `createPost(postData: CreatePostData): Promise<string>`

Creates a new blog post (admin only).

**Parameters:**
- `postData`: Post creation data

**PostData Interface:**
```typescript
interface CreatePostData {
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  category: string;
  tags: string[];
  published: boolean;
}
```

**Returns:** Promise resolving to new post ID

**Throws:**
- `AuthenticationError`: When user is not authenticated as admin
- `ValidationError`: When post data is invalid
- `DatabaseError`: When creation fails

**Example:**
```typescript
try {
  const postId = await firebasePostsService.createPost({
    title: 'New Technology Trends',
    content: 'Content here...',
    category: 'technology',
    tags: ['tech', 'trends'],
    published: true
  });
  console.log('Created post:', postId);
} catch (error) {
  console.error('Failed to create post:', error);
}
```

##### `updatePost(id: string, updates: Partial<Post>): Promise<void>`

Updates an existing post (admin only).

**Parameters:**
- `id`: Post identifier
- `updates`: Partial post data to update

**Returns:** Promise that resolves when update is complete

**Throws:**
- `AuthenticationError`: When user is not authenticated as admin
- `NotFoundError`: When post doesn't exist
- `DatabaseError`: When update fails

**Example:**
```typescript
try {
  await firebasePostsService.updatePost('post-123', {
    title: 'Updated Title',
    tags: ['updated', 'tag']
  });
  console.log('Post updated');
} catch (error) {
  console.error('Failed to update post:', error);
}
```

##### `deletePost(id: string): Promise<void>`

Deletes a post (admin only).

**Parameters:**
- `id`: Post identifier

**Returns:** Promise that resolves when deletion is complete

**Throws:**
- `AuthenticationError`: When user is not authenticated as admin
- `NotFoundError`: When post doesn't exist
- `DatabaseError`: When deletion fails

**Example:**
```typescript
try {
  await firebasePostsService.deletePost('post-123');
  console.log('Post deleted');
} catch (error) {
  console.error('Failed to delete post:', error);
}
```

##### `incrementViews(id: string): Promise<void>`

Increments the view count for a post.

**Parameters:**
- `id`: Post identifier

**Returns:** Promise that resolves when view count is updated

**Example:**
```typescript
try {
  await firebasePostsService.incrementViews('post-123');
} catch (error) {
  console.error('Failed to increment views:', error);
}
```

##### `searchPosts(query: string): Promise<Post[]>`

Searches posts by title and content.

**Parameters:**
- `query`: Search query string

**Returns:** Promise resolving to matching posts

**Throws:**
- `DatabaseError`: When search query fails

**Example:**
```typescript
try {
  const results = await firebasePostsService.searchPosts('react hooks');
  console.log('Search results:', results.length);
} catch (error) {
  console.error('Search failed:', error);
}
```

## Newsletter Service

### FirebaseNewsletterService

Manages newsletter subscriptions and email campaigns.

#### Methods

##### `subscribe(email: string, preferences?: SubscriptionPreferences): Promise<SubscriptionResult>`

Subscribes an email to the newsletter.

**Parameters:**
- `email`: Email address to subscribe
- `preferences` (optional): Subscription preferences

**Preferences Interface:**
```typescript
interface SubscriptionPreferences {
  weekly?: boolean;      // Weekly newsletter
  marketing?: boolean;   // Marketing emails
  frequency?: 'daily' | 'weekly' | 'monthly';
}
```

**Returns:** Promise resolving to subscription result

**Throws:**
- `ValidationError`: When email is invalid
- `DuplicateError`: When email is already subscribed
- `DatabaseError`: When subscription fails

**Example:**
```typescript
import { firebaseNewsletterService } from '../services/newsletter';

try {
  const result = await firebaseNewsletterService.subscribe(
    'user@example.com',
    { weekly: true, marketing: false }
  );
  console.log('Subscribed:', result.success);
} catch (error) {
  console.error('Subscription failed:', error);
}
```

##### `unsubscribe(token: string): Promise<boolean>`

Unsubscribes using unsubscribe token.

**Parameters:**
- `token`: Unsubscribe token from email

**Returns:** Promise resolving to unsubscribe success

**Throws:**
- `ValidationError`: When token is invalid
- `NotFoundError`: When subscription not found

**Example:**
```typescript
try {
  const success = await firebaseNewsletterService.unsubscribe('token-123');
  if (success) {
    console.log('Successfully unsubscribed');
  }
} catch (error) {
  console.error('Unsubscribe failed:', error);
}
```

##### `getStats(): Promise<NewsletterStats>`

Gets newsletter statistics (admin only).

**Returns:** Promise resolving to newsletter statistics

**Stats Interface:**
```typescript
interface NewsletterStats {
  totalSubscribers: number;
  activeSubscribers: number;
  unsubscribeRate: number;
  growthRate: number;
  engagementRate: number;
}
```

**Example:**
```typescript
try {
  const stats = await firebaseNewsletterService.getStats();
  console.log('Subscribers:', stats.totalSubscribers);
} catch (error) {
  console.error('Failed to get stats:', error);
}
```

##### `sendBulkNewsletter(content: NewsletterContent, recipients?: string[]): Promise<void>`

Sends newsletter to subscribers (admin only).

**Parameters:**
- `content`: Newsletter content
- `recipients` (optional): Specific recipient list

**Content Interface:**
```typescript
interface NewsletterContent {
  subject: string;
  html: string;
  text?: string;
  previewText?: string;
}
```

**Returns:** Promise that resolves when newsletter is sent

**Example:**
```typescript
try {
  await firebaseNewsletterService.sendBulkNewsletter({
    subject: 'Weekly Update',
    html: '<h1>Newsletter content</h1>',
    text: 'Newsletter content'
  });
  console.log('Newsletter sent');
} catch (error) {
  console.error('Newsletter sending failed:', error);
}
```

## Error Handling

### Error Types

All services use consistent error types:

```typescript
class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

class ValidationError extends Error {
  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

class DatabaseError extends Error {
  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}
```

### Error Handling Best Practices

```typescript
try {
  const result = await someService.method();
  // Handle success
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Redirect to login
  } else if (error instanceof ValidationError) {
    // Show validation message
  } else if (error instanceof NetworkError) {
    // Show network error message
  } else {
    // Show generic error message
    console.error('Unexpected error:', error);
  }
}
```

## Type Definitions

### Core Types

```typescript
interface Post {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  category: string;
  tags: string[];
  slug: string;
  published: boolean;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  authorId: string;
}

interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  isAdmin: boolean;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}

interface NewsletterSubscription {
  email: string;
  subscribed: boolean;
  preferences: SubscriptionPreferences;
  unsubscribeToken: string;
  subscribedAt: Timestamp;
  unsubscribedAt?: Timestamp;
}
```

### Service Response Types

```typescript
interface SubscriptionResult {
  success: boolean;
  message: string;
  token?: string;
}

interface AuthResult {
  user: FirebaseUser;
  token: string;
  expiresAt: Date;
}
```

---

## Rate Limiting

All services implement rate limiting to prevent abuse:

- **Authentication**: 5 attempts per minute per IP
- **Newsletter**: 1 subscription per minute per email
- **Posts**: 100 requests per minute per user
- **Search**: 20 searches per minute per user

## Caching

Services implement intelligent caching:

- **Posts**: 5-minute cache for public posts
- **User Data**: Session-based caching
- **Statistics**: 15-minute cache for analytics
- **Configuration**: 1-hour cache for settings

## Security

All services follow security best practices:

- **Input validation** on all parameters
- **SQL injection prevention** with parameterized queries
- **XSS protection** with output sanitization
- **CSRF protection** with tokens
- **Rate limiting** to prevent abuse
- **Authentication verification** for protected endpoints

---

For implementation examples and advanced usage, see the [Development Guide](DEVELOPMENT.md). 