/**
 * Live Comment Service
 * Real-time comment system with live updates, mentions, and moderation
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

import { webSocketService } from './WebSocketService';
import { notificationService } from './NotificationService';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface Comment {
  id: string;
  postId: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  parentId?: string;
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  replies: Comment[];
  isEdited: boolean;
  isDeleted: boolean;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    location?: string;
  };
}

export interface CommentDraft {
  postId: string;
  content: string;
  parentId?: string;
  authorId: string;
}

export interface CommentStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  todayCount: number;
}

export interface TypingUser {
  userId: string;
  userName: string;
  postId: string;
  timestamp: Date;
}

class LiveCommentService {
  private comments: Map<string, Comment[]> = new Map();
  private subscribers: Map<string, Set<(comments: Comment[]) => void>> = new Map();
  private typingUsers: Map<string, Set<TypingUser>> = new Map();
  private typingSubscribers: Map<string, Set<(users: TypingUser[]) => void>> = new Map();
  private typingTimer: Map<string, NodeJS.Timeout> = new Map();
  private unsubscribers: Map<string, () => void> = new Map();

  constructor() {
    this.initWebSocketListeners();
  }

  /**
   * Initialize WebSocket listeners for real-time events
   */
  private initWebSocketListeners(): void {
    webSocketService.subscribe('comment_added', (data) => {
      this.handleCommentAdded(data);
    });

    webSocketService.subscribe('comment_updated', (data) => {
      this.handleCommentUpdated(data);
    });

    webSocketService.subscribe('comment_deleted', (data) => {
      this.handleCommentDeleted(data);
    });

    webSocketService.subscribe('comment_liked', (data) => {
      this.handleCommentLiked(data);
    });

    webSocketService.subscribe('user_typing', (data) => {
      this.handleUserTyping(data);
    });

    webSocketService.subscribe('user_stopped_typing', (data) => {
      this.handleUserStoppedTyping(data);
    });

    webSocketService.subscribe('comment_moderated', (data) => {
      this.handleCommentModerated(data);
    });
  }

  /**
   * Subscribe to real-time comments for a post
   */
  public subscribeToComments(postId: string, callback: (comments: Comment[]) => void): () => void {
    // Add subscriber
    if (!this.subscribers.has(postId)) {
      this.subscribers.set(postId, new Set());
    }
    this.subscribers.get(postId)!.add(callback);

    // Set up Firestore listener if not already active
    if (!this.unsubscribers.has(postId)) {
      this.setupFirestoreListener(postId);
    }

    // Send current comments immediately
    const currentComments = this.comments.get(postId) || [];
    callback(currentComments);

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(postId);
      if (subscribers) {
        subscribers.delete(callback);
        
        // If no more subscribers, cleanup
        if (subscribers.size === 0) {
          this.cleanupPostSubscription(postId);
        }
      }
    };
  }

  /**
   * Subscribe to typing indicators for a post
   */
  public subscribeToTyping(postId: string, callback: (users: TypingUser[]) => void): () => void {
    if (!this.typingSubscribers.has(postId)) {
      this.typingSubscribers.set(postId, new Set());
    }
    this.typingSubscribers.get(postId)!.add(callback);

    // Send current typing users
    const typingUsers = Array.from(this.typingUsers.get(postId) || []);
    callback(typingUsers);

    return () => {
      const subscribers = this.typingSubscribers.get(postId);
      if (subscribers) {
        subscribers.delete(callback);
      }
    };
  }

  /**
   * Add a new comment
   */
  public async addComment(draft: CommentDraft): Promise<string> {
    try {
      // Validate content
      this.validateComment(draft.content);

      // Extract mentions
      const mentions = this.extractMentions(draft.content);

      // Prepare comment data
      const commentData = {
        postId: draft.postId,
        content: draft.content,
        authorId: draft.authorId,
        parentId: draft.parentId || null,
        mentions,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        isEdited: false,
        isDeleted: false,
        moderationStatus: 'approved', // Auto-approve for now, can add moderation later
        metadata: {
          ipAddress: await this.getCurrentIP(),
          userAgent: navigator.userAgent,
          location: await this.getCurrentLocation()
        }
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'comments'), commentData);

      // Broadcast via WebSocket
      webSocketService.send('comment_add', {
        id: docRef.id,
        ...commentData,
        timestamp: Date.now()
      });

      // Send notifications for mentions
      await this.notifyMentions(mentions, draft.postId, draft.authorId);

      // Stop typing indicator
      this.stopTyping(draft.postId, draft.authorId);

      return docRef.id;

    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Update an existing comment
   */
  public async updateComment(commentId: string, content: string, userId: string): Promise<void> {
    try {
      this.validateComment(content);

      const mentions = this.extractMentions(content);

      await updateDoc(doc(db, 'comments', commentId), {
        content,
        mentions,
        updatedAt: serverTimestamp(),
        isEdited: true
      });

      // Broadcast update
      webSocketService.send('comment_update', {
        id: commentId,
        content,
        mentions,
        isEdited: true,
        updatedAt: Date.now(),
        userId
      });

      // Send notifications for new mentions
      await this.notifyMentions(mentions, '', userId);

    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  /**
   * Delete a comment
   */
  public async deleteComment(commentId: string, userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'comments', commentId), {
        isDeleted: true,
        updatedAt: serverTimestamp()
      });

      // Broadcast deletion
      webSocketService.send('comment_delete', {
        id: commentId,
        userId,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Like/unlike a comment
   */
  public async toggleLike(commentId: string, userId: string): Promise<void> {
    try {
      // In a real implementation, you'd track individual likes
      // For now, we'll just increment/decrement the count
      const commentRef = doc(db, 'comments', commentId);
      
      // This is simplified - in production you'd check if user already liked
      const likeDoc = await getDocs(query(
        collection(db, 'comment_likes'),
        where('commentId', '==', commentId),
        where('userId', '==', userId)
      ));

      let isLiking = true;
      if (!likeDoc.empty) {
        // Remove like
        await deleteDoc(likeDoc.docs[0].ref);
        isLiking = false;
      } else {
        // Add like
        await addDoc(collection(db, 'comment_likes'), {
          commentId,
          userId,
          createdAt: serverTimestamp()
        });
      }

      // Update comment like count
      const likesQuery = await getDocs(query(
        collection(db, 'comment_likes'),
        where('commentId', '==', commentId)
      ));

      await updateDoc(commentRef, {
        likes: likesQuery.size
      });

      // Broadcast like update
      webSocketService.send('comment_like', {
        id: commentId,
        userId,
        likes: likesQuery.size,
        isLiking,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Error toggling comment like:', error);
      throw error;
    }
  }

  /**
   * Start typing indicator
   */
  public startTyping(postId: string, userId: string, userName: string): void {
    // Clear existing timer
    const timerKey = `${postId}_${userId}`;
    if (this.typingTimer.has(timerKey)) {
      clearTimeout(this.typingTimer.get(timerKey)!);
    }

    // Add to typing users
    if (!this.typingUsers.has(postId)) {
      this.typingUsers.set(postId, new Set());
    }

    const typingUser: TypingUser = {
      userId,
      userName,
      postId,
      timestamp: new Date()
    };

    this.typingUsers.get(postId)!.add(typingUser);

    // Broadcast typing
    webSocketService.send('user_typing', {
      postId,
      userId,
      userName,
      timestamp: Date.now()
    });

    // Notify subscribers
    this.notifyTypingSubscribers(postId);

    // Auto-stop typing after 3 seconds
    this.typingTimer.set(timerKey, setTimeout(() => {
      this.stopTyping(postId, userId);
    }, 3000));
  }

  /**
   * Stop typing indicator
   */
  public stopTyping(postId: string, userId: string): void {
    const timerKey = `${postId}_${userId}`;
    
    // Clear timer
    if (this.typingTimer.has(timerKey)) {
      clearTimeout(this.typingTimer.get(timerKey)!);
      this.typingTimer.delete(timerKey);
    }

    // Remove from typing users
    const typingSet = this.typingUsers.get(postId);
    if (typingSet) {
      const toRemove = Array.from(typingSet).find(u => u.userId === userId);
      if (toRemove) {
        typingSet.delete(toRemove);
      }
    }

    // Broadcast stop typing
    webSocketService.send('user_stopped_typing', {
      postId,
      userId,
      timestamp: Date.now()
    });

    // Notify subscribers
    this.notifyTypingSubscribers(postId);
  }

  /**
   * Get comment statistics
   */
  public async getCommentStats(postId?: string): Promise<CommentStats> {
    try {
      let commentsQuery = collection(db, 'comments');
      
      if (postId) {
        commentsQuery = query(commentsQuery, where('postId', '==', postId)) as any;
      }

      const snapshot = await getDocs(commentsQuery);
      const comments = snapshot.docs.map(doc => doc.data());

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return {
        total: comments.length,
        approved: comments.filter(c => c.moderationStatus === 'approved').length,
        pending: comments.filter(c => c.moderationStatus === 'pending').length,
        rejected: comments.filter(c => c.moderationStatus === 'rejected').length,
        todayCount: comments.filter(c => {
          const createdAt = c.createdAt?.toDate() || new Date(0);
          return createdAt >= today;
        }).length
      };

    } catch (error) {
      console.error('Error getting comment stats:', error);
      return {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        todayCount: 0
      };
    }
  }

  /**
   * Moderate a comment (admin only)
   */
  public async moderateComment(commentId: string, status: 'approved' | 'rejected', moderatorId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'comments', commentId), {
        moderationStatus: status,
        moderatedAt: serverTimestamp(),
        moderatedBy: moderatorId
      });

      // Broadcast moderation
      webSocketService.send('comment_moderate', {
        id: commentId,
        status,
        moderatorId,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Error moderating comment:', error);
      throw error;
    }
  }

  // Private helper methods

  private setupFirestoreListener(postId: string): void {
    const commentsQuery = query(
      collection(db, 'comments'),
      where('postId', '==', postId),
      where('isDeleted', '==', false),
      where('moderationStatus', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const comments: Comment[] = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const comment: Comment = {
          id: doc.id,
          postId: data.postId,
          content: data.content,
          author: {
            id: data.authorId,
            name: data.authorName || 'Anonymous',
            avatar: data.authorAvatar,
            role: data.authorRole
          },
          parentId: data.parentId,
          mentions: data.mentions || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          likes: data.likes || 0,
          replies: [],
          isEdited: data.isEdited || false,
          isDeleted: data.isDeleted || false,
          moderationStatus: data.moderationStatus || 'pending',
          metadata: data.metadata || {}
        };
        
        comments.push(comment);
      });

      // Organize replies
      const organizedComments = this.organizeComments(comments);
      
      // Update cache
      this.comments.set(postId, organizedComments);
      
      // Notify subscribers
      this.notifyCommentSubscribers(postId, organizedComments);
    });

    this.unsubscribers.set(postId, unsubscribe);
  }

  private organizeComments(comments: Comment[]): Comment[] {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create comment map
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: organize hierarchy
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      
      if (comment.parentId && commentMap.has(comment.parentId)) {
        const parent = commentMap.get(comment.parentId)!;
        parent.replies.push(commentWithReplies);
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  }

  private validateComment(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new Error('Comment content cannot be empty');
    }

    if (content.length > 1000) {
      throw new Error('Comment content is too long (max 1000 characters)');
    }

    // Basic content moderation
    const prohibitedWords = ['spam', 'abuse']; // Expand this list
    const lowerContent = content.toLowerCase();
    
    for (const word of prohibitedWords) {
      if (lowerContent.includes(word)) {
        throw new Error('Comment contains prohibited content');
      }
    }
  }

  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  private async notifyMentions(mentions: string[], postId: string, authorId: string): Promise<void> {
    for (const mention of mentions) {
      // In production, you'd look up the user by username
      // For now, we'll just create a notification
      notificationService.show({
        type: 'mention',
        title: 'You were mentioned',
        message: `Someone mentioned you in a comment`,
        category: 'engagement',
        priority: 'normal',
        persistent: false,
        actionUrl: `/blog/${postId}#comments`
      });
    }
  }

  private notifyCommentSubscribers(postId: string, comments: Comment[]): void {
    const subscribers = this.subscribers.get(postId);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(comments);
        } catch (error) {
          console.error('Error notifying comment subscriber:', error);
        }
      });
    }
  }

  private notifyTypingSubscribers(postId: string): void {
    const subscribers = this.typingSubscribers.get(postId);
    if (subscribers) {
      const typingUsers = Array.from(this.typingUsers.get(postId) || []);
      subscribers.forEach(callback => {
        try {
          callback(typingUsers);
        } catch (error) {
          console.error('Error notifying typing subscriber:', error);
        }
      });
    }
  }

  private cleanupPostSubscription(postId: string): void {
    // Remove from maps
    this.subscribers.delete(postId);
    this.comments.delete(postId);
    this.typingUsers.delete(postId);
    this.typingSubscribers.delete(postId);

    // Unsubscribe from Firestore
    const unsubscribe = this.unsubscribers.get(postId);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribers.delete(postId);
    }

    // Clear typing timers
    this.typingTimer.forEach((timer, key) => {
      if (key.startsWith(postId)) {
        clearTimeout(timer);
        this.typingTimer.delete(key);
      }
    });
  }

  // WebSocket event handlers

  private handleCommentAdded(data: any): void {
    // This would be handled by the Firestore listener
    // But we can use it for immediate UI updates if needed
  }

  private handleCommentUpdated(data: any): void {
    // Update comment in cache if it exists
    for (const [postId, comments] of this.comments) {
      const updated = this.updateCommentInList(comments, data.id, data);
      if (updated) {
        this.notifyCommentSubscribers(postId, comments);
        break;
      }
    }
  }

  private handleCommentDeleted(data: any): void {
    // Remove comment from cache
    for (const [postId, comments] of this.comments) {
      const removed = this.removeCommentFromList(comments, data.id);
      if (removed) {
        this.notifyCommentSubscribers(postId, comments);
        break;
      }
    }
  }

  private handleCommentLiked(data: any): void {
    // Update like count in cache
    for (const [postId, comments] of this.comments) {
      const updated = this.updateCommentInList(comments, data.id, { likes: data.likes });
      if (updated) {
        this.notifyCommentSubscribers(postId, comments);
        break;
      }
    }
  }

  private handleUserTyping(data: any): void {
    if (!this.typingUsers.has(data.postId)) {
      this.typingUsers.set(data.postId, new Set());
    }

    const typingUser: TypingUser = {
      userId: data.userId,
      userName: data.userName,
      postId: data.postId,
      timestamp: new Date(data.timestamp)
    };

    this.typingUsers.get(data.postId)!.add(typingUser);
    this.notifyTypingSubscribers(data.postId);
  }

  private handleUserStoppedTyping(data: any): void {
    const typingSet = this.typingUsers.get(data.postId);
    if (typingSet) {
      const toRemove = Array.from(typingSet).find(u => u.userId === data.userId);
      if (toRemove) {
        typingSet.delete(toRemove);
        this.notifyTypingSubscribers(data.postId);
      }
    }
  }

  private handleCommentModerated(data: any): void {
    // Update moderation status in cache
    for (const [postId, comments] of this.comments) {
      const updated = this.updateCommentInList(comments, data.id, { 
        moderationStatus: data.status 
      });
      if (updated) {
        this.notifyCommentSubscribers(postId, comments);
        break;
      }
    }
  }

  private updateCommentInList(comments: Comment[], commentId: string, updates: any): boolean {
    for (const comment of comments) {
      if (comment.id === commentId) {
        Object.assign(comment, updates);
        return true;
      }
      if (this.updateCommentInList(comment.replies, commentId, updates)) {
        return true;
      }
    }
    return false;
  }

  private removeCommentFromList(comments: Comment[], commentId: string): boolean {
    for (let i = 0; i < comments.length; i++) {
      if (comments[i].id === commentId) {
        comments.splice(i, 1);
        return true;
      }
      if (this.removeCommentFromList(comments[i].replies, commentId)) {
        return true;
      }
    }
    return false;
  }

  private async getCurrentIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  private async getCurrentLocation(): Promise<string> {
    try {
      // This is simplified - in production you'd use a proper geolocation API
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return `${data.city}, ${data.country_name}`;
    } catch {
      return 'unknown';
    }
  }
}

// Export singleton instance
export const liveCommentService = new LiveCommentService(); 