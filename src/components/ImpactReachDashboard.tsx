import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, 
  Users, 
  TrendingUp, 
  Activity, 
  MapPin, 
  Eye,
  BarChart3,
  Zap,
  Calendar,
  Clock,
  Target,
  Award
} from 'lucide-react';
import { productionAnalyticsService } from '../services/analytics/production-analytics.service';

interface AnalyticsData {
  // Real production metrics only
  githubStars: number;
  githubFollowers: number;
  githubRepos: number;
  totalArticles: number;
  totalNewsletterSubscribers: number;
  approvedReviews: number;
  totalPageViews: number;
  
  // Professional metrics
  linkedinConnections: number;
  twitterFollowers: number;
  youtubeSubscribers: number;
  
  // Real visitor data (when backend is implemented)
  activeUsers: number;
  todayVisitors: number;
  
  lastUpdated: number;
}

export default function ImpactReachDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'impact'>('overview');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const countUpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRealAnalytics();
    const interval = setInterval(loadRealAnalytics, 60000); // Update every minute for production
    return () => clearInterval(interval);
  }, []);

  const loadRealAnalytics = async () => {
    try {
      setError(null);
      const metrics = await productionAnalyticsService.getRealTimeMetrics();
      
      setAnalyticsData({
        githubStars: metrics.githubStars,
        githubFollowers: metrics.githubFollowers,
        githubRepos: metrics.githubRepos,
        totalArticles: metrics.totalArticles,
        totalNewsletterSubscribers: metrics.totalNewsletterSubscribers,
        approvedReviews: metrics.approvedReviews,
        totalPageViews: metrics.totalPageViews,
        linkedinConnections: metrics.linkedinConnections,
        twitterFollowers: metrics.twitterFollowers,
        youtubeSubscribers: metrics.youtubeSubscribers,
        activeUsers: metrics.activeUsers,
        todayVisitors: metrics.todayVisitors,
        lastUpdated: metrics.lastUpdated
      });
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Animated counter with intersection observer
  const AnimatedCounter: React.FC<{ end: number; label: string; icon: React.ReactNode; }> = ({ end, label, icon }) => {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!elementRef.current) return;

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        },
        { threshold: 0.1 }
      );

      observerRef.current.observe(elementRef.current);

      return () => {
        if (observerRef.current && elementRef.current) {
          observerRef.current.unobserve(elementRef.current);
        }
      };
    }, [isVisible]);

    useEffect(() => {
      if (!isVisible) return;

      let startTime: number | null = null;
      const duration = 2000; // 2 seconds animation

      const animate = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutExpo = 1 - Math.pow(2, -10 * progress);
        setCount(Math.floor(end * easeOutExpo));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, [isVisible, end]);

    return (
      <div ref={elementRef} className="metric-card bg-medium-contrast rounded-xl p-6 shadow-lg border border-low-contrast">
        <div className="flex items-center justify-between mb-4">
          <div className="text-blue-600 dark:text-blue-400">
            {icon}
          </div>
          <div className="text-right">
            <div className="text-subtitle font-bold text-high-contrast">
              {count.toLocaleString()}
            </div>
            <div className="text-body-sm text-medium-contrast">
              {label}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <section className="py-16 bg-high-contrast">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-medium-contrast">Loading real analytics data...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-high-contrast">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <Activity className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-medium-contrast">{error}</p>
            <button 
              onClick={loadRealAnalytics}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!analyticsData) return null;

  return (
    <section className="py-16 bg-high-contrast">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-title font-bold text-high-contrast mb-4">
            Real-Time Global Impact
          </h2>
          <p className="text-body text-medium-contrast max-w-3xl mx-auto">
            Live production metrics from real data sources - GitHub API, database analytics, and social media engagement.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-medium-contrast rounded-lg p-1 shadow-lg border border-low-contrast">
            {[
              { id: 'overview', label: 'Overview', icon: <Globe className="w-4 h-4" /> },
              { id: 'metrics', label: 'Metrics', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'impact', label: 'Impact', icon: <Award className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Real Metrics Grid */}
        <div className="analytics-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <AnimatedCounter
            end={analyticsData.totalArticles}
            label="Articles Published"
            icon={<BarChart3 className="w-6 h-6" />}
          />
          <AnimatedCounter
            end={analyticsData.totalNewsletterSubscribers}
            label="Newsletter Subscribers"
            icon={<Users className="w-6 h-6" />}
          />
          <AnimatedCounter
            end={analyticsData.githubStars}
            label="GitHub Stars"
            icon={<Award className="w-6 h-6" />}
          />
          <AnimatedCounter
            end={analyticsData.totalPageViews}
            label="Total Page Views"
            icon={<Eye className="w-6 h-6" />}
          />
        </div>

        {/* Content Based on Active Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* GitHub Statistics */}
            <div className="bg-medium-contrast rounded-xl p-6 shadow-lg border border-low-contrast">
              <h3 className="text-body-lg font-semibold text-high-contrast mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                GitHub Activity
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-medium-contrast">Public Repositories</span>
                  <span className="font-semibold text-high-contrast">{analyticsData.githubRepos}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-medium-contrast">Total Stars</span>
                  <span className="font-semibold text-high-contrast">{analyticsData.githubStars}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-medium-contrast">Followers</span>
                  <span className="font-semibold text-high-contrast">{analyticsData.githubFollowers}</span>
                </div>
              </div>
            </div>

            {/* Content Metrics */}
            <div className="bg-medium-contrast rounded-xl p-6 shadow-lg border border-low-contrast">
              <h3 className="text-body-lg font-semibold text-high-contrast mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                Content Impact
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-medium-contrast">Total Articles</span>
                  <span className="font-semibold text-high-contrast">{analyticsData.totalArticles}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-medium-contrast">Professional Reviews</span>
                  <span className="font-semibold text-high-contrast">{analyticsData.approvedReviews}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-medium-contrast">Avg. Views per Article</span>
                  <span className="font-semibold text-high-contrast">
                    {analyticsData.totalArticles > 0 ? Math.round(analyticsData.totalPageViews / analyticsData.totalArticles) : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="bg-medium-contrast rounded-xl p-6 shadow-lg border border-low-contrast">
            <h3 className="text-body-lg font-semibold text-high-contrast mb-6">Real-Time Analytics</h3>
            
            {analyticsData.activeUsers > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-title font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {analyticsData.activeUsers}
                  </div>
                  <div className="text-body-sm text-medium-contrast">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-title font-bold text-green-600 dark:text-green-400 mb-2">
                    {analyticsData.todayVisitors}
                  </div>
                  <div className="text-body-sm text-medium-contrast">Today's Visitors</div>
                </div>
                <div className="text-center">
                  <div className="text-title font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {analyticsData.totalPageViews}
                  </div>
                  <div className="text-body-sm text-medium-contrast">Total Page Views</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-low-contrast mb-4">
                  <Activity className="w-12 h-12 mx-auto mb-2" />
                  Real-time visitor analytics require backend Google Analytics integration
                </div>
                <p className="text-body-sm text-medium-contrast">
                  Database metrics and GitHub API data are live and updating
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'impact' && (
          <div className="bg-medium-contrast rounded-xl p-6 shadow-lg border border-low-contrast">
            <h3 className="text-body-lg font-semibold text-high-contrast mb-6">Professional Impact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-high-contrast mb-4">Content & Engagement</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-medium-contrast">Published Articles</span>
                    <span className="font-semibold">{analyticsData.totalArticles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-medium-contrast">Newsletter Reach</span>
                    <span className="font-semibold">{analyticsData.totalNewsletterSubscribers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-medium-contrast">Professional Reviews</span>
                    <span className="font-semibold">{analyticsData.approvedReviews}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-high-contrast mb-4">Developer Community</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-medium-contrast">GitHub Stars</span>
                    <span className="font-semibold">{analyticsData.githubStars}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-medium-contrast">GitHub Followers</span>
                    <span className="font-semibold">{analyticsData.githubFollowers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-medium-contrast">Open Source Projects</span>
                    <span className="font-semibold">{analyticsData.githubRepos}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real Data Badge */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 px-4 py-2 rounded-full text-body-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live production data • Updated every minute</span>
            <span className="text-green-600 dark:text-green-400 font-medium">Real GitHub API + Database Analytics</span>
          </div>
          <p className="text-caption text-low-contrast mt-2">
            Last updated: {new Date(analyticsData.lastUpdated).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </section>
  );
} 