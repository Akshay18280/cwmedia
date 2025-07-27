import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, TrendingUp, Star, Coffee, Code, Zap } from 'lucide-react';
import Newsletter from '../components/Newsletter';
import { postsService } from '../services/posts';
import { statsService } from '../services/stats';
import type { Post } from '../types';
import type { BlogStats } from '../services/stats';

export default function Home() {
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both featured posts and stats in parallel
        const [postsResult, statsResult] = await Promise.allSettled([
          postsService.getFeaturedPosts(3).catch(() => postsService.getAllPosts().then(posts => posts.slice(0, 3))),
          statsService.getRealTimeStats()
        ]);

        if (postsResult.status === 'fulfilled') {
          setFeaturedPosts(postsResult.value);
        }

        if (statsResult.status === 'fulfilled') {
          setStats(statsResult.value);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
        setStatsLoading(false);
      }
    };

    fetchData();
  }, []);

  const highlights = [
    {
      icon: Code,
      title: "Technical Excellence",
      description: "Deep dives into Golang, AWS, and scalable architecture patterns",
      color: "blue"
    },
    {
      icon: TrendingUp,
      title: "Real-World Impact",
      description: "Stories from production systems handling millions of events",
      color: "green"
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Sharing knowledge that helps developers worldwide",
      color: "purple"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 dark:text-white">
                Welcome to{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Carelwave Media
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
                Where technology meets innovation. Join me on a journey through scalable systems, 
                cloud architecture, and the art of building software that matters.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Link 
                to="/blog" 
                className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Explore Articles
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/about" 
                className="group inline-flex items-center px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transform hover:scale-105 transition-all duration-200"
              >
                <Users className="w-5 h-5 mr-2" />
                About Akshay
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-10 w-16 mx-auto rounded"></div>
                ) : (
                  `${stats?.totalPosts || 0}+`
                )}
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Articles Published</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-10 w-16 mx-auto rounded"></div>
                ) : (
                  statsService.formatNumber(stats?.monthlyViews || 0)
                )}
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Monthly Readers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-10 w-16 mx-auto rounded"></div>
                ) : (
                  `${stats?.countriesReached || 1}+`
                )}
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Countries Reached</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-10 w-16 mx-auto rounded"></div>
                ) : (
                  statsService.formatUptime(stats?.systemUptime || 99.9)
                )}
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">System Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Find Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What You'll Discover
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Insights from the trenches of software engineering, cloud infrastructure, and scalable system design
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {highlights.map((highlight, index) => (
              <div 
                key={index}
                className="group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className={`w-16 h-16 rounded-xl bg-${highlight.color}-100 dark:bg-${highlight.color}-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <highlight.icon className={`w-8 h-8 text-${highlight.color}-600 dark:text-${highlight.color}-400`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {highlight.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {highlight.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900 rounded-full text-blue-600 dark:text-blue-400 text-sm font-medium mb-4">
              <Star className="w-4 h-4 mr-2" />
              Featured Content
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Latest Insights
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Deep technical content that helps you build better, more scalable systems
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPosts.length > 0 ? (
                featuredPosts.map((post, index) => (
                  <article 
                    key={post.id} 
                    className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={post.cover_image || "https://images.unsplash.com/photo-1605379399642-870262d3d051?q=80&w=1200"} 
                        alt={post.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/90 text-gray-800 backdrop-blur-sm">
                          {post.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <time>{new Date(post.published_at).toLocaleDateString()}</time>
                        <span className="flex items-center">
                          <Coffee className="w-4 h-4 mr-1" />
                          {post.reading_time} min read
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                      <Link 
                        to={`/blog/${post.id}`} 
                        className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        Read Article
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </article>
                ))
              ) : (
                <div className="col-span-full text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                    Content Coming Soon
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Amazing technical content is being crafted. Stay tuned!
                  </p>
                  <Link 
                    to="/about" 
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Learn About Akshay
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {featuredPosts.length > 0 && (
            <div className="text-center mt-12">
              <Link 
                to="/blog" 
                className="group inline-flex items-center px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                View All Articles
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold mb-4">
                Ready to Level Up Your Engineering?
              </h2>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                Join thousands of developers who get insights on building scalable, 
                high-performance systems delivered straight to their inbox.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                to="/blog" 
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Reading
              </Link>
              <Link 
                to="/about" 
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-blue-600 transform hover:scale-105 transition-all duration-200"
              >
                <Users className="w-5 h-5 mr-2" />
                Connect with Akshay
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Newsletter />
    </div>
  );
}