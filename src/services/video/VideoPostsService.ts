/**
 * Video Posts Service
 * Extends the blog system to support video content with full integration
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { videoUploadService } from './VideoUploadService';
import { videoStreamingService } from './VideoStreamingService';
import { youtubeIntegrationService } from './YouTubeIntegrationService';

export interface VideoPost {
  id: string;
  type: 'video' | 'blog' | 'mixed';
  title: string;
  description: string;
  content?: string; // Rich text content for mixed posts
  
  // Video specific fields
  videoId?: string;
  videoUrl?: string;
  videoThumbnail?: string;
  videoDuration?: number;
  videoQualities?: string[];
  
  // External video fields
  externalVideoId?: string;
  externalVideoUrl?: string;
  externalPlatform?: 'youtube' | 'vimeo';
  
  // Post metadata
  author: string;
  authorId: string;
  authorAvatar?: string;
  publishedAt: Date;
  updatedAt: Date;
  published: boolean;
  featured: boolean;
  
  // Categorization
  categories: string[];
  tags: string[];
  
  // Engagement metrics
  views: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  
  // Video specific metrics
  watchTime: number;
  completionRate: number;
  averageWatchTime: number;
  
  // SEO and metadata
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  
  // Advanced features
  chapters?: VideoChapter[];
  subtitles?: SubtitleTrack[];
  relatedPosts?: string[];
  
  // Monetization
  monetized?: boolean;
  ageRestricted?: boolean;
  
  // Moderation
  moderationStatus: 'pending' | 'approved' | 'rejected';
  moderatedBy?: string;
  moderatedAt?: Date;
}

export interface VideoChapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  description?: string;
  thumbnail?: string;
}

export interface SubtitleTrack {
  id: string;
  language: string;
  label: string;
  url: string;
  default?: boolean;
}

export interface CreateVideoPostOptions {
  title: string;
  description: string;
  content?: string;
  categories: string[];
  tags: string[];
  published?: boolean;
  featured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  monetized?: boolean;
  ageRestricted?: boolean;
}

export interface VideoPostAnalytics {
  postId: string;
  title: string;
  publishedAt: Date;
  
  // View metrics
  totalViews: number;
  uniqueViews: number;
  viewsToday: number;
  viewsThisWeek: number;
  viewsThisMonth: number;
  
  // Engagement metrics
  totalLikes: number;
  totalDislikes: number;
  totalComments: number;
  totalShares: number;
  totalBookmarks: number;
  engagementRate: number;
  
  // Video specific metrics
  totalWatchTime: number;
  averageWatchTime: number;
  completionRate: number;
  retentionCurve: Array<{ time: number; percentage: number }>;
  
  // Traffic sources
  trafficSources: Array<{ source: string; views: number; percentage: number }>;
  
  // Geographic data
  topCountries: Array<{ country: string; views: number; percentage: number }>;
  
  // Device data
  deviceBreakdown: Array<{ device: string; views: number; percentage: number }>;
  
  // Quality preferences
  qualityDistribution: Array<{ quality: string; views: number; percentage: number }>;
  
  // Time-based analytics
  viewsByHour: Array<{ hour: number; views: number }>;
  viewsByDay: Array<{ day: string; views: number }>;
  
  // User behavior
  averageSessionDuration: number;
  bounceRate: number;
  returnViewers: number;
}

class VideoPostsService {
  private readonly COLLECTION_NAME = 'video_posts';
  
  /**
   * Create a new video post from uploaded video
   */
  public async createVideoPost(
    videoFile: File,
    options: CreateVideoPostOptions,
    userId: string,
    onProgress?: (progress: any) => void
  ): Promise<string> {
    try {
      // Upload video first
      const videoId = await videoUploadService.uploadVideo(videoFile, {
        userId,
        title: options.title,
        description: options.description,
        tags: options.tags,
        category: options.categories[0],
        privacy: options.published ? 'public' : 'private',
        enableTranscoding: true
      });

      // Get video metadata
      const videoSource = await videoStreamingService.getVideoSource(videoId);
      if (!videoSource) {
        throw new Error('Failed to get video metadata');
      }

      // Create video post
      const postData: Omit<VideoPost, 'id'> = {
        type: options.content ? 'mixed' : 'video',
        title: options.title,
        description: options.description,
        content: options.content,
        
        videoId,
        videoUrl: videoSource.streams[0]?.url,
        videoThumbnail: videoSource.thumbnail,
        videoDuration: videoSource.duration,
        videoQualities: videoSource.streams.map(s => s.quality),
        
        author: 'Current User', // Replace with actual user name
        authorId: userId,
        publishedAt: new Date(),
        updatedAt: new Date(),
        published: options.published || false,
        featured: options.featured || false,
        
        categories: options.categories,
        tags: options.tags,
        
        views: 0,
        likes: 0,
        dislikes: 0,
        comments: 0,
        shares: 0,
        bookmarks: 0,
        
        watchTime: 0,
        completionRate: 0,
        averageWatchTime: 0,
        
        seoTitle: options.seoTitle,
        seoDescription: options.seoDescription,
        seoKeywords: options.seoKeywords,
        
        monetized: options.monetized || false,
        ageRestricted: options.ageRestricted || false,
        
        moderationStatus: 'approved' // Auto-approve for now
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...postData,
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return docRef.id;

    } catch (error) {
      console.error('Error creating video post:', error);
      throw error;
    }
  }

  /**
   * Create video post from external video (YouTube/Vimeo)
   */
  public async createExternalVideoPost(
    externalVideoUrl: string,
    platform: 'youtube' | 'vimeo',
    options: CreateVideoPostOptions,
    userId: string
  ): Promise<string> {
    try {
      // Extract video ID from URL
      const videoId = this.extractVideoId(externalVideoUrl, platform);
      if (!videoId) {
        throw new Error('Invalid video URL');
      }

      // Get video metadata from platform
      let videoData;
      if (platform === 'youtube') {
        const videos = await youtubeIntegrationService.getYouTubeVideos(1);
        videoData = videos.find(v => v.id === videoId);
      } else {
        const videos = await youtubeIntegrationService.getVimeoVideos(1);
        videoData = videos.find(v => v.id === videoId);
      }

      if (!videoData) {
        throw new Error('Video not found on platform');
      }

      // Create video post
      const postData: Omit<VideoPost, 'id'> = {
        type: options.content ? 'mixed' : 'video',
        title: options.title || videoData.title,
        description: options.description || videoData.description,
        content: options.content,
        
        externalVideoId: videoId,
        externalVideoUrl: externalVideoUrl,
        externalPlatform: platform,
        videoThumbnail: videoData.thumbnail,
        videoDuration: videoData.duration,
        
        author: 'Current User', // Replace with actual user name
        authorId: userId,
        publishedAt: new Date(),
        updatedAt: new Date(),
        published: options.published || false,
        featured: options.featured || false,
        
        categories: options.categories,
        tags: options.tags,
        
        views: videoData.viewCount || 0,
        likes: videoData.likeCount || 0,
        dislikes: 0,
        comments: videoData.commentCount || 0,
        shares: 0,
        bookmarks: 0,
        
        watchTime: 0,
        completionRate: 0,
        averageWatchTime: 0,
        
        seoTitle: options.seoTitle,
        seoDescription: options.seoDescription,
        seoKeywords: options.seoKeywords,
        
        monetized: options.monetized || false,
        ageRestricted: options.ageRestricted || false,
        
        moderationStatus: 'approved'
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...postData,
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return docRef.id;

    } catch (error) {
      console.error('Error creating external video post:', error);
      throw error;
    }
  }

  /**
   * Get all video posts with filtering
   */
  public async getVideoPosts(options?: {
    limit?: number;
    category?: string;
    tag?: string;
    type?: 'video' | 'blog' | 'mixed';
    published?: boolean;
    featured?: boolean;
    authorId?: string;
  }): Promise<VideoPost[]> {
    try {
      let q = query(collection(db, this.COLLECTION_NAME));

      // Apply filters
      if (options?.published !== undefined) {
        q = query(q, where('published', '==', options.published));
      }

      if (options?.featured !== undefined) {
        q = query(q, where('featured', '==', options.featured));
      }

      if (options?.type) {
        q = query(q, where('type', '==', options.type));
      }

      if (options?.category) {
        q = query(q, where('categories', 'array-contains', options.category));
      }

      if (options?.tag) {
        q = query(q, where('tags', 'array-contains', options.tag));
      }

      if (options?.authorId) {
        q = query(q, where('authorId', '==', options.authorId));
      }

      // Order by published date
      q = query(q, orderBy('publishedAt', 'desc'));

      // Apply limit
      if (options?.limit) {
        q = query(q, limit(options.limit));
      }

      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        publishedAt: doc.data().publishedAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        moderatedAt: doc.data().moderatedAt?.toDate()
      } as VideoPost));

    } catch (error) {
      console.error('Error getting video posts:', error);
      return [];
    }
  }

  /**
   * Get video post by ID
   */
  public async getVideoPost(postId: string): Promise<VideoPost | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, postId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        publishedAt: data.publishedAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        moderatedAt: data.moderatedAt?.toDate()
      } as VideoPost;

    } catch (error) {
      console.error('Error getting video post:', error);
      return null;
    }
  }

  /**
   * Update video post
   */
  public async updateVideoPost(
    postId: string,
    updates: Partial<VideoPost>
  ): Promise<boolean> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, postId);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      return true;

    } catch (error) {
      console.error('Error updating video post:', error);
      return false;
    }
  }

  /**
   * Delete video post
   */
  public async deleteVideoPost(postId: string): Promise<boolean> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, postId);
      await deleteDoc(docRef);
      return true;

    } catch (error) {
      console.error('Error deleting video post:', error);
      return false;
    }
  }

  /**
   * Increment view count
   */
  public async incrementViews(postId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, postId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const currentViews = docSnap.data().views || 0;
        await updateDoc(docRef, {
          views: currentViews + 1,
          updatedAt: serverTimestamp()
        });
      }

    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  }

  /**
   * Toggle like on video post
   */
  public async toggleLike(postId: string, userId: string): Promise<boolean> {
    try {
      // Check if user already liked this post
      const likesQuery = query(
        collection(db, 'video_post_likes'),
        where('postId', '==', postId),
        where('userId', '==', userId)
      );

      const likesSnapshot = await getDocs(likesQuery);
      const hasLiked = !likesSnapshot.empty;

      if (hasLiked) {
        // Remove like
        await deleteDoc(likesSnapshot.docs[0].ref);
        
        // Decrement like count
        const postRef = doc(db, this.COLLECTION_NAME, postId);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
          const currentLikes = postSnap.data().likes || 0;
          await updateDoc(postRef, {
            likes: Math.max(0, currentLikes - 1)
          });
        }
        
        return false;

      } else {
        // Add like
        await addDoc(collection(db, 'video_post_likes'), {
          postId,
          userId,
          createdAt: serverTimestamp()
        });

        // Increment like count
        const postRef = doc(db, this.COLLECTION_NAME, postId);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
          const currentLikes = postSnap.data().likes || 0;
          await updateDoc(postRef, {
            likes: currentLikes + 1
          });
        }
        
        return true;
      }

    } catch (error) {
      console.error('Error toggling like:', error);
      return false;
    }
  }

  /**
   * Get video post analytics
   */
  public async getPostAnalytics(postId: string, days: number = 30): Promise<VideoPostAnalytics | null> {
    try {
      const post = await this.getVideoPost(postId);
      if (!post) {
        return null;
      }

      // Fetch analytics data from various sources
      const [viewsData, engagementData, videoAnalytics] = await Promise.all([
        this.getViewsAnalytics(postId, days),
        this.getEngagementAnalytics(postId, days),
        post.videoId ? videoStreamingService.getVideoAnalytics(post.videoId) : null
      ]);

      return {
        postId,
        title: post.title,
        publishedAt: post.publishedAt,
        
        totalViews: post.views,
        uniqueViews: viewsData.uniqueViews,
        viewsToday: viewsData.today,
        viewsThisWeek: viewsData.thisWeek,
        viewsThisMonth: viewsData.thisMonth,
        
        totalLikes: post.likes,
        totalDislikes: post.dislikes,
        totalComments: post.comments,
        totalShares: post.shares,
        totalBookmarks: post.bookmarks,
        engagementRate: this.calculateEngagementRate(post),
        
        totalWatchTime: post.watchTime,
        averageWatchTime: post.averageWatchTime,
        completionRate: post.completionRate,
        retentionCurve: videoAnalytics?.audienceRetention || [],
        
        trafficSources: engagementData.trafficSources,
        topCountries: videoAnalytics?.topCountries || [],
        deviceBreakdown: videoAnalytics?.topDevices || [],
        qualityDistribution: videoAnalytics?.qualityDistribution || [],
        
        viewsByHour: viewsData.byHour,
        viewsByDay: viewsData.byDay,
        
        averageSessionDuration: viewsData.averageSessionDuration,
        bounceRate: viewsData.bounceRate,
        returnViewers: viewsData.returnViewers
      };

    } catch (error) {
      console.error('Error getting post analytics:', error);
      return null;
    }
  }

  /**
   * Get trending video posts
   */
  public async getTrendingPosts(limit: number = 10): Promise<VideoPost[]> {
    try {
      // Get posts from last 7 days sorted by engagement
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('published', '==', true),
        where('publishedAt', '>=', sevenDaysAgo),
        orderBy('publishedAt', 'desc'),
        limit(limit * 2) // Get more to sort by engagement
      );

      const snapshot = await getDocs(q);
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        publishedAt: doc.data().publishedAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as VideoPost));

      // Sort by engagement score
      return posts
        .sort((a, b) => this.calculateEngagementScore(b) - this.calculateEngagementScore(a))
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting trending posts:', error);
      return [];
    }
  }

  /**
   * Search video posts
   */
  public async searchPosts(searchTerm: string, options?: {
    limit?: number;
    type?: 'video' | 'blog' | 'mixed';
    category?: string;
  }): Promise<VideoPost[]> {
    try {
      // This is a simplified search - in production, use a proper search service
      let q = query(
        collection(db, this.COLLECTION_NAME),
        where('published', '==', true)
      );

      if (options?.type) {
        q = query(q, where('type', '==', options.type));
      }

      if (options?.category) {
        q = query(q, where('categories', 'array-contains', options.category));
      }

      q = query(q, orderBy('publishedAt', 'desc'));

      if (options?.limit) {
        q = query(q, limit(options.limit));
      }

      const snapshot = await getDocs(q);
      const allPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        publishedAt: doc.data().publishedAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as VideoPost));

      // Filter by search term (title, description, tags)
      const searchTermLower = searchTerm.toLowerCase();
      return allPosts.filter(post => 
        post.title.toLowerCase().includes(searchTermLower) ||
        post.description.toLowerCase().includes(searchTermLower) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTermLower)) ||
        post.categories.some(cat => cat.toLowerCase().includes(searchTermLower))
      );

    } catch (error) {
      console.error('Error searching posts:', error);
      return [];
    }
  }

  // Private helper methods

  private extractVideoId(url: string, platform: 'youtube' | 'vimeo'): string | null {
    if (platform === 'youtube') {
      const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = url.match(regex);
      return match ? match[1] : null;
    } else {
      const regex = /(?:vimeo\.com\/)([0-9]+)/;
      const match = url.match(regex);
      return match ? match[1] : null;
    }
  }

  private calculateEngagementRate(post: VideoPost): number {
    if (post.views === 0) return 0;
    
    const totalEngagement = post.likes + post.comments + post.shares + post.bookmarks;
    return (totalEngagement / post.views) * 100;
  }

  private calculateEngagementScore(post: VideoPost): number {
    const weights = {
      views: 1,
      likes: 3,
      comments: 5,
      shares: 4,
      bookmarks: 2,
      completionRate: 10
    };

    return (
      post.views * weights.views +
      post.likes * weights.likes +
      post.comments * weights.comments +
      post.shares * weights.shares +
      post.bookmarks * weights.bookmarks +
      post.completionRate * weights.completionRate
    );
  }

  private async getViewsAnalytics(postId: string, days: number): Promise<any> {
    // Simplified implementation - in production, use proper analytics service
    return {
      uniqueViews: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      byHour: [],
      byDay: [],
      averageSessionDuration: 0,
      bounceRate: 0,
      returnViewers: 0
    };
  }

  private async getEngagementAnalytics(postId: string, days: number): Promise<any> {
    // Simplified implementation - in production, use proper analytics service
    return {
      trafficSources: []
    };
  }
}

// Export singleton instance
export const videoPostsService = new VideoPostsService(); 