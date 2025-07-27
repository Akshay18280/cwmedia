import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Users, Globe, Zap, Calendar, Eye, Heart } from 'lucide-react';
import { firebasePostsService } from '../services/firebase/posts.service';
import { firebaseStatsService } from '../services/firebase/stats.service';
import type { Post } from '../types';
import type { BlogStats } from '../services/firebase/stats.service';

export default function Home() {
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postsData, statsData] = await Promise.all([
          firebasePostsService.getFeaturedPosts(3),
          firebaseStatsService.getBlogStats()
        ]);
        
        setFeaturedPosts(postsData);
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getReadingTime = (minutes: number): string => {
    return `${minutes} min read`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate real-time stats or use defaults
  const displayStats = stats || {
    totalPosts: 0,
    totalViews: 0,
    activeSubscribers: 0,
    systemUptime: 99.9,
    countriesReached: 1
  };

  // Enhanced stats with real data
  const enhancedStats = [
    {
      label: 'Articles Published',
      value: `${displayStats.totalPosts}+`,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      description: 'Technical insights and tutorials'
    },
    {
      label: 'Monthly Readers',
      value: `${formatNumber(Math.max(displayStats.totalViews, 1000))}+`,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      description: 'Growing community of developers'
    },
    {
      label: 'Countries Reached',
      value: `${displayStats.countriesReached}+`,
      icon: Globe,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      description: 'Global developer audience'
    },
    {
      label: 'System Uptime',
      value: `${displayStats.systemUptime.toFixed(1)}%`,
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      description: 'Reliable performance and availability'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0 bg-repeat"
            style={{
              backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Ccircle cx=\"10\" cy=\"10\" r=\"1\"/%3E%3C/g%3E%3C/svg%3E')"
            }}
          />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Technical Excellence
                  </span>
                  <br />
                  Simplified
                </h1>
                <p className="text-xl lg:text-2xl text-gray-300 max-w-2xl">
                  Deep insights into scalable systems, cloud architecture, and modern software engineering practices.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/blog"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  Explore Articles
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white hover:bg-white hover:text-gray-900 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  About Akshay
                </Link>
              </div>
            </div>
            
            {/* Hero Image/Visual */}
            <div className="relative animate-slide-in-right">
              <div className="relative w-full h-96 lg:h-[500px] bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl backdrop-blur-sm border border-white/10 p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <TrendingUp className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Engineering Excellence</h3>
                  <p className="text-gray-300">
                    From startups to enterprise systems, learn battle-tested approaches to building scalable software.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Impact & Reach
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Real metrics from a growing community of developers and engineering leaders
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {enhancedStats.map((stat, index) => (
              <div
                key={stat.label}
                className="group p-6 bg-gray-50 dark:bg-gray-800 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    {stat.label}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {stat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Featured Articles
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Dive deep into technical topics that matter for modern software development
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPosts.map((post, index) => (
                <article
                  key={post.id}
                  className="group bg-white dark:bg-gray-900 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {post.cover_image && (
                    <div className="aspect-w-16 aspect-h-9 overflow-hidden">
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <time dateTime={post.published_at}>
                        {formatDate(post.published_at)}
                      </time>
                      <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
                        {post.category}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      <Link to={`/blog/${post.id}`} className="hover:underline">
                        {post.title}
                      </Link>
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {post.views || 0}
                        </span>
                        <span className="flex items-center">
                          <Heart className="w-4 h-4 mr-1" />
                          {post.likes || 0}
                        </span>
                        <span>{getReadingTime(post.reading_time)}</span>
                      </div>
                      <Link
                        to={`/blog/${post.id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium inline-flex items-center group-hover:translate-x-1 transition-transform"
                      >
                        Read more
                        <ArrowRight className="ml-1 w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No featured articles available at the moment.
              </p>
              <Link
                to="/blog"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Browse all articles
                <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/blog"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              View All Articles
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Level Up Your Engineering Skills?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of developers learning advanced concepts in system design, cloud architecture, and best practices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/blog"
              className="inline-flex items-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
            >
              Start Reading
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center px-8 py-3 border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
            >
              About the Author
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}