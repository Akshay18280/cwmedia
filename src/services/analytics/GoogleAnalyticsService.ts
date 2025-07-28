/**
 * Google Analytics 4 Service
 * Complete implementation for tracking events and metrics
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

interface GAEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

interface PageViewData {
  page_title: string;
  page_location: string;
  page_path: string;
}

interface ConversionEvent {
  event_name: string;
  currency?: string;
  value?: number;
  items?: any[];
}

class GoogleAnalyticsService {
  private isInitialized: boolean = false;
  private measurementId: string;
  private debugMode: boolean = false;

  constructor() {
    this.measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
    this.debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';
    this.initialize();
  }

  /**
   * Initialize Google Analytics
   */
  private initialize(): void {
    if (!this.measurementId || typeof window === 'undefined') {
      console.warn('Google Analytics: Measurement ID not found or not in browser environment');
      return;
    }

    try {
      // Load Google Analytics script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
      document.head.appendChild(script);

      // Initialize gtag
      (window as any).dataLayer = (window as any).dataLayer || [];
      const gtag = function (...args: any[]) {
        (window as any).dataLayer.push(args);
      };
      (window as any).gtag = gtag;

      // Configure Google Analytics
      gtag('js', new Date());
      gtag('config', this.measurementId, {
        page_title: document.title,
        page_location: window.location.href,
        custom_map: {
          custom_parameter_1: 'user_type',
          custom_parameter_2: 'content_category'
        },
        // Privacy settings
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        // Enhanced ecommerce
        send_page_view: true,
        // Debug mode
        debug_mode: this.debugMode
      });

      this.isInitialized = true;
      console.log('✅ Google Analytics initialized successfully');
      
      // Track initial page view
      this.trackPageView({
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname
      });

    } catch (error) {
      console.error('Google Analytics initialization failed:', error);
    }
  }

  /**
   * Track page views
   */
  trackPageView(data: PageViewData): void {
    if (!this.isInitialized || !window.gtag) return;

    try {
      window.gtag('config', this.measurementId, {
        page_title: data.page_title,
        page_location: data.page_location,
        page_path: data.page_path
      });

      if (this.debugMode) {
        console.log('📊 GA Page View:', data);
      }
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }

  /**
   * Track custom events
   */
  trackEvent(event: GAEvent): void {
    if (!this.isInitialized || !window.gtag) return;

    try {
      window.gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value
      });

      if (this.debugMode) {
        console.log('📊 GA Event:', event);
      }
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  /**
   * Track conversion events
   */
  trackConversion(event: ConversionEvent): void {
    if (!this.isInitialized || !window.gtag) return;

    try {
      window.gtag('event', event.event_name, {
        currency: event.currency || 'USD',
        value: event.value || 0,
        items: event.items || []
      });

      if (this.debugMode) {
        console.log('📊 GA Conversion:', event);
      }
    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  }

  /**
   * Track user engagement
   */
  trackEngagement(engagementTime: number): void {
    this.trackEvent({
      action: 'engagement_time',
      category: 'User Engagement',
      value: engagementTime
    });
  }

  /**
   * Track newsletter signup
   */
  trackNewsletterSignup(): void {
    this.trackConversion({
      event_name: 'newsletter_signup',
      value: 1
    });

    this.trackEvent({
      action: 'signup',
      category: 'Newsletter',
      label: 'Email Subscription'
    });
  }

  /**
   * Track contact form submission
   */
  trackContactForm(): void {
    this.trackConversion({
      event_name: 'contact_form_submit',
      value: 1
    });

    this.trackEvent({
      action: 'submit',
      category: 'Contact',
      label: 'Contact Form'
    });
  }

  /**
   * Track blog post engagement
   */
  trackBlogEngagement(postTitle: string, timeSpent: number): void {
    this.trackEvent({
      action: 'blog_engagement',
      category: 'Content',
      label: postTitle,
      value: timeSpent
    });
  }

  /**
   * Track voice command usage
   */
  trackVoiceCommand(command: string): void {
    this.trackEvent({
      action: 'voice_command',
      category: 'Voice Interface',
      label: command
    });
  }

  /**
   * Track search queries
   */
  trackSearch(query: string, resultsCount: number): void {
    this.trackEvent({
      action: 'search',
      category: 'Site Search',
      label: query,
      value: resultsCount
    });
  }

  /**
   * Track file downloads
   */
  trackDownload(fileName: string, fileType: string): void {
    this.trackEvent({
      action: 'download',
      category: 'File Download',
      label: `${fileName} (${fileType})`
    });
  }

  /**
   * Track social sharing
   */
  trackSocialShare(platform: string, url: string): void {
    this.trackEvent({
      action: 'share',
      category: 'Social Media',
      label: `${platform} - ${url}`
    });
  }

  /**
   * Track video interactions
   */
  trackVideo(action: 'play' | 'pause' | 'complete', videoTitle: string): void {
    this.trackEvent({
      action: `video_${action}`,
      category: 'Video',
      label: videoTitle
    });
  }

  /**
   * Track user timing (performance metrics)
   */
  trackTiming(category: string, variable: string, value: number, label?: string): void {
    if (!this.isInitialized || !window.gtag) return;

    try {
      window.gtag('event', 'timing_complete', {
        name: variable,
        value: value,
        event_category: category,
        event_label: label
      });

      if (this.debugMode) {
        console.log('📊 GA Timing:', { category, variable, value, label });
      }
    } catch (error) {
      console.error('Error tracking timing:', error);
    }
  }

  /**
   * Track exceptions/errors
   */
  trackException(description: string, fatal: boolean = false): void {
    if (!this.isInitialized || !window.gtag) return;

    try {
      window.gtag('event', 'exception', {
        description: description,
        fatal: fatal
      });

      if (this.debugMode) {
        console.log('📊 GA Exception:', { description, fatal });
      }
    } catch (error) {
      console.error('Error tracking exception:', error);
    }
  }

  /**
   * Set user properties
   */
  setUserProperty(propertyName: string, value: string): void {
    if (!this.isInitialized || !window.gtag) return;

    try {
      window.gtag('set', {
        [propertyName]: value
      });

      if (this.debugMode) {
        console.log('📊 GA User Property:', { propertyName, value });
      }
    } catch (error) {
      console.error('Error setting user property:', error);
    }
  }

  /**
   * Track Core Web Vitals
   */
  trackWebVitals(): void {
    if (!this.isInitialized) return;

    // Track FCP (First Contentful Paint)
    this.observePerformanceEntry('paint', (entry) => {
      if (entry.name === 'first-contentful-paint') {
        this.trackTiming('Web Vitals', 'FCP', Math.round(entry.startTime));
      }
    });

    // Track LCP (Largest Contentful Paint)
    this.observePerformanceEntry('largest-contentful-paint', (entry) => {
      this.trackTiming('Web Vitals', 'LCP', Math.round(entry.startTime));
    });

    // Track FID (First Input Delay)
    this.observePerformanceEntry('first-input', (entry) => {
      this.trackTiming('Web Vitals', 'FID', Math.round(entry.processingStart - entry.startTime));
    });

    // Track CLS (Cumulative Layout Shift)
    let clsValue = 0;
    this.observePerformanceEntry('layout-shift', (entry) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
        this.trackTiming('Web Vitals', 'CLS', Math.round(clsValue * 1000));
      }
    });
  }

  /**
   * Helper method to observe performance entries
   */
  private observePerformanceEntry(type: string, callback: (entry: any) => void): void {
    try {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach(callback);
        });
        observer.observe({ type, buffered: true });
      }
    } catch (error) {
      console.error(`Error observing ${type}:`, error);
    }
  }

  /**
   * Get current session data
   */
  getSessionData(): any {
    return {
      measurement_id: this.measurementId,
      session_id: this.getSessionId(),
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  /**
   * Generate or retrieve session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('ga_session_id');
    if (!sessionId) {
      sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('ga_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Check if analytics is enabled and initialized
   */
  isEnabled(): boolean {
    return this.isInitialized && !!window.gtag;
  }
}

// Export singleton instance
export const googleAnalyticsService = new GoogleAnalyticsService();

// Declare global gtag function for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export default googleAnalyticsService; 