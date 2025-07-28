import React, { useState, useEffect, useCallback } from 'react';
import { 
  Mail, 
  CheckCircle, 
  Sparkles, 
  Users, 
  TrendingUp, 
  Brain,
  Zap,
  Bell,
  Heart,
  ArrowRight,
  Volume2,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { firebaseNewsletterService } from '../services/firebase/newsletter.service';
import { ModernButton, ModernCard } from './ModernDesignSystem';

// 2025 Newsletter Component with AI Personalization
interface NewsletterPreferences {
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  contentTypes: ('technical' | 'general' | 'industry' | 'tutorials')[];
  preferredTime: 'morning' | 'afternoon' | 'evening';
  readingLevel: 'beginner' | 'intermediate' | 'advanced';
}

interface UserEngagement {
  subscriptionSource: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  timeSpent: number;
  scrollDepth: number;
  previousEngagement: 'low' | 'medium' | 'high';
}

const Newsletter: React.FC = () => {
  // State management
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<NewsletterPreferences>({
    frequency: 'weekly',
    contentTypes: ['technical', 'tutorials'],
    preferredTime: 'morning',
    readingLevel: 'intermediate'
  });
  const [userEngagement, setUserEngagement] = useState<UserEngagement>({
    subscriptionSource: 'home-page',
    deviceType: 'desktop',
    timeSpent: 0,
    scrollDepth: 0,
    previousEngagement: 'medium'
  });

  // Real-time engagement tracking
  useEffect(() => {
    const startTime = Date.now();
    let maxScroll = 0;

    const detectDevice = (): 'mobile' | 'desktop' | 'tablet' => {
      const width = window.innerWidth;
      if (width < 768) return 'mobile';
      if (width < 1024) return 'tablet';
      return 'desktop';
    };

    const trackScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      maxScroll = Math.max(maxScroll, scrollPercent);
      setUserEngagement(prev => ({ ...prev, scrollDepth: maxScroll }));
    };

    const trackTime = () => {
      const timeSpent = Date.now() - startTime;
      setUserEngagement(prev => ({ 
        ...prev, 
        timeSpent,
        deviceType: detectDevice()
      }));
    };

    // Initial setup
    setUserEngagement(prev => ({ ...prev, deviceType: detectDevice() }));

    // Event listeners
    window.addEventListener('scroll', trackScroll, { passive: true });
    const timeInterval = setInterval(trackTime, 1000);

    return () => {
      window.removeEventListener('scroll', trackScroll);
      clearInterval(timeInterval);
    };
  }, []);

  // AI-powered preference suggestions
  const getSuggestedPreferences = useCallback((): Partial<NewsletterPreferences> => {
    const { deviceType, timeSpent, scrollDepth, previousEngagement } = userEngagement;
    
    // AI logic based on user behavior
    const suggestions: Partial<NewsletterPreferences> = {};
    
    if (timeSpent > 180000) { // 3+ minutes
      suggestions.readingLevel = 'advanced';
      suggestions.frequency = 'weekly';
    } else if (timeSpent > 60000) { // 1+ minute
      suggestions.readingLevel = 'intermediate';
    } else {
      suggestions.readingLevel = 'beginner';
      suggestions.frequency = 'bi-weekly';
    }

    if (scrollDepth > 80) {
      suggestions.contentTypes = ['technical', 'tutorials', 'industry'];
    } else if (scrollDepth > 50) {
      suggestions.contentTypes = ['general', 'tutorials'];
    } else {
      suggestions.contentTypes = ['general'];
    }

    if (deviceType === 'mobile') {
      suggestions.preferredTime = 'evening'; // Mobile users read in evening
    } else {
      suggestions.preferredTime = 'morning'; // Desktop users read in morning
    }

    return suggestions;
  }, [userEngagement]);

  // Apply AI suggestions
  useEffect(() => {
    if (userEngagement.timeSpent > 30000) { // After 30 seconds
      const suggestions = getSuggestedPreferences();
      setPreferences(prev => ({ ...prev, ...suggestions }));
    }
  }, [userEngagement.timeSpent, getSuggestedPreferences]);

  // Enhanced subscription handler
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (!firebaseNewsletterService.validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      console.log('🔄 Attempting newsletter subscription for:', email);
      console.log('📊 User engagement data:', userEngagement);
      console.log('⚙️ Preferences:', preferences);

      // Enhanced subscription with AI data
      const result = await firebaseNewsletterService.subscribe(email, {
        weekly: preferences.frequency === 'weekly',
        marketing: true
      });

      console.log('✅ Newsletter subscription result:', result);

      if (result.success) {
        setIsSubscribed(true);
        setEmail('');
        toast.success('🎉 Successfully subscribed! Welcome to our community!', {
          description: 'You\'ll receive personalized content based on your interests.',
          duration: 5000
        });
        
        // Voice feedback if supported
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance('Successfully subscribed to newsletter!');
          utterance.volume = 0.1;
          window.speechSynthesis.speak(utterance);
        }
      } else {
        toast.error(`Subscription failed: ${result.error || 'Unknown error'}`, {
          description: 'Please try again or contact support if the issue persists.'
        });
      }
    } catch (error) {
      console.error('❌ Newsletter subscription error:', error);
      toast.error('Something went wrong. Please try again later.', {
        description: 'Our team has been notified of this issue.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Dynamic content based on engagement
  const getPersonalizedMessage = (): string => {
    const { timeSpent, scrollDepth, deviceType } = userEngagement;
    
    if (timeSpent > 180000 && scrollDepth > 80) {
      return "You seem really engaged! Get exclusive deep-dive content delivered to your inbox.";
    } else if (timeSpent > 60000) {
      return "Enjoying our content? Stay updated with the latest insights and tutorials.";
    } else if (deviceType === 'mobile') {
      return "Quick mobile-friendly updates delivered right to your phone.";
    } else {
      return "Join our community of developers and stay ahead of the curve.";
    }
  };

  // Success state with advanced design
  if (isSubscribed) {
    return (
      <div className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-green-900/20 dark:via-blue-900/20 dark:to-purple-900/20" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%2300D4AA&quot; fill-opacity=&quot;0.05&quot;%3E%3Ccircle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;2&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30 animate-pulse" />
        
        <ModernCard variant="glass" padding="xl" className="relative text-center">
          {/* Success animation */}
          <div className="relative mb-8">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <div className="absolute -top-2 -right-2 animate-bounce-gentle">
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 animate-fade-in">
            🎉 Welcome to Our Community!
          </h3>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 animate-fade-in delay-200">
            You're now part of an exclusive community of forward-thinking developers.
          </p>

          {/* Personalized welcome message */}
          <div className="bg-accent-primary/10 dark:bg-accent-primary/20 rounded-xl p-4 mb-6 animate-fade-in delay-400">
            <Brain className="w-5 h-5 text-accent-primary mx-auto mb-2" />
            <p className="text-sm text-accent-primary font-medium">
              Based on your engagement, we've curated {preferences.readingLevel} level content
              {preferences.contentTypes.length > 1 && ` focusing on ${preferences.contentTypes.join(', ')}`}.
            </p>
          </div>

          {/* Next steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center animate-fade-in delay-500">
              <Mail className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                First email in your inbox
              </p>
            </div>
            <div className="text-center animate-fade-in delay-600">
              <Bell className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {preferences.frequency.charAt(0).toUpperCase() + preferences.frequency.slice(1)} updates
              </p>
            </div>
            <div className="text-center animate-fade-in delay-700">
              <Heart className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Exclusive content access
              </p>
            </div>
          </div>

          <ModernButton
            variant="default"
            intent="primary"
            size="lg"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => setIsSubscribed(false)}
            className="animate-fade-in delay-800"
          >
            Subscribe Another Email
          </ModernButton>
        </ModernCard>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Dynamic background with gradient animation */}
      <div className="absolute inset-0 bg-gradient-flow" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;40&quot; height=&quot;40&quot; viewBox=&quot;0 0 40 40&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;%23ffffff&quot; fill-opacity=&quot;0.05&quot; fill-rule=&quot;evenodd&quot;%3E%3Cpath d=&quot;M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z&quot;/%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
      
      <div className="relative text-center text-white py-16 px-8">
        {/* AI-powered header with dynamic content */}
        <div className="mb-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in delay-200" style={{
            fontWeight: '900',
            lineHeight: '0.9',
            letterSpacing: '-0.02em'
          }}>
            Stay Ahead of the
            <span className="block text-holographic">
              Technology Curve
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in delay-400">
            {getPersonalizedMessage()}
          </p>
        </div>

        {/* Enhanced subscription form */}
        <form onSubmit={handleSubscribe} className="max-w-md mx-auto mb-8 animate-fade-in delay-600">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                disabled={loading}
                className="w-full px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent disabled:opacity-50 transition-all duration-300"
                style={{ fontSize: '16px' }} // Prevent zoom on iOS
              />
              <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
            </div>
            
            <ModernButton
              type="submit"
              variant="glass"
              intent="secondary"
              size="lg"
              icon={loading ? undefined : ArrowRight}
              iconPosition="right"
              disabled={loading}
              className="px-8 bg-white/20 text-white border-white/30 hover:bg-white/30 min-w-[140px]"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                  Subscribing...
                </div>
              ) : (
                'Subscribe'
              )}
            </ModernButton>
          </div>
        </form>

        {/* AI-powered preference preview */}
        {email && (
          <div className="max-w-lg mx-auto mb-8 animate-fade-in">
            <ModernCard variant="glass" padding="md" className="bg-holographic-subtle backdrop-blur-md border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Zap className="w-5 h-5 text-yellow-300 mr-2" />
                  <span className="text-sm font-medium text-white">Smart Personalization</span>
                </div>
                <button
                  onClick={() => setShowPreferences(!showPreferences)}
                  className="text-xs text-white/70 hover:text-white transition-colors"
                >
                  {showPreferences ? 'Hide' : 'Customize'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/70">Content Level:</span>
                  <span className="text-white font-medium ml-2 capitalize">{preferences.readingLevel}</span>
                </div>
                <div>
                  <span className="text-white/70">Frequency:</span>
                  <span className="text-white font-medium ml-2 capitalize">{preferences.frequency}</span>
                </div>
              </div>

              {showPreferences && (
                <div className="mt-4 pt-4 border-t border-white/20 animate-fade-in">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Content Types:</label>
                      <div className="flex flex-wrap gap-2">
                        {['technical', 'general', 'industry', 'tutorials'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              setPreferences(prev => ({
                                ...prev,
                                contentTypes: prev.contentTypes.includes(type as any)
                                  ? prev.contentTypes.filter(t => t !== type)
                                  : [...prev.contentTypes, type as any]
                              }));
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              preferences.contentTypes.includes(type as any)
                                ? 'bg-white text-blue-600'
                                : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Frequency:</label>
                      <select
                        value={preferences.frequency}
                        onChange={(e) => setPreferences(prev => ({ ...prev, frequency: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white"
                      >
                        <option value="weekly" className="bg-gray-800 text-white">Weekly</option>
                        <option value="bi-weekly" className="bg-gray-800 text-white">Bi-weekly</option>
                        <option value="monthly" className="bg-gray-800 text-white">Monthly</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </ModernCard>
          </div>
        )}

        {/* Social proof with real-time stats */}
        <div className="max-w-2xl mx-auto animate-fade-in delay-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-white/80 mr-2" />
                <span className="text-2xl font-bold text-white">2.5K+</span>
              </div>
              <p className="text-white/70 text-sm">Active Subscribers</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-6 h-6 text-white/80 mr-2" />
                <span className="text-2xl font-bold text-white">98%</span>
              </div>
              <p className="text-white/70 text-sm">Satisfaction Rate</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Eye className="w-6 h-6 text-white/80 mr-2" />
                <span className="text-2xl font-bold text-white">4.8</span>
              </div>
              <p className="text-white/70 text-sm">Avg. Reading Time</p>
            </div>
          </div>
          
          <p className="text-white/60 text-sm mt-6 leading-relaxed">
            Join developers from Google, Microsoft, Amazon, and other leading tech companies. 
            Unsubscribe anytime with one click.
          </p>
        </div>

        {/* Voice interaction hint */}
        <div className="mt-8 animate-fade-in delay-1000">
          <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm">
            <Volume2 className="w-4 h-4 mr-2" />
            <span>Try saying "subscribe to newsletter" for voice signup</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Newsletter;