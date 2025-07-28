import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit, Trash2, Users, FileText, Mail, TrendingUp, MessageSquare, Star, Shield } from 'lucide-react';
import { postsService } from '../services/posts';
import { authService } from '../services/auth';
import { reviewsService } from '../services/reviews';
import { toast } from 'sonner';
import AdminReviewManagement from '../components/AdminReviewManagement';
import IPAuthManager from '../components/admin/IPAuthManager';
import type { Post } from '../types';

export default function AdminDashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'reviews' | 'security'>('posts');
  const [showIPAuthManager, setShowIPAuthManager] = useState(false);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    pendingReviews: 0
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadPosts();
      loadStats();
    }
  }, [currentUser]);

  const checkAuth = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        window.location.href = '/admin/login';
        return;
      }
      
      const isAdmin = await authService.isAdmin(user.id);
      if (!isAdmin) {
        toast.error('Access denied: Admin privileges required');
        window.location.href = '/';
        return;
      }
      
      setCurrentUser(user);
    } catch (error) {
      console.error('Auth check failed:', error);
      window.location.href = '/admin/login';
    }
  };

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const allPosts = await postsService.getAllPosts();
      setPosts(allPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const allPosts = await postsService.getAllPosts();
      const reviewStats = await reviewsService.getReviewStats();
      
      const totalViews = allPosts.reduce((sum, post) => sum + post.views, 0);
      const totalLikes = allPosts.reduce((sum, post) => sum + post.likes, 0);
      
      setStats({
        totalPosts: allPosts.length,
        totalViews,
        totalLikes,
        pendingReviews: reviewStats.pending
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await postsService.deletePost(postId);
      toast.success('Post deleted successfully');
      loadPosts();
      loadStats();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-high-contrast flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-high-contrast">
      {/* Header */}
      <header className="bg-medium-contrast shadow-sm border-b border-low-contrast">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-subtitle font-bold text-high-contrast">
                Admin Dashboard
              </h1>
              <p className="text-body-sm text-medium-contrast">
                Welcome back, {currentUser.name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.location.href = '/'}
                className="text-medium-contrast hover:text-gray-900 dark:hover:text-white"
              >
                View Site
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-medium-contrast rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-body-sm font-medium text-medium-contrast">Total Posts</p>
                <p className="text-subtitle font-bold text-high-contrast">{stats.totalPosts}</p>
              </div>
            </div>
          </div>

          <div className="bg-medium-contrast rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-body-sm font-medium text-medium-contrast">Total Views</p>
                <p className="text-subtitle font-bold text-high-contrast">{stats.totalViews.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-medium-contrast rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-body-sm font-medium text-medium-contrast">Total Likes</p>
                <p className="text-subtitle font-bold text-high-contrast">{stats.totalLikes}</p>
              </div>
            </div>
          </div>

          <div className="bg-medium-contrast rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MessageSquare className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-body-sm font-medium text-medium-contrast">Pending Reviews</p>
                <p className="text-subtitle font-bold text-high-contrast">{stats.pendingReviews}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-medium-contrast rounded-lg shadow-sm mb-6">
          <div className="border-b border-low-contrast">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('posts')}
                className={`py-4 px-1 border-b-2 font-medium text-body-sm ${
                  activeTab === 'posts'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-low-contrast hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Posts Management
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-4 px-1 border-b-2 font-medium text-body-sm ${
                  activeTab === 'reviews'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-low-contrast hover:text-gray-700 dark:hover:text-gray-300'
                } relative`}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Review Management
                {stats.pendingReviews > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    {stats.pendingReviews}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`py-4 px-1 border-b-2 font-medium text-body-sm ${
                  activeTab === 'security'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-low-contrast hover:text-gray-700 dark:hover:text-gray-300'
                } relative`}
              >
                <Shield className="w-4 h-4 inline mr-2" />
                IP Authentication
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'posts' ? (
          <div className="bg-medium-contrast rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-low-contrast">
              <div className="flex justify-between items-center">
                <h2 className="text-body font-medium text-high-contrast">Blog Posts</h2>
                <button
                  onClick={() => window.location.href = '/admin/posts/new'}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Post
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-medium-contrast">Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-medium-contrast">No posts found. Create your first post!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-caption font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-caption font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-caption font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Published
                      </th>
                      <th className="px-6 py-3 text-left text-caption font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Views
                      </th>
                      <th className="px-6 py-3 text-left text-caption font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Likes
                      </th>
                      <th className="px-6 py-3 text-left text-caption font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-medium-contrast divide-y divide-gray-200 dark:divide-gray-700">
                    {posts.map((post) => (
                      <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div>
                              <div className="text-body-sm font-medium text-high-contrast">
                                {post.title}
                              </div>
                              <div className="text-body-sm text-low-contrast">
                                {post.excerpt.substring(0, 60)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-body-sm text-high-contrast">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {post.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-body-sm text-high-contrast">
                          {formatDate(post.published_at)}
                        </td>
                        <td className="px-6 py-4 text-body-sm text-high-contrast">
                          {post.views.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-body-sm text-high-contrast">
                          {post.likes}
                        </td>
                        <td className="px-6 py-4 text-body-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => window.location.href = `/blog/${post.id}`}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              title="View Post"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => window.location.href = `/admin/posts/${post.id}/edit`}
                              className="text-blue-400 hover:text-blue-600"
                              title="Edit Post"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="text-red-400 hover:text-red-600"
                              title="Delete Post"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === 'reviews' ? (
          <AdminReviewManagement />
        ) : activeTab === 'security' ? (
          <div className="bg-medium-contrast rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-low-contrast">
              <div className="flex justify-between items-center">
                <h2 className="text-body font-medium text-high-contrast">IP Authentication Settings</h2>
                <button
                  onClick={() => setShowIPAuthManager(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Manage IP Access
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center py-12">
                <Shield className="h-16 w-16 mx-auto text-blue-500 mb-4" />
                <h3 className="text-body font-medium text-high-contrast mb-2">
                  IP-Based Authentication
                </h3>
                <p className="text-medium-contrast mb-6 max-w-md mx-auto">
                  Configure automatic admin login for trusted IP addresses. 
                  This allows seamless access without entering credentials.
                </p>
                <button
                  onClick={() => setShowIPAuthManager(true)}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Configure IP Authentication
                </button>
              </div>
            </div>
            <IPAuthManager 
              isOpen={showIPAuthManager} 
              onClose={() => setShowIPAuthManager(false)} 
            />
          </div>
        ) : null}
      </div>

      {/* Global IP Auth Manager Modal */}
      <IPAuthManager 
        isOpen={showIPAuthManager} 
        onClose={() => setShowIPAuthManager(false)} 
      />
    </div>
  );
} 