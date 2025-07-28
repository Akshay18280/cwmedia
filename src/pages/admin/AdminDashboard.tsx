import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Eye, EyeOff, Calendar, Users, 
  BarChart3, TrendingUp, Mail, Settings, Upload, Play,
  FileText, Image, Video, Presentation, MessageSquare,
  Share2, Clock, Globe, Lock, Zap, Heart, Star,
  Filter, Search, Download, Send
} from 'lucide-react';
import { ModernButton, ModernCard } from '../../components/ModernDesignSystem';
import { PostEditor } from '../../components/admin/PostEditor';
import { MediaUploader } from '../../components/admin/MediaUploader';
import { ScheduleManager } from '../../components/admin/ScheduleManager';
import { AnalyticsDashboard } from '../../components/admin/AnalyticsDashboard';
import { EmailCampaignManager } from '../../components/admin/EmailCampaignManager';

interface AdminPost {
  id: string;
  title: string;
  content: string;
  mediaFiles: MediaFile[];
  status: 'draft' | 'scheduled' | 'live' | 'hidden';
  scheduledAt?: Date;
  publishedAt?: Date;
  views: number;
  likes: number;
  comments: Comment[];
  tags: string[];
  category: string;
  shareUrls: ShareUrls;
  seoData: SEOData;
}

interface MediaFile {
  id: string;
  type: 'image' | 'video' | 'powerpoint' | 'document' | 'audio';
  url: string;
  thumbnail?: string;
  size: number;
  name: string;
  duration?: number;
}

interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userEmail: string;
  content: string;
  createdAt: Date;
  isVisible: boolean;
  replies: Comment[];
}

interface ShareUrls {
  linkedin: string;
  whatsapp: string;
  twitter: string;
  facebook: string;
  direct: string;
}

interface SEOData {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogImage: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<AdminPost | null>(null);
  const [showPostEditor, setShowPostEditor] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [analytics, setAnalytics] = useState({
    totalPosts: 0,
    totalViews: 0,
    totalSubscribers: 0,
    engagementRate: 0,
    topPerformingPosts: [],
    recentActivity: []
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'posts', label: 'Posts', icon: FileText },
    { id: 'media', label: 'Media Library', icon: Image },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
    { id: 'scheduling', label: 'Scheduling', icon: Calendar },
    { id: 'email', label: 'Email Campaigns', icon: Mail },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const postTypes = [
    { id: 'blog', label: 'Blog Article', icon: FileText, color: 'bg-gradient-flow' },
    { id: 'video', label: 'Video Content', icon: Video, color: 'bg-holographic' },
    { id: 'short', label: 'Short Video', icon: Play, color: 'bg-gradient-flow-subtle' },
    { id: 'presentation', label: 'Presentation', icon: Presentation, color: 'bg-holographic-subtle' },
    { id: 'mixed', label: 'Mixed Media', icon: Plus, color: 'bg-gradient-accent' }
  ];

  // Load posts and analytics
  useEffect(() => {
    loadPosts();
    loadAnalytics();
  }, []);

  const loadPosts = async () => {
    // Fetch posts from API
    try {
      const response = await fetch('/api/admin/posts');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const loadAnalytics = async () => {
    // Fetch analytics from API
    try {
      const response = await fetch('/api/admin/analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const createNewPost = (type: string) => {
    const newPost: AdminPost = {
      id: `post_${Date.now()}`,
      title: '',
      content: '',
      mediaFiles: [],
      status: 'draft',
      views: 0,
      likes: 0,
      comments: [],
      tags: [],
      category: type,
      shareUrls: {
        linkedin: '',
        whatsapp: '',
        twitter: '',
        facebook: '',
        direct: ''
      },
      seoData: {
        metaTitle: '',
        metaDescription: '',
        keywords: [],
        ogImage: ''
      }
    };
    setSelectedPost(newPost);
    setShowPostEditor(true);
  };

  const publishPost = async (postId: string) => {
    // Publish post and trigger email campaign
    try {
      await fetch(`/api/admin/posts/${postId}/publish`, { method: 'POST' });
      await triggerEmailCampaign(postId);
      loadPosts();
    } catch (error) {
      console.error('Error publishing post:', error);
    }
  };

  const schedulePost = async (postId: string, scheduledAt: Date) => {
    try {
      await fetch(`/api/admin/posts/${postId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt })
      });
      loadPosts();
    } catch (error) {
      console.error('Error scheduling post:', error);
    }
  };

  const triggerEmailCampaign = async (postId: string) => {
    // Send automated email to all subscribers
    try {
      await fetch(`/api/admin/email/campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          postId,
          template: 'new_post_announcement',
          personalizedSubjects: true,
          psychologicalTriggers: true
        })
      });
    } catch (error) {
      console.error('Error sending email campaign:', error);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || post.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="bg-gradient-flow text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-white/80 mt-1">Manage your content empire</p>
            </div>
            <div className="flex items-center gap-4">
              <ModernButton 
                variant="glass" 
                intent="accent" 
                icon={Plus}
                onClick={() => setShowPostEditor(true)}
              >
                Create Post
              </ModernButton>
              <div className="text-right">
                <div className="text-sm text-white/80">Total Views</div>
                <div className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white/10 backdrop-blur-md rounded-xl p-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id 
                      ? 'bg-gradient-flow text-white shadow-lg' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gradient-flow-subtle hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <ModernCard variant="neumorphic" padding="lg" className="text-center">
                <div className="w-12 h-12 bg-gradient-flow rounded-full mx-auto mb-4 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gradient-accent">{analytics.totalPosts}</div>
                <div className="text-gray-600 dark:text-gray-400">Total Posts</div>
              </ModernCard>

              <ModernCard variant="glass" padding="lg" className="text-center">
                <div className="w-12 h-12 bg-holographic rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-holographic">{analytics.totalViews.toLocaleString()}</div>
                <div className="text-gray-600 dark:text-gray-400">Total Views</div>
              </ModernCard>

              <ModernCard variant="default" padding="lg" className="text-center">
                <div className="w-12 h-12 bg-gradient-flow-subtle rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gradient-flow">{analytics.totalSubscribers}</div>
                <div className="text-gray-600 dark:text-gray-400">Subscribers</div>
              </ModernCard>

              <ModernCard variant="brutalist" padding="lg" className="text-center">
                <div className="w-12 h-12 bg-gradient-accent rounded-full mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gradient-accent">{analytics.engagementRate}%</div>
                <div className="text-gray-600 dark:text-gray-400">Engagement</div>
              </ModernCard>
            </div>

            {/* Quick Actions */}
            <ModernCard variant="default" padding="lg">
              <h3 className="text-2xl font-bold mb-6 text-gradient-flow">Create New Content</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {postTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => createNewPost(type.id)}
                      className={`p-6 rounded-xl text-white text-center transition-all duration-200 hover:scale-105 hover:shadow-lg ${type.color}`}
                    >
                      <Icon className="w-8 h-8 mx-auto mb-3" />
                      <div className="font-medium">{type.label}</div>
                    </button>
                  );
                })}
              </div>
            </ModernCard>
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="space-y-6">
            {/* Posts Management Header */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-modern pl-10 w-full"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input-modern min-w-[120px]"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live</option>
                  <option value="hidden">Hidden</option>
                </select>
                
                <ModernButton 
                  variant="default" 
                  intent="primary" 
                  icon={Plus}
                  onClick={() => setShowPostEditor(true)}
                >
                  New Post
                </ModernButton>
              </div>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredPosts.map(post => (
                <ModernCard key={post.id} variant="default" padding="md" hover>
                  <div className="space-y-4">
                    {/* Post Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg line-clamp-2 text-gradient-accent">
                          {post.title || 'Untitled Post'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {post.category} • {post.mediaFiles.length} files
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        post.status === 'live' ? 'bg-green-100 text-green-800' :
                        post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        post.status === 'hidden' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {post.status}
                      </div>
                    </div>

                    {/* Media Preview */}
                    {post.mediaFiles.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto">
                        {post.mediaFiles.slice(0, 3).map(file => (
                          <div key={file.id} className="flex-shrink-0 w-16 h-16 bg-gradient-flow-subtle rounded-lg flex items-center justify-center">
                            {file.type === 'image' && <Image className="w-6 h-6 text-white" />}
                            {file.type === 'video' && <Video className="w-6 h-6 text-white" />}
                            {file.type === 'powerpoint' && <Presentation className="w-6 h-6 text-white" />}
                          </div>
                        ))}
                        {post.mediaFiles.length > 3 && (
                          <div className="flex-shrink-0 w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-medium">+{post.mediaFiles.length - 3}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.views}
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {post.likes}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {post.comments.length}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <ModernButton
                        variant="minimal"
                        intent="primary"
                        size="sm"
                        icon={Edit}
                        onClick={() => {
                          setSelectedPost(post);
                          setShowPostEditor(true);
                        }}
                      >
                        Edit
                      </ModernButton>
                      
                      {post.status === 'draft' && (
                        <ModernButton
                          variant="minimal"
                          intent="accent"
                          size="sm"
                          icon={Globe}
                          onClick={() => publishPost(post.id)}
                        >
                          Publish
                        </ModernButton>
                      )}
                      
                      <ModernButton
                        variant="minimal"
                        intent="secondary"
                        size="sm"
                        icon={Share2}
                      >
                        Share
                      </ModernButton>
                      
                      <ModernButton
                        variant="minimal"
                        intent="error"
                        size="sm"
                        icon={Trash2}
                      >
                        Delete
                      </ModernButton>
                    </div>
                  </div>
                </ModernCard>
              ))}
            </div>
          </div>
        )}

        {/* Other tab contents would be implemented here */}
      </div>

      {/* Post Editor Modal */}
      {showPostEditor && (
        <PostEditor
          post={selectedPost}
          onSave={(post) => {
            // Save post logic
            setShowPostEditor(false);
            loadPosts();
          }}
          onClose={() => setShowPostEditor(false)}
        />
      )}
    </div>
  );
} 