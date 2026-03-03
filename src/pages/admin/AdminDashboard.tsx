import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, FileText, Mail, Settings, Upload, 
  Video, Play, Youtube, TrendingUp, Eye, Heart,
  Calendar, Filter, Download, ExternalLink
} from 'lucide-react';
import { ModernButton, ModernCard } from '../../components/ModernDesignSystem';
import { VideoUploadModal } from '../../components/video/VideoUploadModal';
import { videoPostsService, VideoPost } from '../../services/video/VideoPostsService';
import { videoAnalyticsService } from '../../services/video/VideoAnalyticsService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface DashboardStats {
  totalPosts: number;
  totalViews: number;
  totalVideos: number;
  totalSubscribers: number;
  todayViews: number;
  thisMonthViews: number;
  engagementRate: number;
  topPerformingVideo: VideoPost | null;
}

export default function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'videos' | 'analytics' | 'email' | 'settings'>('overview');
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    totalViews: 0,
    totalVideos: 0,
    totalSubscribers: 0,
    todayViews: 0,
    thisMonthViews: 0,
    engagementRate: 0,
    topPerformingVideo: null
  });
  const [videoPosts, setVideoPosts] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load video posts
      const posts = await videoPostsService.getVideoPosts({
        authorId: currentUser?.id,
        limit: 20
      });
      setVideoPosts(posts);

      // Calculate stats
      const totalViews = posts.reduce((sum, post) => sum + post.views, 0);
      const totalVideos = posts.filter(post => post.type === 'video' || post.type === 'mixed').length;
      const topVideo = posts.reduce((max, post) => 
        post.views > (max?.views || 0) ? post : max, posts[0] || null
      );

      setStats({
        totalPosts: posts.length,
        totalViews,
        totalVideos,
        totalSubscribers: 1250, // Mock data
        todayViews: Math.floor(totalViews * 0.05),
        thisMonthViews: Math.floor(totalViews * 0.3),
        engagementRate: posts.length > 0 ? 
          posts.reduce((sum, post) => sum + (post.likes + post.comments + post.shares), 0) / totalViews * 100 : 0,
        topPerformingVideo: topVideo
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUploadComplete = (postId: string) => {
    toast.success('Video uploaded successfully!');
    setShowVideoUpload(false);
    loadDashboardData(); // Refresh data
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-display mb-4 text-high-contrast">Access Denied</h1>
          <p className="text-body-lg text-medium-contrast">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-display font-bold text-high-contrast">Admin Dashboard</h1>
            <p className="text-body-lg text-medium-contrast">
              Manage your content and track performance
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <ModernButton
              variant="default"
              intent="primary"
              icon={Video}
              onClick={() => setShowVideoUpload(true)}
            >
              Upload Video
            </ModernButton>
            <ModernButton
              variant="minimal"
              intent="secondary"
              icon={Upload}
            >
              New Post
            </ModernButton>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-low-contrast rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'videos', label: 'Videos', icon: Video },
            { id: 'posts', label: 'Posts', icon: FileText },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'email', label: 'Email', icon: Mail },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-800 text-high-contrast shadow-sm'
                  : 'text-medium-contrast hover:text-high-contrast'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ModernCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-body-sm text-medium-contrast">Total Posts</p>
                    <p className="text-title font-bold text-high-contrast">
                      {formatNumber(stats.totalPosts)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-body-sm">
                  <span className="text-green-600 dark:text-green-400">↗ 12%</span>
                  <span className="text-medium-contrast ml-2">vs last month</span>
                </div>
              </ModernCard>

              <ModernCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-body-sm text-medium-contrast">Total Views</p>
                    <p className="text-title font-bold text-high-contrast">
                      {formatNumber(stats.totalViews)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Eye className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-body-sm">
                  <span className="text-green-600 dark:text-green-400">↗ 8%</span>
                  <span className="text-medium-contrast ml-2">vs last month</span>
                </div>
              </ModernCard>

              <ModernCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-body-sm text-medium-contrast">Video Posts</p>
                    <p className="text-title font-bold text-high-contrast">
                      {formatNumber(stats.totalVideos)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Video className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-body-sm">
                  <span className="text-green-600 dark:text-green-400">↗ 25%</span>
                  <span className="text-medium-contrast ml-2">vs last month</span>
                </div>
              </ModernCard>

              <ModernCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-body-sm text-medium-contrast">Engagement</p>
                    <p className="text-title font-bold text-high-contrast">
                      {stats.engagementRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-body-sm">
                  <span className="text-green-600 dark:text-green-400">↗ 15%</span>
                  <span className="text-medium-contrast ml-2">vs last month</span>
                </div>
              </ModernCard>
            </div>

            {/* Top Performing Video */}
            {stats.topPerformingVideo && (
              <ModernCard className="p-6">
                <h3 className="text-title font-bold text-high-contrast mb-4">
                  Top Performing Video
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={stats.topPerformingVideo.videoThumbnail || '/default-thumbnail.jpg'}
                      alt={stats.topPerformingVideo.title}
                      className="w-32 h-18 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-black/70 rounded-full flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-current" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-high-contrast mb-2">
                      {stats.topPerformingVideo.title}
                    </h4>
                    <div className="flex items-center space-x-6 text-body-sm text-medium-contrast">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{formatNumber(stats.topPerformingVideo.views)} views</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{formatNumber(stats.topPerformingVideo.likes)} likes</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(stats.topPerformingVideo.publishedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <ModernButton
                    variant="minimal"
                    intent="primary"
                    size="sm"
                    icon={ExternalLink}
                    onClick={() => window.open(`/video/${stats.topPerformingVideo?.id}`, '_blank')}
                  >
                    View
                  </ModernButton>
                </div>
              </ModernCard>
            )}
          </div>
        )}

        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <div className="space-y-6">
            {/* Actions */}
            <div className="flex items-center justify-between">
              <h2 className="text-title font-bold text-high-contrast">Video Management</h2>
              <div className="flex items-center space-x-3">
                <ModernButton
                  variant="minimal"
                  intent="secondary"
                  icon={Filter}
                >
                  Filter
                </ModernButton>
                <ModernButton
                  variant="default"
                  intent="primary"
                  icon={Video}
                  onClick={() => setShowVideoUpload(true)}
                >
                  Upload Video
                </ModernButton>
              </div>
            </div>

            {/* Video List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {loading ? (
                // Loading skeletons
                Array.from({ length: 6 }).map((_, index) => (
                  <ModernCard key={index} className="p-4">
                    <div className="animate-pulse">
                      <div className="aspect-video bg-low-contrast rounded-lg mb-4"></div>
                      <div className="h-4 bg-low-contrast rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-low-contrast rounded w-1/2"></div>
                    </div>
                  </ModernCard>
                ))
              ) : videoPosts.length > 0 ? (
                videoPosts.map((post) => (
                  <ModernCard key={post.id} className="p-4 group hover:shadow-lg transition-shadow">
                    <div className="relative mb-4">
                      <img
                        src={post.videoThumbnail || '/default-thumbnail.jpg'}
                        alt={post.title}
                        className="w-full aspect-video object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                        <div className="w-12 h-12 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-6 h-6 text-white fill-current" />
                        </div>
                      </div>

                      {/* Video Type Badge */}
                      <div className="absolute top-2 left-2">
                        <div className="bg-black/70 backdrop-blur-sm rounded px-2 py-1 flex items-center space-x-1">
                          {post.externalPlatform === 'youtube' ? (
                            <Youtube className="w-3 h-3 text-red-500" />
                          ) : post.externalPlatform === 'vimeo' ? (
                            <Video className="w-3 h-3 text-green-500" />
                          ) : (
                            <Video className="w-3 h-3 text-blue-500" />
                          )}
                          <span className="text-white text-caption font-medium">
                            {post.externalPlatform || 'Native'}
                          </span>
                        </div>
                      </div>

                      {/* Duration */}
                      {post.videoDuration && (
                        <div className="absolute bottom-2 right-2">
                          <div className="bg-black/70 backdrop-blur-sm rounded px-2 py-1">
                            <span className="text-white text-caption font-medium">
                              {formatDuration(post.videoDuration)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium text-high-contrast line-clamp-2 leading-tight">
                        {post.title}
                      </h3>
                      
                      <div className="flex items-center justify-between text-body-sm text-medium-contrast">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>{formatNumber(post.views)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="w-3 h-3" />
                            <span>{formatNumber(post.likes)}</span>
                          </div>
                        </div>
                        <span>{formatDate(post.publishedAt)}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {post.categories.map((category, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-caption"
                          >
                            {category}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${
                            post.published ? 'bg-green-500' : 'bg-yellow-500'
                          }`}></div>
                          <span className="text-caption text-medium-contrast">
                            {post.published ? 'Published' : 'Draft'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <ModernButton
                            variant="minimal"
                            intent="secondary"
                            size="xs"
                            onClick={() => window.open(`/video/${post.id}`, '_blank')}
                          >
                            View
                          </ModernButton>
                          <ModernButton
                            variant="minimal"
                            intent="secondary"
                            size="xs"
                          >
                            Edit
                          </ModernButton>
                        </div>
                      </div>
                    </div>
                  </ModernCard>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Video className="w-12 h-12 mx-auto mb-4 text-low-contrast" />
                  <h3 className="text-body-lg font-medium text-medium-contrast mb-2">
                    No videos yet
                  </h3>
                  <p className="text-body text-low-contrast mb-6">
                    Upload your first video to get started
                  </p>
                  <ModernButton
                    variant="default"
                    intent="primary"
                    icon={Video}
                    onClick={() => setShowVideoUpload(true)}
                  >
                    Upload Video
                  </ModernButton>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Other tabs would be implemented similarly */}
        {activeTab === 'posts' && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-low-contrast" />
            <h3 className="text-body-lg font-medium text-medium-contrast">
              Post management coming soon
            </h3>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-low-contrast" />
            <h3 className="text-body-lg font-medium text-medium-contrast">
              Advanced analytics coming soon
            </h3>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 mx-auto mb-4 text-low-contrast" />
            <h3 className="text-body-lg font-medium text-medium-contrast">
              Email campaigns coming soon
            </h3>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 mx-auto mb-4 text-low-contrast" />
            <h3 className="text-body-lg font-medium text-medium-contrast">
              Settings panel coming soon
            </h3>
          </div>
        )}
      </div>

      {/* Video Upload Modal */}
      <VideoUploadModal
        isOpen={showVideoUpload}
        onClose={() => setShowVideoUpload(false)}
        onUploadComplete={handleVideoUploadComplete}
      />
    </div>
  );
} 