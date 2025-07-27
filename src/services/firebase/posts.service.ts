import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  Timestamp,
  type DocumentData,
  type QueryConstraint
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { FirebasePost, CreateFirebasePost, FirebaseQueryOptions } from '../../types/firebase';
import type { Post } from '../../types';

class FirebasePostsService {
  private readonly collection = collection(db, 'posts');

  // Convert Firebase post to app post format
  private convertToAppPost(firebasePost: FirebasePost): Post {
    return {
      id: firebasePost.id,
      title: firebasePost.title,
      content: firebasePost.content,
      excerpt: firebasePost.excerpt,
      author_id: firebasePost.authorId,
      published_at: firebasePost.publishedAt.toDate().toISOString(),
      updated_at: firebasePost.updatedAt.toDate().toISOString(),
      category: firebasePost.category,
      tags: firebasePost.tags,
      cover_image: firebasePost.coverImage || null,
      reading_time: firebasePost.readingTime,
      views: firebasePost.views,
      likes: firebasePost.likes,
      featured: firebasePost.featured,
      // Author will be populated separately if needed
      author: null
    };
  }

  // Convert app post to Firebase format
  private convertToFirebasePost(post: Partial<Post>): Partial<CreateFirebasePost> {
    return {
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      authorId: post.author_id || '',
      category: post.category,
      tags: post.tags || [],
      coverImage: post.cover_image || undefined,
      readingTime: post.reading_time || 0,
      views: post.views || 0,
      likes: post.likes || 0,
      featured: post.featured || false,
      status: 'published'
    };
  }

  // Get all posts
  async getAllPosts(options: FirebaseQueryOptions = {}): Promise<Post[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('status', '==', 'published')
      ];

      if (options.orderBy) {
        constraints.push(orderBy(options.orderBy, options.orderDirection || 'desc'));
      } else {
        constraints.push(orderBy('publishedAt', 'desc'));
      }

      if (options.limit) {
        constraints.push(limit(options.limit));
      }

      if (options.where) {
        options.where.forEach(condition => {
          constraints.push(where(condition.field, condition.operator, condition.value));
        });
      }

      const q = query(this.collection, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() } as FirebasePost;
        return this.convertToAppPost(data);
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  }

  // Get featured posts
  async getFeaturedPosts(limitCount: number = 3): Promise<Post[]> {
    return this.getAllPosts({
      where: [{ field: 'featured', operator: '==', value: true }],
      limit: limitCount,
      orderBy: 'publishedAt',
      orderDirection: 'desc'
    });
  }

  // Get post by ID
  async getPostById(id: string): Promise<Post | null> {
    try {
      const docRef = doc(this.collection, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as FirebasePost;
        return this.convertToAppPost(data);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching post:', error);
      return null;
    }
  }

  // Create new post
  async createPost(postData: Partial<Post>): Promise<string | null> {
    try {
      const firebasePost = this.convertToFirebasePost(postData);
      const now = Timestamp.now();
      
      const docRef = await addDoc(this.collection, {
        ...firebasePost,
        publishedAt: now,
        updatedAt: now
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating post:', error);
      return null;
    }
  }

  // Update post
  async updatePost(id: string, postData: Partial<Post>): Promise<boolean> {
    try {
      const docRef = doc(this.collection, id);
      const firebasePost = this.convertToFirebasePost(postData);
      
      await updateDoc(docRef, {
        ...firebasePost,
        updatedAt: Timestamp.now()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating post:', error);
      return false;
    }
  }

  // Delete post
  async deletePost(id: string): Promise<boolean> {
    try {
      const docRef = doc(this.collection, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  }

  // Increment post views
  async incrementViews(id: string): Promise<void> {
    try {
      const docRef = doc(this.collection, id);
      await updateDoc(docRef, {
        views: increment(1)
      });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  }

  // Increment post likes
  async incrementLikes(id: string): Promise<number> {
    try {
      const docRef = doc(this.collection, id);
      await updateDoc(docRef, {
        likes: increment(1)
      });
      
      // Get updated likes count
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().likes || 0;
      }
      
      return 0;
    } catch (error) {
      console.error('Error incrementing likes:', error);
      return 0;
    }
  }

  // Search posts
  async searchPosts(searchTerm: string): Promise<Post[]> {
    try {
      // Firebase doesn't have full-text search, so we'll get all posts and filter
      // In production, you'd use Algolia or similar for better search
      const posts = await this.getAllPosts();
      
      const lowercaseSearch = searchTerm.toLowerCase();
      
      return posts.filter(post => 
        post.title.toLowerCase().includes(lowercaseSearch) ||
        post.excerpt.toLowerCase().includes(lowercaseSearch) ||
        post.content.toLowerCase().includes(lowercaseSearch) ||
        post.tags?.some(tag => tag.toLowerCase().includes(lowercaseSearch))
      );
    } catch (error) {
      console.error('Error searching posts:', error);
      return [];
    }
  }

  // Get posts by category
  async getPostsByCategory(category: string): Promise<Post[]> {
    return this.getAllPosts({
      where: [{ field: 'category', operator: '==', value: category }]
    });
  }

  // Get posts by tag
  async getPostsByTag(tag: string): Promise<Post[]> {
    return this.getAllPosts({
      where: [{ field: 'tags', operator: 'array-contains', value: tag }]
    });
  }

  // Get post statistics
  async getPostStats() {
    try {
      const posts = await this.getAllPosts();
      
      const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);
      const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
      const avgReadingTime = posts.length > 0 
        ? Math.round(posts.reduce((sum, post) => sum + post.reading_time, 0) / posts.length)
        : 0;
      
      return {
        totalPosts: posts.length,
        totalViews,
        totalLikes,
        avgReadingTime,
        featuredPosts: posts.filter(post => post.featured).length
      };
    } catch (error) {
      console.error('Error getting post stats:', error);
      return {
        totalPosts: 0,
        totalViews: 0,
        totalLikes: 0,
        avgReadingTime: 0,
        featuredPosts: 0
      };
    }
  }
}

export const firebasePostsService = new FirebasePostsService(); 