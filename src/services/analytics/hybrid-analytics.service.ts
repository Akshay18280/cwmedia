// Hybrid Analytics Service - Real Data + Fallback Simulation
import { GoogleAnalyticsService, type GoogleAnalyticsConfig } from './google-analytics.service';
import { realtimeAnalyticsService } from './realtime-analytics.service';
import { appConfig } from '@/config/appConfig';

interface HybridMetrics {
  // Core metrics
  activeUsers: number;
  totalUsers: number;
  sessionsToday: number;
  pageViewsToday: number;
  bounceRate: number;
  avgSessionDuration: number;
  
  // Geographic data
  topCountries: Array<{
    country: string;
    countryCode: string;
    users: number;
    sessions: number;
    percentage: number;
    coordinates: [number, number];
  }>;
  
  // Activity data
  recentPageViews: Array<{
    page: string;
    country: string;
    timestamp: number;
    referrer: string;
    userAgent: string;
  }>;
  
  // Professional metrics
  impactMetrics: {
    totalReach: number;
    countriesReached: number;
    articlesPublished: number;
    monthlyReaders: number;
    newsletterSubscribers: number;
    githubStars: number;
    linkedinFollowers: number;
    systemUptime: number;
    lastUpdated: number;
  };
  
  // Meta information
  dataSource: 'real' | 'simulation' | 'hybrid';
  lastUpdated: number;
  isRealTime: boolean;
}

class HybridAnalyticsService {
  private googleAnalytics: GoogleAnalyticsService | null = null;
  private isGoogleAnalyticsConfigured = false;
  private lastRealDataFetch = 0;
  private cachedRealData: any = null;
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes cache

  constructor() {
    this.initializeGoogleAnalytics();
  }

  // Initialize Google Analytics with environment variables
  private async initializeGoogleAnalytics() {
    // Feature guard: skip if analytics is disabled
    if (!appConfig.features.enableAnalytics) {
      return;
    }

    try {
      // Check for Google Analytics configuration
      const serviceAccountKey = appConfig.analytics.googleAnalyticsServiceKey;
      const propertyId = appConfig.analytics.googleAnalyticsPropertyId;
      
      if (serviceAccountKey) {
        // Parse service account key if provided as JSON string
        let credentials;
        try {
          credentials = JSON.parse(serviceAccountKey);
        } catch (e) {
          console.warn('Invalid Google Analytics service key format');
          return;
        }

        const config: GoogleAnalyticsConfig = {
          propertyId: propertyId,
          credentials: credentials
        };

        this.googleAnalytics = new GoogleAnalyticsService(config);
        this.isGoogleAnalyticsConfigured = await this.googleAnalytics.testConnection();
        
        if (this.isGoogleAnalyticsConfigured) {
          console.log('✅ Google Analytics successfully configured - Using REAL DATA!');
        } else {
          console.log('⚠️ Google Analytics connection failed - Using simulation');
        }
      } else {
        console.log('ℹ️ Google Analytics not configured - Using realistic simulation');
        console.log('💡 To use real data, set VITE_GOOGLE_ANALYTICS_SERVICE_KEY environment variable');
      }
    } catch (error) {
      console.warn('Google Analytics initialization failed:', error);
      this.isGoogleAnalyticsConfigured = false;
    }
  }

  // Get hybrid metrics - real data when available, simulation as fallback
  public async getHybridMetrics(): Promise<HybridMetrics> {
    let dataSource: 'real' | 'simulation' | 'hybrid' = 'simulation';
    let realTimeData = null;
    let historicalData = null;

    // Try to get real data first
    if (this.isGoogleAnalyticsConfigured && this.googleAnalytics) {
      const now = Date.now();
      
      // Use cached data if fresh (within 5 minutes)
      if (this.cachedRealData && (now - this.lastRealDataFetch) < this.cacheTimeout) {
        realTimeData = this.cachedRealData.realTime;
        historicalData = this.cachedRealData.historical;
        dataSource = 'real';
      } else {
        // Fetch fresh real data
        try {
          const [realTimeResult, historicalResult] = await Promise.allSettled([
            this.googleAnalytics.getRealTimeMetrics(),
            this.googleAnalytics.getHistoricalMetrics(30)
          ]);

          if (realTimeResult.status === 'fulfilled' && realTimeResult.value) {
            realTimeData = realTimeResult.value;
            dataSource = 'real';
          }

          if (historicalResult.status === 'fulfilled' && historicalResult.value) {
            historicalData = historicalResult.value;
          }

          // Cache the results
          if (realTimeData || historicalData) {
            this.cachedRealData = {
              realTime: realTimeData,
              historical: historicalData
            };
            this.lastRealDataFetch = now;
          }

        } catch (error) {
          console.warn('Error fetching real analytics data:', error);
        }
      }
    }

    // Get simulation data for fallback and enhancement
    const simulationData = realtimeAnalyticsService.getImpactMetrics();
    const simulatedMetrics = this.getSimulatedRealtimeData();

    // Create hybrid metrics
    const hybridMetrics: HybridMetrics = {
      // Use real data if available, otherwise simulation
      activeUsers: realTimeData?.activeUsers || simulatedMetrics.activeUsers,
      totalUsers: historicalData?.totalUsers || simulationData.totalReach,
      sessionsToday: realTimeData?.sessions || simulatedMetrics.sessionsToday,
      pageViewsToday: realTimeData?.screenPageViews || simulatedMetrics.pageViewsToday,
      bounceRate: realTimeData?.bounceRate || simulatedMetrics.bounceRate,
      avgSessionDuration: realTimeData?.avgSessionDuration || simulatedMetrics.avgSessionDuration,

      // Geographic data - enhance real data with simulation
      topCountries: this.enhanceCountriesData(realTimeData?.topCountries, simulatedMetrics.topCountries),

      // Activity data - always use simulation for now (real-time user activity not in GA4)
      recentPageViews: simulatedMetrics.recentPageViews,

      // Professional metrics - use simulation for professional achievements
      impactMetrics: simulationData,

      // Meta information
      dataSource: dataSource,
      lastUpdated: Date.now(),
      isRealTime: dataSource === 'real'
    };

    // If we have both real and simulation data, mark as hybrid
    if (realTimeData && dataSource === 'real') {
      hybridMetrics.dataSource = realTimeData.activeUsers > 0 ? 'real' : 'hybrid';
    }

    return hybridMetrics;
  }

  // Get simulated real-time data from existing service
  private getSimulatedRealtimeData() {
    const now = Date.now();
    const hour = new Date().getHours();
    
    // Use the existing simulation logic
    const baseActiveUsers = this.getActiveUsersByHour(hour);
    const dailyVariation = Math.sin((hour - 6) * Math.PI / 12) * 0.3 + 1;
    const randomFactor = (Math.random() * 0.4) + 0.8;
    
    const activeUsers = Math.round(baseActiveUsers * dailyVariation * randomFactor);
    
    return {
      activeUsers,
      totalUsers: 45234 + Math.round(Math.random() * 100),
      sessionsToday: Math.round(activeUsers * 2.3 + Math.random() * 50),
      pageViewsToday: Math.round(activeUsers * 4.7 + Math.random() * 200),
      bounceRate: 0.32 + (Math.random() * 0.1),
      avgSessionDuration: 145 + Math.random() * 60,
      topCountries: this.getSimulatedCountries(),
      recentPageViews: this.getSimulatedPageViews()
    };
  }

  // Get active users by hour (realistic patterns)
  private getActiveUsersByHour(hour: number): number {
    const patterns = {
      0: 15, 1: 12, 2: 8, 3: 6, 4: 5, 5: 7,
      6: 25, 7: 45, 8: 75, 9: 120, 10: 140, 11: 155,
      12: 130, 13: 145, 14: 160, 15: 175, 16: 185,
      17: 195, 18: 165, 19: 135, 20: 110, 21: 85,
      22: 55, 23: 35
    };
    return patterns[hour as keyof typeof patterns] || 50;
  }

  // Get simulated countries data
  private getSimulatedCountries() {
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
      const variation = (Math.random() * 0.4) + 0.8;
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

  // Get simulated page views
  private getSimulatedPageViews() {
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
      'direct'
    ];

    const countries = ['India', 'United States', 'Germany', 'United Kingdom', 'Canada', 'Australia'];
    
    const pageViews = [];
    const now = Date.now();
    
    for (let i = 0; i < 20; i++) {
      pageViews.push({
        page: pages[Math.floor(Math.random() * pages.length)],
        country: countries[Math.floor(Math.random() * countries.length)],
        timestamp: now - (Math.random() * 3600000),
        referrer: referrers[Math.floor(Math.random() * referrers.length)],
        userAgent: `Chrome on ${['Windows', 'macOS', 'Linux'][Math.floor(Math.random() * 3)]}`
      });
    }
    
    return pageViews.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Enhance countries data by combining real and simulated data
  private enhanceCountriesData(realCountries: any[] | null, simulatedCountries: any[]) {
    if (!realCountries || realCountries.length === 0) {
      return simulatedCountries;
    }

    // Map real countries to our format with coordinates
    const countryCoordinates = {
      'India': [20.5937, 78.9629],
      'United States': [39.8283, -98.5795],
      'Germany': [51.1657, 10.4515],
      'United Kingdom': [55.3781, -3.4360],
      'Canada': [56.1304, -106.3468],
      'Australia': [-25.2744, 133.7751],
      'Netherlands': [52.1326, 5.2913],
      'Singapore': [1.3521, 103.8198],
      'France': [46.6034, 1.8883],
      'Japan': [36.2048, 138.2529]
    };

    const countryCodes = {
      'India': 'IN',
      'United States': 'US',
      'Germany': 'DE',
      'United Kingdom': 'GB',
      'Canada': 'CA',
      'Australia': 'AU',
      'Netherlands': 'NL',
      'Singapore': 'SG',
      'France': 'FR',
      'Japan': 'JP'
    };

    return realCountries.map(country => ({
      country: country.country,
      countryCode: countryCodes[country.country as keyof typeof countryCodes] || 'XX',
      users: country.users,
      sessions: Math.round(country.users * 1.3), // Estimate sessions
      percentage: country.percentage,
      coordinates: countryCoordinates[country.country as keyof typeof countryCoordinates] || [0, 0] as [number, number]
    }));
  }

  // Subscribe to hybrid metrics with automatic updates
  public subscribeToHybridMetrics(callback: (metrics: HybridMetrics) => void): string {
    const subscriptionId = `hybrid_${Date.now()}_${Math.random()}`;
    
    // Initial fetch
    this.getHybridMetrics().then(callback);
    
    // Set up regular updates
    const interval = setInterval(async () => {
      try {
        const metrics = await this.getHybridMetrics();
        callback(metrics);
      } catch (error) {
        console.error('Error in hybrid metrics subscription:', error);
      }
    }, 15000); // Update every 15 seconds

    // Store cleanup function
    const cleanup = () => clearInterval(interval);
    
    return subscriptionId;
  }

  // Get service status
  public getStatus() {
    return {
      isGoogleAnalyticsConfigured: this.isGoogleAnalyticsConfigured,
      hasRealData: this.cachedRealData !== null,
      lastRealDataFetch: this.lastRealDataFetch,
      dataSource: this.isGoogleAnalyticsConfigured ? 'real' : 'simulation',
      cacheAge: this.lastRealDataFetch ? Date.now() - this.lastRealDataFetch : null
    };
  }

  // Force refresh real data
  public async forceRefresh(): Promise<boolean> {
    this.cachedRealData = null;
    this.lastRealDataFetch = 0;
    
    try {
      await this.getHybridMetrics();
      return true;
    } catch (error) {
      console.error('Force refresh failed:', error);
      return false;
    }
  }

  // Get setup instructions for real data
  public getSetupInstructions(): {
    steps: string[];
    envVariables: string[];
    currentStatus: string;
  } {
    return {
      steps: [
        '1. Go to Google Cloud Console (console.cloud.google.com)',
        '2. Create a new project or select existing one',
        '3. Enable Google Analytics Data API',
        '4. Create a Service Account with Analytics Viewer permission',
        '5. Download the service account key (JSON file)',
        '6. Add the service account email to your Google Analytics property',
        '7. Set environment variables in your .env file'
      ],
      envVariables: [
        'VITE_GOOGLE_ANALYTICS_PROPERTY_ID=11543981244',
        'VITE_GOOGLE_ANALYTICS_SERVICE_KEY={"type":"service_account",...}'
      ],
      currentStatus: this.isGoogleAnalyticsConfigured 
        ? '✅ Google Analytics is configured and working!' 
        : '⚠️ Using simulation data - configure Google Analytics for real data'
    };
  }
}

export const hybridAnalyticsService = new HybridAnalyticsService();
export type { HybridMetrics }; 