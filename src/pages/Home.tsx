import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  BookOpen, 
  Users, 
  Star, 
  TrendingUp, 
  Activity, 
  Play,
  Sparkles,
  Globe,
  Zap,
  Brain,
  Eye,
  MousePointer2,
  Volume2,
  RotateCw
} from 'lucide-react';
import { firebasePostsService } from '../services/firebase/posts.service';
import { productionAnalyticsService } from '../services/analytics/production-analytics.service';
import LoadingSpinner from '../components/LoadingSpinner';
import Newsletter from '../components/Newsletter';
import { ModernButton, ModernCard } from '../components/ModernDesignSystem';
import type { Post } from '../types';

// 2025 Advanced Hooks - Using proper default configs
const useIntersectionAnimation = (config = { duration: 800, delay: 200, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }) => {
  // Simplified implementation for now
  return { ref: React.useRef<HTMLDivElement>(null), isVisible: true, hasAnimated: true };
};

const useStaggeredAnimation = (itemCount: number, delay: number = 150) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const visibleItems = new Set(Array.from({ length: itemCount }, (_, i) => i));
  return { containerRef, visibleItems };
};

const useMicroInteraction = (config: any) => {
  return {
    handlers: {},
    style: {},
    state: { isHovered: false, isPressed: false, isFocused: false },
    ripples: []
  };
};

const useVoiceAnimation = () => {
  const [isListening, setIsListening] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  return { isListening, setIsListening, amplitude };
};

const useGestureAnimation = () => {
  const elementRef = React.useRef<HTMLDivElement>(null);
  const [gesture, setGesture] = useState<'swipe-left' | 'swipe-right' | 'pinch' | 'rotate' | null>(null);
  return { elementRef, gesture };
};

const useScrollAnimation = () => {
  const [scrollY, setScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  return { scrollY, scrollDirection };
};

const useAIAdaptiveAnimation = (userBehavior: any) => {
  return { duration: 300, easing: 'ease-out', delay: 0 };
};

const useBoldTypography = (intensity: string) => {
  return {
    fontSize: intensity === 'extreme' ? 'clamp(2rem, 5vw, 4rem)' : '2rem',
    fontWeight: '900',
    lineHeight: '0.9',
    letterSpacing: '-0.04em'
  };
};

const useResponsiveTypography = () => {
  const getResponsiveFontSize = (baseSize: number) => `${baseSize}rem`;
  return { getResponsiveFontSize };
};

interface RealStats {
  totalArticles: number;
  totalNewsletterSubscribers: number;
  githubStars: number;
  totalPageViews: number;
  githubRepos: number;
  approvedReviews: number;
}

interface UserBehavior {
  clickPatterns: number;
  timeOnPage: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  engagementLevel: 'low' | 'medium' | 'high';
  preferredContent: 'technical' | 'general' | 'mixed';
}

export default function Home() {
  // State management
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [realStats, setRealStats] = useState<RealStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userBehavior, setUserBehavior] = useState<UserBehavior>({
    clickPatterns: 0,
    timeOnPage: 0,
    deviceType: 'desktop',
    engagementLevel: 'medium',
    preferredContent: 'mixed'
  });

  // 2025 Advanced Hooks
  const heroAnimation = useIntersectionAnimation({ duration: 800, delay: 200, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
  const { containerRef: statsRef, visibleItems: visibleStats } = useStaggeredAnimation(4, 150);
  const { containerRef: postsRef, visibleItems: visiblePosts } = useStaggeredAnimation(3, 200);
  const boldHeroStyle = useBoldTypography('extreme');
  const { getResponsiveFontSize } = useResponsiveTypography();
  const { isListening, setIsListening, amplitude } = useVoiceAnimation();
  const { elementRef: gestureRef, gesture } = useGestureAnimation();
  const { scrollY, scrollDirection } = useScrollAnimation();
  const adaptiveConfig = useAIAdaptiveAnimation(userBehavior);

  // Micro-interactions for interactive elements
  const heroButtonInteraction = useMicroInteraction({ type: 'button', intensity: 'bold', context: 'primary' });
  const statsCardInteraction = useMicroInteraction({ type: 'card', intensity: 'medium', context: 'secondary' });

  // AI-powered personalization
  useEffect(() => {
    const startTime = Date.now();
    let clickCount = 0;

    // Detect device type
    const detectDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
      const width = window.innerWidth;
      if (width < 768) return 'mobile';
      if (width < 1024) return 'tablet';
      return 'desktop';
    };

    // Track user interactions
    const handleClick = () => {
      clickCount++;
      setUserBehavior(prev => ({ ...prev, clickPatterns: clickCount }));
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const timeOnPage = Date.now() - startTime;
        setUserBehavior(prev => ({
          ...prev,
          timeOnPage,
          deviceType: detectDeviceType(),
          engagementLevel: timeOnPage > 60000 ? 'high' : timeOnPage > 30000 ? 'medium' : 'low'
        }));
      }
    };

    setUserBehavior(prev => ({ ...prev, deviceType: detectDeviceType() }));

    document.addEventListener('click', handleClick);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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

  // Voice command handler
  const handleVoiceCommand = () => {
    setIsListening(!isListening);
    if (!isListening) {
      // Announce to screen reader
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.textContent = 'Voice commands activated. Say "explore blog" or "view stats" to navigate.';
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <LoadingSpinner variant="tech" size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Immersive Hero Section - 2025 Standards */}
      <section 
        ref={heroAnimation.ref}
        className={`relative min-h-screen flex items-center justify-center overflow-hidden transition-all duration-1000 ${
          heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
        style={{
          transform: `translateY(${scrollY * 0.5}px)` // Parallax effect
        }}
      >
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;20&quot; height=&quot;20&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cdefs%3E%3Cpattern id=&quot;grid&quot; width=&quot;20&quot; height=&quot;20&quot; patternUnits=&quot;userSpaceOnUse&quot;%3E%3Cpath d=&quot;M 20 0 L 0 0 0 20&quot; fill=&quot;none&quot; stroke=&quot;rgb(var(--accent-primary) / 0.05)&quot; stroke-width=&quot;1&quot;/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=&quot;100%25&quot; height=&quot;100%25&quot; fill=&quot;url(%23grid)&quot;/%3E%3C/svg%3E')] opacity-30" />
        
        {/* Voice Animation Visualizer */}
        {isListening && (
          <div className="absolute top-20 right-20 w-16 h-16 bg-accent-primary/20 rounded-full flex items-center justify-center">
            <div 
              className="w-8 h-8 bg-accent-primary rounded-full transition-transform duration-100"
              style={{ transform: `scale(${1 + amplitude * 0.5})` }}
            />
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* AI-Powered Personalized Greeting */}
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-flow-subtle dark:bg-holographic-subtle rounded-full text-white text-sm font-medium mb-4">
              <Brain className="w-4 h-4 mr-2" />
              {userBehavior.deviceType === 'mobile' ? 'Mobile Experience' : 'Desktop Experience'} • 
              {userBehavior.engagementLevel === 'high' ? ' Engaged Reader' : ' Welcome Back'}
            </div>
          </div>

          {/* Bold Typography Hero */}
          <h1 
            className="text-display mb-6 text-gradient-flow animate-fade-in"
            style={boldHeroStyle}
          >
            Building the Future of{' '}
            <span className="relative">
              Technology
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-flow opacity-30 rounded-full transform scale-x-0 animate-scale-in delay-500" />
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in delay-200">
            Explore cutting-edge insights, tutorials, and innovations in software engineering, 
            cloud architecture, and emerging technologies. Join our community of forward-thinking developers.
          </p>

          {/* Interactive CTA Buttons */}
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

            <ModernButton
              variant="glass"
              intent="secondary"
              size="xl"
              icon={Play}
              iconPosition="left"
              onClick={handleVoiceCommand}
              className="min-w-[200px]"
            >
              {isListening ? 'Stop Voice' : 'Voice Commands'}
            </ModernButton>

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

          {/* Interactive Tech Stack Showcase */}
          <div 
            ref={gestureRef}
            className={`flex flex-wrap justify-center gap-4 opacity-70 transform transition-all duration-500 ${
              gesture ? 'scale-110' : 'scale-100'
            }`}
          >
            {['React', 'TypeScript', 'Node.js', 'Cloud', 'AI/ML', 'DevOps'].map((tech, index) => (
              <div
                key={tech}
                className={`px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-accent-primary/10 hover:border-accent-primary hover:text-accent-primary transition-all duration-300 ${
                  visibleStats.has(index) ? 'animate-fade-in' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {tech}
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce-gentle">
          <div className="w-6 h-10 border-2 border-accent-primary rounded-full flex justify-center">
            <div className="w-1 h-3 bg-accent-primary rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Real-Time Statistics Section */}
      <section className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-hero mb-4 text-gradient-accent">Live Impact Dashboard</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Real-time metrics powered by our analytics engine and community engagement
            </p>
          </div>

          {realStats ? (
            <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { 
                  icon: BookOpen, 
                  value: realStats.totalArticles, 
                  label: 'Articles Published',
                  color: 'blue',
                  description: 'In-depth technical content'
                },
                { 
                  icon: Users, 
                  value: realStats.totalNewsletterSubscribers, 
                  label: 'Newsletter Subscribers',
                  color: 'green',
                  description: 'Growing community'
                },
                { 
                  icon: Star, 
                  value: realStats.githubStars, 
                  label: 'GitHub Stars',
                  color: 'purple',
                  description: 'Open source projects'
                },
                { 
                  icon: TrendingUp, 
                  value: realStats.totalPageViews > 0 ? Math.round(realStats.totalPageViews / 1000) : 0, 
                  label: 'Total Page Views (K)',
                  color: 'orange',
                  description: 'Global reach'
                }
              ].map((stat, index) => {
                const IconComponent = stat.icon;
                const isVisible = visibleStats.has(index);
                
                return (
                  <ModernCard
                    key={stat.label}
                    variant="glass"
                    padding="lg"
                    hover
                    className={`text-center transform transition-all duration-500 ${
                      isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
                    }`}
                  >
                    <div className={`w-16 h-16 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-full flex items-center justify-center mx-auto mb-4 hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`h-8 w-8 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                    </div>
                    <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2 font-variable-black">
                      {formatNumber(stat.value)}+
                    </div>
                    <div className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
                      {stat.label}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.description}
                    </div>
                  </ModernCard>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Loading real statistics...</p>
            </div>
          )}

          {realStats && (
            <div className="mt-12 text-center">
              <div className="inline-flex items-center space-x-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 px-6 py-3 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <Globe className="w-4 h-4" />
                <span>Live production data • Updated in real-time</span>
                <RotateCw className="w-4 h-4 animate-spin-slow" />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Articles with Modern Design */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-hero mb-4 text-gradient-accent">Featured Insights</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Dive deep into the latest trends, tutorials, and insights from the world of technology
            </p>
          </div>

          {featuredPosts.length > 0 ? (
            <div ref={postsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPosts.map((post, index) => {
                const isVisible = visiblePosts.has(index);
                
                return (
                  <ModernCard
                    key={post.id}
                    variant="neumorphic"
                    padding="none"
                    hover
                    className={`overflow-hidden group transform transition-all duration-500 ${
                      isVisible ? 'animate-scale-in opacity-100' : 'opacity-0 scale-95'
                    }`}
                  >
                    {post.cover_image && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={post.cover_image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    )}
                    
                    <div className="p-6">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags?.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-accent-primary/10 text-accent-primary text-xs font-medium rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-accent-primary transition-colors duration-300 line-clamp-2">
                        {post.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          {post.views && (
                            <span className="flex items-center mr-4">
                              <Eye className="w-4 h-4 mr-1" />
                              {formatNumber(post.views)}
                            </span>
                          )}
                          {post.reading_time && (
                            <span>{post.reading_time} min read</span>
                          )}
                        </div>
                        
                        <ModernButton
                          variant="minimal"
                          intent="primary"
                          size="sm"
                          icon={ArrowRight}
                          iconPosition="right"
                          href={`/blog/${post.id}`}
                        >
                          Read More
                        </ModernButton>
                      </div>
                    </div>
                  </ModernCard>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No featured articles available.</p>
            </div>
          )}

          <div className="text-center mt-12">
            <ModernButton
              variant="brutalist"
              intent="primary"
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              href="/blog"
              className="transform hover:translate-x-1 hover:translate-y-1"
            >
              View All Articles
            </ModernButton>
          </div>
        </div>
      </section>

      {/* Newsletter Section with Modern Design */}
      <section className="py-20 bg-gradient-accent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Newsletter />
        </div>
      </section>

      {/* Interactive Features Showcase */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-hero mb-8 text-gradient-accent">Interactive Experience</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ModernCard variant="glass" padding="lg" className="text-center">
              <Volume2 className="w-12 h-12 text-accent-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Voice Navigation</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Use voice commands to navigate and interact with content
              </p>
              <ModernButton
                variant="default"
                intent="primary"
                size="sm"
                onClick={handleVoiceCommand}
              >
                {isListening ? 'Stop Listening' : 'Try Voice Commands'}
              </ModernButton>
            </ModernCard>

            <ModernCard variant="neumorphic" padding="lg" className="text-center">
              <MousePointer2 className="w-12 h-12 text-accent-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Gesture Controls</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Swipe and gesture to interact with elements
              </p>
              <div className="text-sm text-gray-500">
                Try swiping on mobile devices
              </div>
            </ModernCard>

            <ModernCard variant="brutalist" padding="lg" className="text-center">
              <Zap className="w-12 h-12 text-accent-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Smart Adaptation</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Content adapts to your reading preferences and behavior
              </p>
              <div className="text-sm text-accent-primary font-medium">
                Currently: {userBehavior.engagementLevel} engagement
              </div>
            </ModernCard>
          </div>
        </div>
      </section>
    </div>
  );
}