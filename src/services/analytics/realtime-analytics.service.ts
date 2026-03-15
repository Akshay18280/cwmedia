// Real-time Analytics Service for Impact & Reach Dashboard
import { collection, doc, onSnapshot, updateDoc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { appConfig } from '@/config/appConfig';

interface RealtimeMetrics {
  activeUsers: number;
  totalUsers: number;
  sessionsToday: number;
  pageViewsToday: number;
  bounceRate: number;
  avgSessionDuration: number;
  topCountries: CountryData[];
  recentPageViews: PageView[];
  currentHour: number;
  timestamp: number;
}

interface CountryData {
  country: string;
  countryCode: string;
  users: number;
  sessions: number;
  percentage: number;
  coordinates: [number, number]; // [lat, lng]
}

interface PageView {
  page: string;
  country: string;
  timestamp: number;
  referrer: string;
  userAgent: string;
}

interface ImpactMetrics {
  totalReach: number;
  countriesReached: number;
  articlesPublished: number;
  monthlyReaders: number;
  newsletterSubscribers: number;
  githubStars: number;
  linkedinFollowers: number;
  systemUptime: number;
  lastUpdated: number;
}

interface VisitorActivity {
  id: string;
  type: 'visit' | 'subscribe' | 'download' | 'share' | 'comment';
  page: string;
  country: string;
  timestamp: number;
  details: string;
}

class RealtimeAnalyticsService {
  private readonly measurementId = appConfig.analytics.realtimeMeasurementId;
  private readonly domain = appConfig.site.domain;
  private readonly streamId = appConfig.analytics.realtimeStreamId;
  
  private subscribers: Map<string, Function> = new Map();
  private simulationInterval: number | null = null;
  private isSimulating = true; // Will switch to real data when available

  // Real-time metrics simulation with realistic patterns
  private simulateRealtimeMetrics(): RealtimeMetrics {
    const now = Date.now();
    const hour = new Date().getHours();
    
    // Realistic patterns based on time of day and tech audience
    const baseActiveUsers = this.getActiveUsersByHour(hour);
    const dailyVariation = Math.sin((hour - 6) * Math.PI / 12) * 0.3 + 1;
    const randomFactor = (Math.random() * 0.4) + 0.8; // 80-120% variation
    
    const activeUsers = Math.round(baseActiveUsers * dailyVariation * randomFactor);
    const totalUsers = 45234 + Math.round(Math.random() * 100); // Growing total
    
    return {
      activeUsers,
      totalUsers,
      sessionsToday: Math.round(activeUsers * 2.3 + Math.random() * 50),
      pageViewsToday: Math.round(activeUsers * 4.7 + Math.random() * 200),
      bounceRate: 0.32 + (Math.random() * 0.1), // 32-42% (good for tech blogs)
      avgSessionDuration: 145 + Math.random() * 60, // 2-3 minutes average
      topCountries: this.generateTopCountries(),
      recentPageViews: this.generateRecentPageViews(),
      currentHour: hour,
      timestamp: now
    };
  }

  // Realistic active users by hour (IST timezone focused)
  private getActiveUsersByHour(hour: number): number {
    const patterns = {
      0: 15, 1: 12, 2: 8, 3: 6, 4: 5, 5: 7,        // Late night
      6: 25, 7: 45, 8: 75, 9: 120, 10: 140, 11: 155, // Morning peak
      12: 130, 13: 145, 14: 160, 15: 175, 16: 185,   // Afternoon peak
      17: 195, 18: 165, 19: 135, 20: 110, 21: 85,    // Evening
      22: 55, 23: 35                                   // Night
    };
    return patterns[hour as keyof typeof patterns] || 50;
  }

  // Generate realistic country distribution for tech audience
  private generateTopCountries(): CountryData[] {
    const countries = [
      { country: 'India', code: 'IN', base: 35, coords: [20.5937, 78.9629] },
      { country: 'United States', code: 'US', base: 22, coords: [39.8283, -98.5795] },
      { country: 'Germany', code: 'DE', base: 8, coords: [51.1657, 10.4515] },
      { country: 'United Kingdom', code: 'GB', base: 6, coords: [55.3781, -3.4360] },
      { country: 'Canada', code: 'CA', base: 5, coords: [56.1304, -106.3468] },
      { country: 'Australia', code: 'AU', base: 4, coords: [-25.2744, 133.7751] },
      { country: 'Netherlands', code: 'NL', base: 3, coords: [52.1326, 5.2913] },
      { country: 'Singapore', code: 'SG', base: 3, coords: [1.3521, 103.8198] },
      { country: 'France', code: 'FR', base: 2.5, coords: [46.6034, 1.8883] },
      { country: 'Japan', code: 'JP', base: 2, coords: [36.2048, 138.2529] }
    ];

    return countries.map(country => {
      const variation = (Math.random() * 0.4) + 0.8; // ±20% variation
      const users = Math.round(country.base * variation * 10);
      const sessions = Math.round(users * (1.2 + Math.random() * 0.3));
      
      return {
        country: country.country,
        countryCode: country.code,
        users,
        sessions,
        percentage: country.base * variation,
        coordinates: country.coords as [number, number]
      };
    }).sort((a, b) => b.users - a.users);
  }

  // Generate realistic recent page views
  private generateRecentPageViews(): PageView[] {
    const pages = [
      '/blog/system-design-fundamentals',
      '/blog/microservices-architecture',
      '/blog/cloud-migration-strategy',
      '/blog/kubernetes-best-practices',
      '/blog/database-optimization',
      '/about',
      '/contact',
      '/blog'
    ];

    const referrers = [
      'https://google.com/search',
      'https://linkedin.com',
      'https://github.com',
      'https://stackoverflow.com',
      'direct',
      'https://twitter.com',
      'https://reddit.com/r/programming'
    ];

    const countries = ['India', 'United States', 'Germany', 'United Kingdom', 'Canada', 'Australia'];
    
    const pageViews: PageView[] = [];
    const now = Date.now();
    
    // Generate 20 recent page views over last hour
    for (let i = 0; i < 20; i++) {
      pageViews.push({
        page: pages[Math.floor(Math.random() * pages.length)],
        country: countries[Math.floor(Math.random() * countries.length)],
        timestamp: now - (Math.random() * 3600000), // Random time in last hour
        referrer: referrers[Math.floor(Math.random() * referrers.length)],
        userAgent: this.generateRandomUserAgent()
      });
    }
    
    return pageViews.sort((a, b) => b.timestamp - a.timestamp);
  }

  private generateRandomUserAgent(): string {
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
    const os = ['Windows', 'macOS', 'Linux', 'iOS', 'Android'];
    
    return `${browsers[Math.floor(Math.random() * browsers.length)]} on ${os[Math.floor(Math.random() * os.length)]}`;
  }

  // Impact metrics with realistic professional growth
  public getImpactMetrics(): ImpactMetrics {
    const baseDate = new Date('2020-01-01').getTime();
    const now = Date.now();
    const daysSinceStart = Math.floor((now - baseDate) / (1000 * 60 * 60 * 24));
    
    // Realistic growth patterns
    const articlesGrowth = Math.floor(daysSinceStart * 0.08 + Math.random() * 5); // ~2-3 articles per month
    const readerGrowth = Math.floor(Math.pow(daysSinceStart / 365, 1.5) * 8000 + Math.random() * 500);
    
    return {
      totalReach: 125000 + Math.floor(Math.random() * 5000), // Total people reached
      countriesReached: 67 + Math.floor(Math.random() * 3), // Countries with visitors
      articlesPublished: Math.min(89 + articlesGrowth, 120), // Total articles
      monthlyReaders: Math.min(12500 + readerGrowth, 25000), // Monthly unique readers
      newsletterSubscribers: 2840 + Math.floor(Math.random() * 50), // Newsletter subs
      githubStars: 1245 + Math.floor(Math.random() * 10), // GitHub stars across repos
      linkedinFollowers: 8500 + Math.floor(Math.random() * 25), // LinkedIn followers
      systemUptime: 99.97 + (Math.random() * 0.02), // System uptime %
      lastUpdated: now
    };
  }

  // Generate live visitor activities
  private generateVisitorActivities(): VisitorActivity[] {
    const activities: VisitorActivity[] = [];
    const now = Date.now();
    const countries = ['India', 'USA', 'Germany', 'UK', 'Canada', 'Australia', 'Netherlands', 'Singapore'];
    const pages = [
      '/blog/system-design-fundamentals',
      '/blog/microservices-architecture', 
      '/blog/cloud-migration-strategy',
      '/about',
      '/contact'
    ];

    // Generate 15 recent activities
    for (let i = 0; i < 15; i++) {
      const types: Array<VisitorActivity['type']> = ['visit', 'subscribe', 'download', 'share'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      let details = '';
      switch (type) {
        case 'visit':
          details = `New visitor exploring ${pages[Math.floor(Math.random() * pages.length)]}`;
          break;
        case 'subscribe':
          details = 'Subscribed to newsletter';
          break;
        case 'download':
          details = 'Downloaded system design cheatsheet';
          break;
        case 'share':
          details = 'Shared article on social media';
          break;
      }

      activities.push({
        id: `activity_${now}_${i}`,
        type,
        page: pages[Math.floor(Math.random() * pages.length)],
        country: countries[Math.floor(Math.random() * countries.length)],
        timestamp: now - (Math.random() * 1800000), // Last 30 minutes
        details
      });
    }

    return activities.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Subscribe to real-time updates
  public subscribeToRealtimeMetrics(callback: (metrics: RealtimeMetrics) => void): string {
    const subscriptionId = `realtime_${Date.now()}_${Math.random()}`;
    this.subscribers.set(subscriptionId, callback);

    // Start simulation if first subscriber
    if (this.subscribers.size === 1) {
      this.startRealtimeSimulation();
    }

    // Send initial data
    callback(this.simulateRealtimeMetrics());

    return subscriptionId;
  }

  // Subscribe to visitor activities
  public subscribeToVisitorActivities(callback: (activities: VisitorActivity[]) => void): string {
    const subscriptionId = `activities_${Date.now()}_${Math.random()}`;
    
    // Update activities every 30 seconds
    const interval = setInterval(() => {
      callback(this.generateVisitorActivities());
    }, 30000);

    // Send initial data
    callback(this.generateVisitorActivities());

    // Store cleanup function
    this.subscribers.set(subscriptionId, () => clearInterval(interval));

    return subscriptionId;
  }

  // Start real-time simulation
  private startRealtimeSimulation(): void {
    if (this.simulationInterval) return;

    // Update every 15 seconds for live feel
    this.simulationInterval = window.setInterval(() => {
      const metrics = this.simulateRealtimeMetrics();
      
      // Notify all subscribers
      this.subscribers.forEach((callback, id) => {
        if (id.startsWith('realtime_')) {
          callback(metrics);
        }
      });
    }, 15000);
  }

  // Unsubscribe from updates
  public unsubscribe(subscriptionId: string): void {
    const cleanup = this.subscribers.get(subscriptionId);
    if (cleanup && typeof cleanup === 'function') {
      cleanup();
    }
    this.subscribers.delete(subscriptionId);

    // Stop simulation if no more subscribers
    if (this.subscribers.size === 0 && this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  // Get analytics URL for potential real integration
  public getAnalyticsUrl(): string {
    return `https://analytics.google.com/analytics/web/#/p${this.streamId}/reports/intelligenthome`;
  }

  // Check if real analytics is available
  public async checkRealAnalyticsAvailability(): Promise<boolean> {
    try {
      // Try to access Google Analytics Reporting API
      // This would require proper authentication setup
      return false; // For now, always use simulation
    } catch (error) {
      return false;
    }
  }

  // Get geographic distribution for map visualization
  public getGeographicDistribution(): CountryData[] {
    return this.generateTopCountries();
  }

  // Cleanup all subscriptions
  public cleanup(): void {
    this.subscribers.forEach((cleanup, id) => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    });
    this.subscribers.clear();

    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  // Get service status
  public getStatus(): {
    isSimulating: boolean;
    measurementId: string;
    domain: string;
    subscriberCount: number;
  } {
    return {
      isSimulating: this.isSimulating,
      measurementId: this.measurementId,
      domain: this.domain,
      subscriberCount: this.subscribers.size
    };
  }
}

export const realtimeAnalyticsService = new RealtimeAnalyticsService();
export type { RealtimeMetrics, CountryData, PageView, ImpactMetrics, VisitorActivity }; 