/**
 * Post Detail Page with Real-time Features
 * Displays individual posts with live comments and visitor tracking
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, Eye, Heart, Share2, ArrowLeft, Clock, Tag } from 'lucide-react';
import { firebasePostsService } from '../services/firebase/posts.service';
import { liveVisitorService } from '../services/realtime/LiveVisitorService';
import { LiveComments } from '../components/realtime/LiveComments';
import { LiveVisitorCounter } from '../components/realtime/LiveVisitorCounter';
import { ModernCard, ModernButton } from '../components/ModernDesignSystem';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  published: boolean;
  featured: boolean;
  imageUrl?: string;
  tags: string[];
  categories: string[];
  views: number;
  likes: number;
  commentCount: number;
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);

  // Load post data
  useEffect(() => {
    const loadPost = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const postData = await firebasePostsService.getPostById(id);
        
        if (postData) {
          setPost(postData);
          setLikes(postData.likes);
          
          // Track page view
          liveVisitorService.trackPageView();
          
          // Increment view count
          await firebasePostsService.incrementViews(id);
        } else {
          toast.error('Post not found');
        }
      } catch (error) {
        console.error('Error loading post:', error);
        toast.error('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [id]);

  // Handle like toggle
  const handleLike = async () => {
    if (!currentUser || !post) {
      toast.error('Please sign in to like posts');
      return;
    }

    try {
      // Optimistic update
      setLiked(!liked);
      setLikes(prev => liked ? prev - 1 : prev + 1);

      // Update in backend
      await firebasePostsService.toggleLike(post.id, currentUser.id);
      
      toast.success(liked ? 'Like removed' : 'Post liked!');
    } catch (error) {
      // Revert optimistic update
      setLiked(liked);
      setLikes(post.likes);
      toast.error('Failed to update like');
    }
  };

  // Handle share
  const handleShare = async () => {
    if (!post) return;

    const shareData = {
      title: post.title,
      text: post.excerpt,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share post');
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get reading time
  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readingTime} min read`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-low-contrast rounded w-3/4"></div>
            <div className="h-64 bg-low-contrast rounded"></div>
            <div className="space-y-4">
              <div className="h-4 bg-low-contrast rounded w-full"></div>
              <div className="h-4 bg-low-contrast rounded w-5/6"></div>
              <div className="h-4 bg-low-contrast rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-subtle py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-display mb-4 text-high-contrast">Post Not Found</h1>
          <p className="text-body-lg text-medium-contrast mb-8">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/blog">
            <ModernButton variant="default" intent="primary">
              Back to Blog
            </ModernButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="relative">
        {post.imageUrl && (
          <div className="h-96 overflow-hidden">
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
        )}
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`${post.imageUrl ? 'absolute bottom-8 left-4 right-4' : 'py-8'}`}>
            {/* Back Button */}
            <div className="mb-6">
              <Link
                to="/blog"
                className="inline-flex items-center space-x-2 text-medium-contrast hover:text-high-contrast transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Blog</span>
              </Link>
            </div>

            {/* Title */}
            <h1 className={`text-display font-bold mb-4 ${
              post.imageUrl ? 'text-white' : 'text-high-contrast'
            }`}>
              {post.title}
            </h1>

            {/* Metadata */}
            <div className={`flex flex-wrap items-center space-x-6 text-body-sm ${
              post.imageUrl ? 'text-white/90' : 'text-medium-contrast'
            }`}>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(post.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{getReadingTime(post.content)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>{post.views.toLocaleString()} views</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <ModernCard className="p-8 mb-8">
              {/* Tags and Categories */}
              {(post.categories.length > 0 || post.tags.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {post.categories.map((category, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-body-sm font-medium"
                    >
                      {category}
                    </span>
                  ))}
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-body-sm font-medium flex items-center"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Post Content */}
              <div 
                className="prose prose-lg max-w-none text-high-contrast leading-relaxed"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Actions */}
              <div className="flex items-center justify-between pt-8 border-t border-medium-contrast mt-8">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleLike}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      liked
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        : 'bg-low-contrast text-medium-contrast hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                    <span>{likes} {likes === 1 ? 'Like' : 'Likes'}</span>
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-2 px-4 py-2 bg-low-contrast text-medium-contrast hover:text-high-contrast rounded-lg transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>Share</span>
                  </button>
                </div>

                {/* Live Visitor Counter */}
                <LiveVisitorCounter
                  variant="compact"
                  showPresence={true}
                />
              </div>
            </ModernCard>

            {/* Live Comments */}
            <LiveComments
              postId={post.id}
              allowComments={true}
              allowReplies={true}
              moderationEnabled={false}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Live Activity */}
              <LiveVisitorCounter
                variant="full"
                showDetails={true}
                showPresence={true}
              />

              {/* Related Posts */}
              <ModernCard className="p-6">
                <h3 className="text-subtitle font-bold text-high-contrast mb-4">
                  Related Posts
                </h3>
                <div className="space-y-4">
                  {/* Placeholder for related posts */}
                  <div className="text-medium-contrast text-body-sm">
                    Related posts will be shown here based on categories and tags.
                  </div>
                </div>
              </ModernCard>

              {/* Post Stats */}
              <ModernCard className="p-6">
                <h3 className="text-subtitle font-bold text-high-contrast mb-4">
                  Post Statistics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-medium-contrast">Views:</span>
                    <span className="font-medium text-high-contrast">
                      {post.views.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-medium-contrast">Likes:</span>
                    <span className="font-medium text-high-contrast">
                      {likes}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-medium-contrast">Comments:</span>
                    <span className="font-medium text-high-contrast">
                      {post.commentCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-medium-contrast">Published:</span>
                    <span className="font-medium text-high-contrast">
                      {formatDate(post.createdAt).split(',')[0]}
                    </span>
                  </div>
                </div>
              </ModernCard>

              {/* Share Options */}
              <ModernCard className="p-6">
                <h3 className="text-subtitle font-bold text-high-contrast mb-4">
                  Share This Post
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`;
                      window.open(url, '_blank');
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <span>Share on Twitter</span>
                  </button>
                  <button
                    onClick={() => {
                      const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
                      window.open(url, '_blank');
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <span>Share on LinkedIn</span>
                  </button>
                  <button
                    onClick={() => {
                      const url = `https://wa.me/?text=${encodeURIComponent(`${post.title} - ${window.location.href}`)}`;
                      window.open(url, '_blank');
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <span>Share on WhatsApp</span>
                  </button>
                </div>
              </ModernCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 