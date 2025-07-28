import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Eye, Heart, MessageSquare, Share2, Users, 
  Calendar, Globe, Target, BarChart3, PieChart, Activity,
  Download, RefreshCw, Filter
} from 'lucide-react';
import { ModernButton, ModernCard } from '../ModernDesignSystem';

interface AnalyticsData {
  overview: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    subscribers: number;
    engagementRate: number;
  };
  posts: Array<{
    id: string;
    title: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    publishedAt: Date;
    category: string;
  }>;
  traffic: {
    sources: Array<{ source: string; percentage: number; visitors: number }>;
    devices: Array<{ device: string; percentage: number; users: number }>;
    countries: Array<{ country: string; percentage: number; visitors: number }>;
  };
  engagement: {
    daily: Array<{ date: string; views: number; engagement: number }>;
    hourly: Array<{ hour: number; activity: number }>;
  };
}

interface AnalyticsDashboardProps {
  dateRange?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  dateRange = '30d' 
}) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(dateRange);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?period=${selectedPeriod}`);
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const exportData = async () => {
    try {
      const response = await fetch(`/api/admin/analytics/export?period=${selectedPeriod}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${selectedPeriod}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const periods = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'posts', label: 'Top Posts', icon: TrendingUp },
    { id: 'traffic', label: 'Traffic Sources', icon: Globe },
    { id: 'engagement', label: 'Engagement', icon: Activity }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <ModernCard variant="holographic" padding="lg" className="text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Analytics Dashboard</h2>
            <p className="text-white/80">Comprehensive insights into your content performance</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-white/20 backdrop-blur border border-white/30 rounded-lg px-3 py-2 text-white"
            >
              {periods.map(period => (
                <option key={period.value} value={period.value} className="text-gray-900">
                  {period.label}
                </option>
              ))}
            </select>
            
            <ModernButton
              variant="glass"
              intent="secondary"
              icon={RefreshCw}
              onClick={loadAnalytics}
            >
              Refresh
            </ModernButton>
            
            <ModernButton
              variant="glass"
              intent="accent"
              icon={Download}
              onClick={exportData}
            >
              Export
            </ModernButton>
          </div>
        </div>
      </ModernCard>

      {/* Key Metrics */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ModernCard variant="neumorphic" padding="lg" className="text-center">
            <Eye className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-gradient-accent mb-1">
              {formatNumber(data.overview.totalViews)}
            </div>
            <div className="text-medium-contrast">Total Views</div>
          </ModernCard>

          <ModernCard variant="glass" padding="lg" className="text-center">
            <Heart className="w-8 h-8 text-red-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-holographic mb-1">
              {formatNumber(data.overview.totalLikes)}
            </div>
            <div className="text-medium-contrast">Total Likes</div>
          </ModernCard>

          <ModernCard variant="default" padding="lg" className="text-center">
            <MessageSquare className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-gradient-flow mb-1">
              {formatNumber(data.overview.totalComments)}
            </div>
            <div className="text-medium-contrast">Comments</div>
          </ModernCard>

          <ModernCard variant="brutalist" padding="lg" className="text-center">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-accent-primary mb-1">
              {formatNumber(data.overview.subscribers)}
            </div>
            <div className="text-medium-contrast">Subscribers</div>
          </ModernCard>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-white/10 backdrop-blur-md rounded-xl p-1">
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
      </div>

      {/* Tab Content */}
      {data && (
        <div>
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ModernCard variant="neumorphic" padding="lg">
                <h3 className="text-xl font-bold mb-4 text-gradient-accent">Engagement Rate</h3>
                <div className="text-center">
                  <div className="text-4xl font-bold text-holographic mb-2">
                    {formatPercentage(data.overview.engagementRate)}
                  </div>
                  <div className="text-medium-contrast">Average engagement across all content</div>
                </div>
              </ModernCard>

              <ModernCard variant="glass" padding="lg">
                <h3 className="text-xl font-bold mb-4 text-gradient-flow">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-medium-contrast">Total Shares</span>
                    <span className="font-bold text-high-contrast">{formatNumber(data.overview.totalShares)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-medium-contrast">Avg. Views per Post</span>
                    <span className="font-bold text-high-contrast">
                      {formatNumber(Math.round(data.overview.totalViews / data.posts.length))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-medium-contrast">Posts Published</span>
                    <span className="font-bold text-high-contrast">{data.posts.length}</span>
                  </div>
                </div>
              </ModernCard>
            </div>
          )}

          {activeTab === 'posts' && (
            <ModernCard variant="default" padding="lg">
              <h3 className="text-xl font-bold mb-6 text-gradient-accent">Top Performing Posts</h3>
              <div className="space-y-4">
                {data.posts.slice(0, 10).map((post, index) => (
                  <div key={post.id} className="flex items-center justify-between p-4 bg-low-contrast rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-gradient-flow rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-high-contrast">{post.title}</h4>
                        <div className="text-sm text-medium-contrast">{post.category}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-high-contrast">{formatNumber(post.views)}</div>
                        <div className="text-low-contrast">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-high-contrast">{formatNumber(post.likes)}</div>
                        <div className="text-low-contrast">Likes</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-high-contrast">{formatNumber(post.comments)}</div>
                        <div className="text-low-contrast">Comments</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ModernCard>
          )}

          {activeTab === 'traffic' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <ModernCard variant="neumorphic" padding="lg">
                <h3 className="text-xl font-bold mb-4 text-gradient-accent">Traffic Sources</h3>
                <div className="space-y-3">
                  {data.traffic.sources.map((source) => (
                    <div key={source.source} className="flex justify-between items-center">
                      <span className="text-medium-contrast">{source.source}</span>
                      <div className="text-right">
                        <div className="font-bold text-high-contrast">{formatPercentage(source.percentage)}</div>
                        <div className="text-xs text-low-contrast">{formatNumber(source.visitors)} visitors</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ModernCard>

              <ModernCard variant="glass" padding="lg">
                <h3 className="text-xl font-bold mb-4 text-holographic">Devices</h3>
                <div className="space-y-3">
                  {data.traffic.devices.map((device) => (
                    <div key={device.device} className="flex justify-between items-center">
                      <span className="text-medium-contrast">{device.device}</span>
                      <div className="text-right">
                        <div className="font-bold text-high-contrast">{formatPercentage(device.percentage)}</div>
                        <div className="text-xs text-low-contrast">{formatNumber(device.users)} users</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ModernCard>

              <ModernCard variant="default" padding="lg">
                <h3 className="text-xl font-bold mb-4 text-gradient-flow">Top Countries</h3>
                <div className="space-y-3">
                  {data.traffic.countries.map((country) => (
                    <div key={country.country} className="flex justify-between items-center">
                      <span className="text-medium-contrast">{country.country}</span>
                      <div className="text-right">
                        <div className="font-bold text-high-contrast">{formatPercentage(country.percentage)}</div>
                        <div className="text-xs text-low-contrast">{formatNumber(country.visitors)} visitors</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ModernCard>
            </div>
          )}

          {activeTab === 'engagement' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ModernCard variant="neumorphic" padding="lg">
                <h3 className="text-xl font-bold mb-4 text-gradient-accent">Daily Engagement</h3>
                <div className="space-y-2">
                  {data.engagement.daily.slice(-7).map((day) => (
                    <div key={day.date} className="flex justify-between items-center p-3 bg-low-contrast rounded-lg">
                      <span className="text-medium-contrast">{new Date(day.date).toLocaleDateString()}</span>
                      <div className="text-right">
                        <div className="font-bold text-high-contrast">{formatNumber(day.views)} views</div>
                        <div className="text-xs text-low-contrast">{formatPercentage(day.engagement)} engagement</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ModernCard>

              <ModernCard variant="glass" padding="lg">
                <h3 className="text-xl font-bold mb-4 text-holographic">Peak Hours</h3>
                <div className="space-y-2">
                  {data.engagement.hourly
                    .sort((a, b) => b.activity - a.activity)
                    .slice(0, 8)
                    .map((hour) => (
                    <div key={hour.hour} className="flex justify-between items-center p-3 bg-low-contrast rounded-lg">
                      <span className="text-medium-contrast">
                        {hour.hour}:00 - {hour.hour + 1}:00
                      </span>
                      <div className="font-bold text-high-contrast">
                        {formatNumber(hour.activity)} activity
                      </div>
                    </div>
                  ))}
                </div>
              </ModernCard>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 