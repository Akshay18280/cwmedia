import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment,
  serverTimestamp,
  type DocumentReference,
  startAfter,
  type QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { FirebasePost } from '../../types/firebase';
import type { Post } from '../../types';

class FirebasePostsService {
  private readonly collection = collection(db, 'posts');

  // ===== REAL PRODUCTION POSTS ONLY =====
  // No sample, demo, or fake posts in production

  // Create a new blog post
  async createPost(postData: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'views' | 'likes'>): Promise<string> {
    const firebasePost: Omit<FirebasePost, 'id'> = {
      title: postData.title,
      slug: postData.slug,
      excerpt: postData.excerpt,
      content: postData.content,
      author_id: postData.author_id,
      status: postData.status || 'draft',
      tags: postData.tags || [],
      categories: postData.categories || [],
      featured_image: postData.featured_image || '',
      views: 0,
      likes: 0,
      published_at: postData.status === 'published' ? serverTimestamp() : null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const docRef = await addDoc(this.collection, firebasePost);
    return docRef.id;
  }

  // Update post (admin only)
  async updatePost(postId: string, updates: Partial<FirebasePost>): Promise<void> {
    try {
      const docRef = doc(db, 'posts', postId);
      await updateDoc(docRef, {
        ...updates,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  // Delete post (admin only)
  async deletePost(postId: string): Promise<void> {
    try {
      const docRef = doc(db, 'posts', postId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  // Get all categories
  async getCategories(): Promise<string[]> {
    try {
      const postsCollection = collection(db, 'posts');
      const q = query(
        postsCollection,
        where('status', '==', 'published')
      );
      
      const snapshot = await getDocs(q);
      const categorySet = new Set<string>();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data() as FirebasePost;
        data.categories.forEach(category => categorySet.add(category));
      });
      
      return Array.from(categorySet).sort();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // Get all tags
  async getTags(): Promise<string[]> {
    try {
      const postsCollection = collection(db, 'posts');
      const q = query(
        postsCollection,
        where('status', '==', 'published')
      );
      
      const snapshot = await getDocs(q);
      const tagSet = new Set<string>();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data() as FirebasePost;
        data.tags.forEach(tag => tagSet.add(tag));
      });
      
      return Array.from(tagSet).sort();
    } catch (error) {
      console.error('Error fetching tags:', error);
      return [];
    }
  }

  // Get all published posts
  async getAllPosts(): Promise<Post[]> {
    try {
      const postsCollection = collection(db, 'posts');
      const q = query(
        postsCollection,
        where('status', '==', 'published'),
        orderBy('published_at', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.convertToPost(doc));
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  }

  // Get featured posts
  async getFeaturedPosts(limitCount: number = 3): Promise<Post[]> {
    try {
      const postsCollection = collection(db, 'posts');
      const q = query(
        postsCollection,
        where('status', '==', 'published'),
        where('featured', '==', true),
        orderBy('published_at', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.convertToPost(doc));
    } catch (error) {
      console.error('Error fetching featured posts:', error);
      return [];
    }
  }

  // Get post by slug
  async getPostBySlug(slug: string): Promise<Post | null> {
    try {
      const postsCollection = collection(db, 'posts');
      const q = query(
        postsCollection,
        where('slug', '==', slug),
        where('status', '==', 'published')
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }
      
      const post = this.convertToPost(snapshot.docs[0]);
      
      // Increment view count
      await this.incrementViews(snapshot.docs[0].id);
      
      return post;
    } catch (error) {
      console.error('Error fetching post by slug:', error);
      return null;
    }
  }

  // Get post by ID
  async getPostById(id: string): Promise<Post | null> {
    try {
      const docRef = doc(db, 'posts', id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return this.convertToPost(docSnap);
    } catch (error) {
      console.error('Error fetching post by ID:', error);
      return null;
    }
  }

  // Search posts
  async searchPosts(searchTerm: string): Promise<Post[]> {
    try {
      const postsCollection = collection(db, 'posts');
      const q = query(
        postsCollection,
        where('status', '==', 'published'),
        orderBy('published_at', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const allPosts = snapshot.docs.map(doc => this.convertToPost(doc));
      
      // Simple text search (in production, use Algolia or Elasticsearch)
      const searchTermLower = searchTerm.toLowerCase();
      return allPosts.filter(post => 
        post.title.toLowerCase().includes(searchTermLower) ||
        post.excerpt.toLowerCase().includes(searchTermLower) ||
        post.content.toLowerCase().includes(searchTermLower) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTermLower))
      );
    } catch (error) {
      console.error('Error searching posts:', error);
      return [];
    }
  }

  // Get posts by category
  async getPostsByCategory(category: string): Promise<Post[]> {
    try {
      const postsCollection = collection(db, 'posts');
      const q = query(
        postsCollection,
        where('status', '==', 'published'),
        where('categories', 'array-contains', category),
        orderBy('published_at', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.convertToPost(doc));
    } catch (error) {
      console.error('Error fetching posts by category:', error);
      return [];
    }
  }

  // Get posts by tag
  async getPostsByTag(tag: string): Promise<Post[]> {
    try {
      const postsCollection = collection(db, 'posts');
      const q = query(
        postsCollection,
        where('status', '==', 'published'),
        where('tags', 'array-contains', tag),
        orderBy('published_at', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.convertToPost(doc));
    } catch (error) {
      console.error('Error fetching posts by tag:', error);
      return [];
    }
  }

  // Increment post views
  async incrementViews(postId: string): Promise<void> {
    try {
      const docRef = doc(db, 'posts', postId);
      await updateDoc(docRef, {
        views: increment(1)
      });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  }

  // Increment post likes
  async incrementLikes(postId: string): Promise<void> {
    try {
      const docRef = doc(db, 'posts', postId);
      await updateDoc(docRef, {
        likes: increment(1)
      });
    } catch (error) {
      console.error('Error incrementing likes:', error);
    }
  }

  // Convert Firestore document to Post interface
  private convertToPost(doc: QueryDocumentSnapshot<FirebasePost>): Post {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      author_id: data.author_id,
      author_name: data.author_name, // Assuming author_name is part of FirebasePost or needs to be fetched
      author_image: data.author_image,
      featured_image: data.featured_image,
      tags: data.tags,
      categories: data.categories,
      status: data.status,
      featured: data.featured, // Assuming featured is part of FirebasePost or needs to be fetched
      views: data.views,
      likes: data.likes,
      reading_time: data.reading_time, // Assuming reading_time is part of FirebasePost or needs to be fetched
      created_at: data.created_at.toDate().toISOString(),
      updated_at: data.updated_at.toDate().toISOString(),
      published_at: data.published_at?.toDate().toISOString()
    };
  }
}

export const firebasePostsService = new FirebasePostsService(); 