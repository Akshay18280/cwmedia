import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, 
  Users, 
  TrendingUp, 
  MapPin, 
  Activity, 
  Eye,
  Heart,
  Share,
  Download,
  Mail,
  Clock,
  Zap,
  BarChart3,
  PieChart,
  Calendar,
  Star,
  ArrowUp,
  ArrowDown,
  Wifi,
  Server,
  Target
} from 'lucide-react';
import { realtimeAnalyticsService } from '../services/analytics/realtime-analytics.service';
import type { RealtimeMetrics, CountryData, VisitorActivity, ImpactMetrics } from '../services/analytics/realtime-analytics.service';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  value, 
  duration = 2000, 
  suffix = '', 
  prefix = '',
  decimals = 0 
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let start = 0;
    const end = value;
    const increment = end / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration, isVisible]);

  const formatValue = (val: number) => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}K`;
    }
    return val.toFixed(decimals);
  };

  return (
    <span ref={ref} className="font-bold">
      {prefix}{formatValue(displayValue)}{suffix}
    </span>
  );
};

const WorldMap: React.FC<{ countries: CountryData[] }> = ({ countries }) => {
  const [activeDots, setActiveDots] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const interval = setInterval(() => {
      const randomCountry = countries[Math.floor(Math.random() * countries.length)];
      setActiveDots(prev => ({ ...prev, [randomCountry.countryCode]: true }));
      
      setTimeout(() => {
        setActiveDots(prev => ({ ...prev, [randomCountry.countryCode]: false }));
      }, 2000);
    }, 3000);

    return () => clearInterval(interval);
  }, [countries]);

  return (
    <div className="relative w-full h-64 bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 rounded-2xl overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="grid grid-cols-12 grid-rows-8 h-full">
          {Array.from({ length: 96 }).map((_, i) => (
            <div
              key={i}
              className="border border-blue-400/30 animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>

      {/* World continents silhouette */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full max-w-lg opacity-30">
          <svg viewBox="0 0 1000 500" className="w-full h-auto">
            {/* Simplified world map SVG paths */}
            <path
              d="M158 208c-1-1-4-1-4 0l-6 11c-2 3 0 5 3 5h14c3 0 5-2 3-5l-6-11c0-1-3-1-4 0z"
              fill="currentColor"
              className="text-blue-300"
            />
            {/* Add more continent paths here for a more detailed map */}
          </svg>
        </div>
      </div>

      {/* Country visitor dots */}
      <div className="absolute inset-0">
        {countries.slice(0, 8).map((country, index) => {
          const isActive = activeDots[country.countryCode];
          return (
            <div
              key={country.countryCode}
              className="absolute group"
              style={{
                left: `${15 + (index % 4) * 20}%`,
                top: `${20 + Math.floor(index / 4) * 30}%`,
              }}
            >
              <div
                className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  isActive
                    ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50 scale-150'
                    : 'bg-blue-400 shadow-md shadow-blue-400/50'
                }`}
              >
                <div className={`absolute inset-0 rounded-full animate-ping ${
                  isActive ? 'bg-yellow-400' : 'bg-blue-400'
                }`} />
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                {country.country}: {country.users} users
              </div>
            </div>
          );
        })}
      </div>

      {/* Pulse effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-blue-400/20 rounded-full animate-ping transform -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-purple-400/20 rounded-full animate-ping transform -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: '1s' }} />
      </div>

      {/* Live indicator */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-white/80 text-xs font-medium">LIVE</span>
      </div>
    </div>
  );
};

const VisitorActivityFeed: React.FC<{ activities: VisitorActivity[] }> = ({ activities }) => {
  const getActivityIcon = (type: VisitorActivity['type']) => {
    switch (type) {
      case 'visit': return <Eye className="w-4 h-4 text-blue-500" />;
      case 'subscribe': return <Mail className="w-4 h-4 text-green-500" />;
      case 'download': return <Download className="w-4 h-4 text-purple-500" />;
      case 'share': return <Share className="w-4 h-4 text-orange-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: VisitorActivity['type']) => {
    switch (type) {
      case 'visit': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      case 'subscribe': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'download': return 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20';
      case 'share': return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20';
      default: return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800';
    }
  };

  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
      {activities.slice(0, 10).map((activity, index) => (
        <div
          key={activity.id}
          className={`p-3 rounded-lg border ${getActivityColor(activity.type)} animate-fade-in`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                {activity.details}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {activity.country}
                </span>
                <span className="w-1 h-1 bg-gray-400 rounded-full" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {timeAgo(activity.timestamp)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function ImpactReachDashboard() {
  const [realtimeMetrics, setRealtimeMetrics] = useState<RealtimeMetrics | null>(null);
  const [impactMetrics, setImpactMetrics] = useState<ImpactMetrics | null>(null);
  const [visitorActivities, setVisitorActivities] = useState<VisitorActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'geographic' | 'activity'>('overview');

  useEffect(() => {
    // Subscribe to real-time metrics
    const realtimeSubscription = realtimeAnalyticsService.subscribeToRealtimeMetrics((metrics) => {
      setRealtimeMetrics(metrics);
      setIsLoading(false);
    });

    // Subscribe to visitor activities
    const activitiesSubscription = realtimeAnalyticsService.subscribeToVisitorActivities((activities) => {
      setVisitorActivities(activities);
    });

    // Get impact metrics
    setImpactMetrics(realtimeAnalyticsService.getImpactMetrics());

    // Cleanup subscriptions
    return () => {
      realtimeAnalyticsService.unsubscribe(realtimeSubscription);
      realtimeAnalyticsService.unsubscribe(activitiesSubscription);
    };
  }, []);

  if (isLoading || !realtimeMetrics || !impactMetrics) {
    return (
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading real-time analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  const mainMetrics = [
    {
      icon: <Users className="w-8 h-8" />,
      label: 'Active Users',
      value: realtimeMetrics.activeUsers,
      suffix: '',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      trend: '+12%',
      trendUp: true
    },
    {
      icon: <Globe className="w-8 h-8" />,
      label: 'Total Reach',
      value: impactMetrics.totalReach,
      suffix: '',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      trend: '+8%',
      trendUp: true
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      label: 'Countries',
      value: impactMetrics.countriesReached,
      suffix: '',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      trend: '+3',
      trendUp: true
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      label: 'Monthly Readers',
      value: impactMetrics.monthlyReaders,
      suffix: '',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      trend: '+15%',
      trendUp: true
    }
  ];

  const secondaryMetrics = [
    {
      icon: <Eye className="w-6 h-6" />,
      label: 'Page Views Today',
      value: realtimeMetrics.pageViewsToday,
      color: 'text-blue-500'
    },
    {
      icon: <Clock className="w-6 h-6" />,
      label: 'Avg. Session',
      value: Math.round(realtimeMetrics.avgSessionDuration),
      suffix: 's',
      color: 'text-green-500'
    },
    {
      icon: <Target className="w-6 h-6" />,
      label: 'Bounce Rate',
      value: (realtimeMetrics.bounceRate * 100),
      suffix: '%',
      decimals: 1,
      color: 'text-orange-500'
    },
    {
      icon: <Server className="w-6 h-6" />,
      label: 'Uptime',
      value: impactMetrics.systemUptime,
      suffix: '%',
      decimals: 2,
      color: 'text-purple-500'
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
            <Activity className="w-4 h-4 mr-2" />
            Live Impact & Reach Analytics
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Real-Time <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Global Impact</span>
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            See how Carelwave Media is reaching developers and tech professionals around the world in real-time.
          </p>
        </div>

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {mainMetrics.map((metric, index) => (
            <div
              key={metric.label}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${metric.bgColor} ${metric.color}`}>
                  {metric.icon}
                </div>
                <div className={`flex items-center space-x-1 text-sm font-medium ${
                  metric.trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {metric.trendUp ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  <span>{metric.trend}</span>
                </div>
              </div>
              
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                <AnimatedCounter 
                  value={metric.value} 
                  suffix={metric.suffix}
                  decimals={metric.label === 'Uptime' ? 2 : 0}
                />
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                {metric.label}
              </p>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-1 shadow-lg border border-gray-200 dark:border-gray-700">
            {[
              { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'geographic', label: 'Geographic', icon: <Globe className="w-4 h-4" /> },
              { id: 'activity', label: 'Live Activity', icon: <Zap className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  selectedTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                {/* Secondary Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {secondaryMetrics.map((metric, index) => (
                    <div
                      key={metric.label}
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className={`${metric.color} mb-2`}>
                        {metric.icon}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        <AnimatedCounter 
                          value={metric.value} 
                          suffix={metric.suffix || ''}
                          decimals={metric.decimals || 0}
                        />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {metric.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Professional Achievements */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <Star className="w-6 h-6 text-yellow-500 mr-3" />
                    Professional Impact
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { label: 'Articles Published', value: impactMetrics.articlesPublished, icon: '📚' },
                      { label: 'Newsletter Subscribers', value: impactMetrics.newsletterSubscribers, icon: '📧' },
                      { label: 'GitHub Stars', value: impactMetrics.githubStars, icon: '⭐' },
                      { label: 'LinkedIn Followers', value: impactMetrics.linkedinFollowers, icon: '💼' }
                    ].map((achievement, index) => (
                      <div key={achievement.label} className="text-center">
                        <div className="text-2xl mb-2">{achievement.icon}</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          <AnimatedCounter value={achievement.value} />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {achievement.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'geographic' && (
              <div className="space-y-6">
                {/* World Map */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                      <Globe className="w-6 h-6 text-blue-500 mr-3" />
                      Global Reach
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span>Live Updates</span>
                    </div>
                  </div>
                  
                  <WorldMap countries={realtimeMetrics.topCountries} />
                </div>

                {/* Top Countries */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    Top Countries
                  </h3>
                  
                  <div className="space-y-4">
                    {realtimeMetrics.topCountries.slice(0, 6).map((country, index) => (
                      <div key={country.countryCode} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{country.countryCode === 'IN' ? '🇮🇳' : 
                                                       country.countryCode === 'US' ? '🇺🇸' :
                                                       country.countryCode === 'DE' ? '🇩🇪' :
                                                       country.countryCode === 'GB' ? '🇬🇧' :
                                                       country.countryCode === 'CA' ? '🇨🇦' : '🌍'}</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {country.country}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {country.users} users
                          </span>
                          <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${Math.min(country.percentage * 2, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'activity' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Activity className="w-6 h-6 text-green-500 mr-3" />
                    Live Visitor Activity
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span>Real-time</span>
                  </div>
                </div>
                
                <VisitorActivityFeed activities={visitorActivities} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Real-time Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Zap className="w-5 h-5 text-yellow-500 mr-2" />
                Right Now
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Active Users</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    <AnimatedCounter value={realtimeMetrics.activeUsers} />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Sessions Today</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    <AnimatedCounter value={realtimeMetrics.sessionsToday} />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Page Views</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    <AnimatedCounter value={realtimeMetrics.pageViewsToday} />
                  </span>
                </div>
              </div>
            </div>

            {/* Growth Trends */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                Growth Trends
              </h3>
              
              <div className="space-y-4">
                {[
                  { label: 'Daily Growth', value: '+12%', color: 'text-green-600' },
                  { label: 'Weekly Growth', value: '+8%', color: 'text-blue-600' },
                  { label: 'Monthly Growth', value: '+25%', color: 'text-purple-600' }
                ].map((trend) => (
                  <div key={trend.label} className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{trend.label}</span>
                    <span className={`font-bold ${trend.color}`}>{trend.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Server className="w-5 h-5 text-blue-500 mr-2" />
                System Health
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Uptime</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    <AnimatedCounter 
                      value={impactMetrics.systemUptime} 
                      suffix="%" 
                      decimals={2} 
                    />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Response Time</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">127ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status</span>
                  <span className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-600 dark:text-green-400 font-bold">Operational</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Analytics powered by Google Analytics • Updates every 15 seconds • 
            <span className="text-blue-600 dark:text-blue-400 font-medium"> ID: G-PLQ0H8HTTZ</span>
          </p>
        </div>
      </div>
    </section>
  );
} 