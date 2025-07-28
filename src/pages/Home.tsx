import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Mail, Github, Linkedin, Twitter, 
  TrendingUp, Users, BookOpen, Star, Play, Sparkles,
  Zap, Brain, Calendar, Target, Heart, Award, Eye,
  MessageSquare, Share2, Clock, Mic, MicOff
} from 'lucide-react';
import { toast } from 'sonner';
import { ModernButton, ModernCard } from '../components/ModernDesignSystem';
import Newsletter from '../components/Newsletter';
import { firebasePostsService } from '../services/firebase/posts.service';
import { productionAnalyticsService } from '../services/analytics/production-analytics.service';
import { useVoiceCommands } from '../hooks/useVoiceCommands';

// Enhanced user behavior tracking
const useAIPersonalization = () => {
  const [userBehavior, setUserBehavior] = useState({
    deviceType: typeof window !== 'undefined' ? 
      (window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop') : 'desktop',
    timeOnSite: 0,
    scrollDepth: 0,
    clickPattern: 'explorer',
    engagementLevel: 'medium',
    preferredContentType: 'article',
    readingSpeed: 'normal'
  });

  useEffect(() => {
    const startTime = Date.now();
    let maxScrollDepth = 0;
    let clickCount = 0;

    const trackScrollDepth = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      
      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent;
        setUserBehavior(prev => ({ ...prev, scrollDepth: Math.round(scrollPercent) }));
      }
    };

    const trackClicks = () => {
      clickCount++;
      const pattern = clickCount > 10 ? 'explorer' : clickCount > 5 ? 'focused' : 'casual';
      setUserBehavior(prev => ({ ...prev, clickPattern: pattern }));
    };

    const trackTimeOnSite = () => {
      const timeOnSite = Math.round((Date.now() - startTime) / 1000);
      const engagementLevel = timeOnSite > 120 ? 'high' : timeOnSite > 30 ? 'medium' : 'low';
      setUserBehavior(prev => ({ 
        ...prev, 
        timeOnSite, 
        engagementLevel 
      }));
    };

    window.addEventListener('scroll', trackScrollDepth);
    document.addEventListener('click', trackClicks);
    const timeInterval = setInterval(trackTimeOnSite, 10000);

    return () => {
      window.removeEventListener('scroll', trackScrollDepth);
      document.removeEventListener('click', trackClicks);
      clearInterval(timeInterval);
    };
  }, []);

  return userBehavior;
};

export default function Home() {
  const [featuredPosts, setFeaturedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [realStats, setRealStats] = useState({
    totalArticles: 0,
    totalNewsletterSubscribers: 0,
    githubStars: 0,
    totalPageViews: 0,
    githubRepos: 0,
    approvedReviews: 0
  });

  // Enhanced AI personalization
  const userBehavior = useAIPersonalization();
  
  // Voice commands integration
  const {
    isListening,
    isSupported: voiceSupported,
    toggleListening,
    speak,
    amplitude,
    lastCommand,
    availableCommands
  } = useVoiceCommands();

  // Load data with enhanced error handling
  const loadHomePageData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Parallel data loading for optimal performance
      const [posts, analytics] = await Promise.all([
        firebasePostsService.getFeaturedPosts(3),
        productionAnalyticsService.getRealTimeMetrics()
      ]);

      setFeaturedPosts(posts);
      setRealStats({
        totalArticles: analytics.totalArticles,
        totalNewsletterSubscribers: analytics.totalNewsletterSubscribers,
        githubStars: analytics.githubStars,
        totalPageViews: analytics.totalPageViews,
        githubRepos: analytics.githubRepos,
        approvedReviews: analytics.approvedReviews
      });
    } catch (error) {
      console.error('Error loading home page data:', error);
      // Fallback data for graceful degradation
      setRealStats({
        totalArticles: 0,
        totalNewsletterSubscribers: 0,
        githubStars: 0,
        totalPageViews: 0,
        githubRepos: 0,
        approvedReviews: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHomePageData();
  }, [loadHomePageData]);

  // Format numbers with modern notation
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Enhanced typography and spacing constants
  const boldHeroStyle = {
    fontWeight: '900',
    lineHeight: '0.9',
    letterSpacing: '-0.02em'
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section with AI-Powered Personalized Greeting */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='rgba(59,130,246,0.05)' stroke-width='1'/%3E%3C/svg%3E")`
             }} 
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* AI-Powered Personalized Greeting */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-flow-subtle text-white rounded-full text-sm font-medium mb-4">
              <Brain className="w-4 h-4 mr-2" />
              {userBehavior.deviceType === 'mobile' ? 'Mobile Experience' : 'Desktop Experience'} • 
              {userBehavior.engagementLevel === 'high' ? ' Engaged Reader' : ' Welcome Back'}
            </div>
          </div>

          {/* Voice Command Visualization */}
          {isListening && (
            <div className="fixed top-20 right-4 z-50 p-4 bg-gradient-flow rounded-xl text-white shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
                <span className="text-sm font-medium">Listening...</span>
                <div 
                  className="w-8 h-1 bg-white/30 rounded-full overflow-hidden"
                >
                  <div 
                    className="h-full voice-amplitude rounded-full transition-all duration-100"
                    style={{ width: `${amplitude * 100}%` }}
                  />
                </div>
              </div>
              {lastCommand && (
                <div className="text-xs text-white/80 mt-2">
                  Last: "{lastCommand}"
                </div>
              )}
            </div>
          )}

          {/* Bold Typography Hero */}
          <h1 
            className="text-display mb-6 text-gradient-flow animate-fade-in text-high-contrast"
            style={boldHeroStyle}
          >
            Building the Future of{' '}
            <span className="relative">
              Technology
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-flow opacity-30 rounded-full transform scale-x-0 animate-scale-in delay-500" />
            </span>
          </h1>

          <p className="text-xl text-medium-contrast mb-12 max-w-3xl mx-auto animate-fade-in delay-200">
            {userBehavior.engagementLevel === 'high' 
              ? "Welcome back! Discover cutting-edge insights, tutorials, and innovations that are shaping tomorrow's digital landscape."
              : "Discover cutting-edge insights, tutorials, and innovations that are shaping tomorrow's digital landscape."
            }
          </p>

          {/* CTA Buttons with Voice Integration */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <ModernButton
              variant="default"
              intent="primary"
              size="xl"
              icon={ArrowRight}
              iconPosition="right"
              href="/blog"
              className="min-w-[200px] transform hover:scale-105"
            >
              Explore Articles
            </ModernButton>

            {voiceSupported && (
              <ModernButton
                variant="glass"
                intent="secondary"
                size="xl"
                icon={isListening ? MicOff : Mic}
                iconPosition="left"
                onClick={toggleListening}
                className="min-w-[200px]"
              >
                {isListening ? 'Stop Voice' : 'Voice Commands'}
              </ModernButton>
            )}

            <ModernButton
              variant="neumorphic"
              intent="accent"
              size="xl"
              icon={Sparkles}
              iconPosition="left"
              onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
              className="min-w-[200px]"
            >
              Discover More
            </ModernButton>
          </div>

          {/* Live Analytics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient-accent mb-2">
                {formatNumber(realStats.totalArticles)}
              </div>
              <div className="text-medium-contrast">Articles Published</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-holographic mb-2">
                {formatNumber(realStats.totalNewsletterSubscribers)}
              </div>
              <div className="text-medium-contrast">Newsletter Subscribers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient-flow mb-2">
                {formatNumber(realStats.totalPageViews)}
              </div>
              <div className="text-medium-contrast">Page Views</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-accent-primary mb-2">
                {formatNumber(realStats.githubStars)}
              </div>
              <div className="text-medium-contrast">GitHub Stars</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Content Section */}
      <section className="py-20 bg-high-contrast" id="featured-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-high-contrast mb-6 text-gradient-flow">
              Featured Content
            </h2>
            <p className="text-xl text-medium-contrast max-w-3xl mx-auto">
              Hand-picked articles and tutorials that showcase the latest in technology innovation.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <ModernCard key={i} variant="neumorphic" padding="lg" className="animate-pulse">
                  <div className="h-48 bg-low-contrast rounded-lg mb-4" />
                  <div className="h-6 bg-low-contrast rounded mb-2" />
                  <div className="h-4 bg-low-contrast rounded w-3/4" />
                </ModernCard>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPosts.map((post, index) => (
                <ModernCard 
                  key={post.id} 
                  variant="default" 
                  padding="lg" 
                  hover
                  className="group"
                >
                  <div className="relative mb-4 overflow-hidden rounded-lg">
                    <img
                      src={post.imageUrl || `/api/placeholder/400/240`}
                      alt={post.title}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-flow opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-high-contrast mb-3 group-hover:text-gradient-accent transition-colors duration-200">
                    {post.title}
                  </h3>
                  
                  <p className="text-medium-contrast mb-4 line-clamp-3">
                    {post.excerpt || post.content?.substring(0, 120) + '...'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-low-contrast">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </div>
                    
                    <ModernButton
                      variant="minimal"
                      intent="primary"
                      size="sm"
                      icon={ArrowRight}
                      href={`/blog/${post.id}`}
                    >
                      Read More
                    </ModernButton>
                  </div>
                </ModernCard>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Voice Commands Help Section */}
      {voiceSupported && (
        <section className="py-12 bg-medium-contrast">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-xl font-bold mb-4 text-high-contrast">Voice Navigation</h3>
            <p className="text-medium-contrast mb-6">
              Use voice commands to navigate and interact with content hands-free
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {availableCommands.slice(0, 6).map((cmd, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-low-contrast text-high-contrast rounded-full text-sm"
                >
                  "{cmd.command}"
                </span>
              ))}
            </div>
            
            <ModernButton
              variant="neumorphic"
              intent="accent"
              icon={isListening ? MicOff : Mic}
              onClick={toggleListening}
            >
              {isListening ? 'Stop Listening' : 'Try Voice Commands'}
            </ModernButton>
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section id="newsletter">
        <Newsletter />
      </section>
    </div>
  );
}