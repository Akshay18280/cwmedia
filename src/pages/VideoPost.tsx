/**
 * Video Post Page
 * Complete video post display with player, analytics, and live features
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, Eye, Heart, Share2, ArrowLeft, Clock, Tag, Play, ExternalLink, Youtube } from 'lucide-react';
import { videoPostsService, VideoPost as VideoPostType } from '../services/video/VideoPostsService';
import { videoAnalyticsService } from '../services/video/VideoAnalyticsService';
import { AdvancedVideoPlayer } from '../components/video/AdvancedVideoPlayer';
import { LiveComments } from '../components/realtime/LiveComments';
import { LiveVisitorCounter } from '../components/realtime/LiveVisitorCounter';
import { ModernCard, ModernButton } from '../components/ModernDesignSystem';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function VideoPost() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const [post, setPost] = useState<VideoPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [analyticsSession, setAnalyticsSession] = useState<string>('');

  // Load post data
  useEffect(() => {
    const loadPost = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const postData = await videoPostsService.getVideoPost(id);
        
        if (postData) {
          setPost(postData);
          
          // Increment view count
          await videoPostsService.incrementViews(id);
          
          // Start analytics session for native videos
          if (postData.videoId) {
            const sessionId = videoAnalyticsService.startViewSession(
              postData.videoId,
              currentUser?.id,
              postData.id
            );
            setAnalyticsSession(sessionId);
          }
        } else {
          toast.error('Video post not found');
        }
      } catch (error) {
        console.error('Error loading video post:', error);
        toast.error('Failed to load video post');
      } finally {
        setLoading(false);
      }
    };

    loadPost();

    // Cleanup analytics session on unmount
    return () => {
      if (analyticsSession) {
        videoAnalyticsService.endViewSession(analyticsSession);
      }
    };
  }, [id, currentUser?.id]);

  // Handle analytics events
  const handleTimeUpdate = (currentTime: number, duration: number) => {
    if (analyticsSession) {
      videoAnalyticsService.updateViewSession(analyticsSession, {
        duration,
        watchTime: currentTime
      });
    }
  };

  const handlePlayStateChange = (playing: boolean) => {
    if (post?.videoId) {
      videoAnalyticsService.trackEvent(
        post.videoId,
        playing ? 'play' : 'pause',
        { currentTime: 0 }, // Would get actual time from player
        currentUser?.id,
        post.id
      );
    }
  };

  // Handle like toggle
  const handleLike = async () => {
    if (!currentUser || !post) {
      toast.error('Please sign in to like posts');
      return;
    }

    try {
      const isLiked = await videoPostsService.toggleLike(post.id, currentUser.id);
      setLiked(isLiked);
      
      // Update post like count
      setPost(prev => prev ? {
        ...prev,
        likes: isLiked ? prev.likes + 1 : Math.max(0, prev.likes - 1)
      } : null);

      // Track analytics event
      if (post.videoId) {
        videoAnalyticsService.trackEvent(
          post.videoId,
          isLiked ? 'like' : 'unlike',
          {},
          currentUser.id,
          post.id
        );
      }

      toast.success(isLiked ? 'Post liked!' : 'Like removed');
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  // Handle share
  const handleShare = async () => {
    if (!post) return;

    const shareData = {
      title: post.title,
      text: post.description,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }

      // Track analytics event
      if (post.videoId) {
        videoAnalyticsService.trackEvent(
          post.videoId,
          'share',
          { method: navigator.share ? 'native' : 'clipboard' },
          currentUser?.id,
          post.id
        );
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

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-low-contrast rounded w-3/4"></div>
            <div className="aspect-video bg-low-contrast rounded-lg"></div>
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-display mb-4 text-high-contrast">Video Post Not Found</h1>
          <p className="text-body-lg text-medium-contrast mb-8">
            The video post you're looking for doesn't exist or has been removed.
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
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Title and Metadata */}
        <div className="mb-8">
          <h1 className="text-display font-bold mb-4 text-high-contrast">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center space-x-6 text-body-sm text-medium-contrast mb-6">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(post.publishedAt)}</span>
            </div>
            {post.videoDuration && (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(post.videoDuration)}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>{post.views.toLocaleString()} views</span>
            </div>
          </div>

          {/* Categories and Tags */}
          {(post.categories.length > 0 || post.tags.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-6">
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
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Video Player */}
            <div className="mb-8">
              {post.videoId ? (
                // Native video with advanced player
                <AdvancedVideoPlayer
                  videoId={post.videoId}
                  poster={post.videoThumbnail}
                  enableAnalytics={true}
                  enableSocialFeatures={true}
                  enableDownload={false}
                  onTimeUpdate={handleTimeUpdate}
                  onPlayStateChange={handlePlayStateChange}
                  className="w-full aspect-video"
                />
              ) : post.externalVideoUrl ? (
                // External video embed
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  {post.externalPlatform === 'youtube' ? (
                    <iframe
                      src={post.externalVideoUrl.replace('watch?v=', 'embed/')}
                      title={post.title}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  ) : (
                    <iframe
                      src={post.externalVideoUrl}
                      title={post.title}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  )}
                  
                  {/* External video overlay */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center space-x-2 text-white">
                      {post.externalPlatform === 'youtube' ? (
                        <Youtube className="w-4 h-4 text-red-500" />
                      ) : (
                        <Play className="w-4 h-4 text-green-500" />
                      )}
                      <span className="text-body-sm font-medium capitalize">
                        {post.externalPlatform}
                      </span>
                      <a
                        href={post.externalVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                // Fallback if no video
                <div className="aspect-video bg-low-contrast rounded-lg flex items-center justify-center">
                  <div className="text-center text-medium-contrast">
                    <Play className="w-12 h-12 mx-auto mb-4" />
                    <p>Video not available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <ModernCard className="p-6 mb-8">
              <div className="flex items-center justify-between">
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
                    <span>{post.likes} {post.likes === 1 ? 'Like' : 'Likes'}</span>
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-2 px-4 py-2 bg-low-contrast text-medium-contrast hover:text-high-contrast rounded-lg transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>Share</span>
                  </button>

                  <div className="text-body-sm text-medium-contrast">
                    {post.comments} comments
                  </div>
                </div>

                {/* Live Visitor Counter */}
                <LiveVisitorCounter
                  variant="compact"
                  showPresence={true}
                />
              </div>
            </ModernCard>

            {/* Description and Content */}
            {(post.description || post.content) && (
              <ModernCard className="p-6 mb-8">
                <h3 className="text-subtitle font-bold text-high-contrast mb-4">
                  Description
                </h3>
                
                {post.description && (
                  <p className="text-body text-medium-contrast mb-4 leading-relaxed">
                    {post.description}
                  </p>
                )}

                {post.content && (
                  <div 
                    className="prose prose-lg max-w-none text-high-contrast leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                )}
              </ModernCard>
            )}

            {/* Video Chapters */}
            {post.chapters && post.chapters.length > 0 && (
              <ModernCard className="p-6 mb-8">
                <h3 className="text-subtitle font-bold text-high-contrast mb-4">
                  Chapters
                </h3>
                <div className="space-y-3">
                  {post.chapters.map((chapter, index) => (
                    <div
                      key={chapter.id}
                      className="flex items-center space-x-4 p-3 bg-low-contrast rounded-lg hover:bg-medium-contrast transition-colors cursor-pointer"
                    >
                      <div className="text-body-sm font-mono text-blue-500">
                        {formatDuration(chapter.startTime)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-high-contrast">{chapter.title}</h4>
                        {chapter.description && (
                          <p className="text-body-sm text-medium-contrast">{chapter.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ModernCard>
            )}

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

              {/* Video Stats */}
              <ModernCard className="p-6">
                <h3 className="text-subtitle font-bold text-high-contrast mb-4">
                  Video Statistics
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
                      {post.likes}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-medium-contrast">Comments:</span>
                    <span className="font-medium text-high-contrast">
                      {post.comments}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-medium-contrast">Shares:</span>
                    <span className="font-medium text-high-contrast">
                      {post.shares}
                    </span>
                  </div>
                  {post.completionRate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-medium-contrast">Completion:</span>
                      <span className="font-medium text-high-contrast">
                        {post.completionRate.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-medium-contrast">Published:</span>
                    <span className="font-medium text-high-contrast">
                      {formatDate(post.publishedAt).split(',')[0]}
                    </span>
                  </div>
                </div>
              </ModernCard>

              {/* Related Posts */}
              <ModernCard className="p-6">
                <h3 className="text-subtitle font-bold text-high-contrast mb-4">
                  Related Videos
                </h3>
                <div className="space-y-4">
                  <div className="text-medium-contrast text-body-sm">
                    Related videos will be shown here based on categories and tags.
                  </div>
                </div>
              </ModernCard>

              {/* Share Options */}
              <ModernCard className="p-6">
                <h3 className="text-subtitle font-bold text-high-contrast mb-4">
                  Share This Video
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