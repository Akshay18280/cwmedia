/**
 * Live Visitor Service
 * Real-time visitor tracking and presence management
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

import { webSocketService } from './WebSocketService';
import { doc, setDoc, deleteDoc, collection, onSnapshot, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export interface Visitor {
  id: string;
  sessionId: string;
  userId?: string;
  userName?: string;
  avatar?: string;
  location: {
    page: string;
    url: string;
    title: string;
  };
  metadata: {
    userAgent: string;
    browser: string;
    os: string;
    device: string;
    country?: string;
    city?: string;
    ipAddress?: string;
  };
  joinedAt: Date;
  lastSeen: Date;
  isActive: boolean;
  timeOnPage: number;
}

export interface VisitorStats {
  totalVisitors: number;
  activeVisitors: number;
  pageVisitors: Record<string, number>;
  realTimeData: {
    timestamp: Date;
    visitors: number;
    pages: Array<{ page: string; count: number }>;
  };
  demographics: {
    countries: Array<{ country: string; count: number }>;
    browsers: Array<{ browser: string; count: number }>;
    devices: Array<{ device: string; count: number }>;
  };
}

export interface PageView {
  id: string;
  visitorId: string;
  page: string;
  url: string;
  title: string;
  referrer: string;
  timestamp: Date;
  duration?: number;
  scrollDepth?: number;
  interactions?: number;
}

class LiveVisitorService {
  private currentVisitor: Visitor | null = null;
  private visitors: Map<string, Visitor> = new Map();
  private pageViews: Map<string, PageView[]> = new Map();
  private presenceSubscribers: Map<string, Set<(visitors: Visitor[]) => void>> = new Map();
  private statsSubscribers: Set<(stats: VisitorStats) => void> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private pageStartTime: number = 0;
  private currentPageView: PageView | null = null;
  private unsubscribers: Map<string, () => void> = new Map();
  private isInitialized = false;

  constructor() {
    this.init();
  }

  /**
   * Initialize visitor service
   */
  private async init(): Promise<void> {
    if (this.isInitialized) return;

    // Initialize WebSocket listeners
    this.initWebSocketListeners();

    // Set up page tracking
    this.setupPageTracking();

    // Set up user session
    await this.setupUserSession();

    // Start heartbeat
    this.startHeartbeat();

    this.isInitialized = true;
  }

  /**
   * Initialize WebSocket listeners
   */
  private initWebSocketListeners(): void {
    webSocketService.subscribe('visitor_joined', (data) => {
      this.handleVisitorJoined(data);
    });

    webSocketService.subscribe('visitor_left', (data) => {
      this.handleVisitorLeft(data);
    });

    webSocketService.subscribe('visitor_updated', (data) => {
      this.handleVisitorUpdated(data);
    });

    webSocketService.subscribe('page_view', (data) => {
      this.handlePageView(data);
    });

    webSocketService.subscribe('visitor_stats', (data) => {
      this.handleVisitorStats(data);
    });
  }

  /**
   * Set up page tracking
   */
  private setupPageTracking(): void {
    // Track initial page load
    this.trackPageView();

    // Track page changes (for SPAs)
    window.addEventListener('popstate', () => {
      this.trackPageView();
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handlePageHidden();
      } else {
        this.handlePageVisible();
      }
    });

    // Track scroll depth
    this.setupScrollTracking();

    // Track page interactions
    this.setupInteractionTracking();

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.handlePageUnload();
    });
  }

  /**
   * Set up user session
   */
  private async setupUserSession(): Promise<void> {
    const sessionId = this.getOrCreateSessionId();
    const currentUser = this.getCurrentUser();

    this.currentVisitor = {
      id: this.generateVisitorId(),
      sessionId,
      userId: currentUser?.id,
      userName: currentUser?.name,
      avatar: currentUser?.avatar,
      location: {
        page: this.getCurrentPage(),
        url: window.location.href,
        title: document.title
      },
      metadata: await this.getDeviceMetadata(),
      joinedAt: new Date(),
      lastSeen: new Date(),
      isActive: true,
      timeOnPage: 0
    };

    // Register visitor with backend
    await this.registerVisitor(this.currentVisitor);

    // Broadcast join event
    webSocketService.send('visitor_join', {
      visitor: this.currentVisitor,
      timestamp: Date.now()
    });
  }

  /**
   * Track page view
   */
  public trackPageView(): void {
    // End previous page view if exists
    if (this.currentPageView) {
      this.endPageView(this.currentPageView);
    }

    // Start new page view
    this.pageStartTime = Date.now();
    this.currentPageView = {
      id: this.generatePageViewId(),
      visitorId: this.currentVisitor?.id || 'anonymous',
      page: this.getCurrentPage(),
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      timestamp: new Date(),
      scrollDepth: 0,
      interactions: 0
    };

    // Update visitor location
    if (this.currentVisitor) {
      this.currentVisitor.location = {
        page: this.currentPageView.page,
        url: this.currentPageView.url,
        title: this.currentPageView.title
      };

      // Update visitor presence
      this.updateVisitorPresence();
    }

    // Broadcast page view
    webSocketService.send('page_view', {
      pageView: this.currentPageView,
      visitor: this.currentVisitor,
      timestamp: Date.now()
    });

    // Store page view
    this.storePageView(this.currentPageView);
  }

  /**
   * Subscribe to live visitors for a specific page
   */
  public subscribeToPageVisitors(page: string, callback: (visitors: Visitor[]) => void): () => void {
    if (!this.presenceSubscribers.has(page)) {
      this.presenceSubscribers.set(page, new Set());
      this.setupPagePresenceListener(page);
    }

    this.presenceSubscribers.get(page)!.add(callback);

    // Send current visitors immediately
    const pageVisitors = Array.from(this.visitors.values())
      .filter(v => v.location.page === page && v.isActive);
    callback(pageVisitors);

    return () => {
      const subscribers = this.presenceSubscribers.get(page);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.cleanupPagePresenceListener(page);
        }
      }
    };
  }

  /**
   * Subscribe to visitor statistics
   */
  public subscribeToStats(callback: (stats: VisitorStats) => void): () => void {
    this.statsSubscribers.add(callback);

    // Send current stats immediately
    this.calculateAndSendStats();

    return () => {
      this.statsSubscribers.delete(callback);
    };
  }

  /**
   * Get current visitor count for a page
   */
  public getPageVisitorCount(page: string): number {
    return Array.from(this.visitors.values())
      .filter(v => v.location.page === page && v.isActive).length;
  }

  /**
   * Get total active visitors
   */
  public getTotalActiveVisitors(): number {
    return Array.from(this.visitors.values())
      .filter(v => v.isActive).length;
  }

  /**
   * Get visitor analytics for a time period
   */
  public async getVisitorAnalytics(startDate: Date, endDate: Date): Promise<any> {
    try {
      // In production, this would query your analytics backend
      // For now, return mock data based on current visitors
      const visitors = Array.from(this.visitors.values());
      
      return {
        totalVisitors: visitors.length,
        uniqueVisitors: new Set(visitors.map(v => v.userId || v.sessionId)).size,
        pageViews: this.getTotalPageViews(),
        averageTimeOnSite: this.getAverageTimeOnSite(),
        bounceRate: this.calculateBounceRate(),
        topPages: this.getTopPages(),
        trafficSources: this.getTrafficSources(),
        demographics: this.getDemographics()
      };
    } catch (error) {
      console.error('Error getting visitor analytics:', error);
      return null;
    }
  }

  /**
   * Manually update visitor presence (heartbeat)
   */
  public updatePresence(): void {
    if (this.currentVisitor) {
      this.currentVisitor.lastSeen = new Date();
      this.currentVisitor.timeOnPage = Date.now() - this.pageStartTime;
      
      this.updateVisitorPresence();
    }
  }

  /**
   * Destroy visitor service
   */
  public destroy(): void {
    // Clear heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // End current page view
    if (this.currentPageView) {
      this.endPageView(this.currentPageView);
    }

    // Remove visitor from presence
    if (this.currentVisitor) {
      this.removeVisitor(this.currentVisitor.id);
    }

    // Clean up listeners
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers.clear();

    // Clear subscribers
    this.presenceSubscribers.clear();
    this.statsSubscribers.clear();

    this.isInitialized = false;
  }

  // Private helper methods

  private setupPagePresenceListener(page: string): void {
    const presenceQuery = query(
      collection(db, 'visitor_presence'),
      where('location.page', '==', page),
      where('isActive', '==', true),
      orderBy('joinedAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(presenceQuery, (snapshot) => {
      const visitors: Visitor[] = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const visitor: Visitor = {
          id: doc.id,
          sessionId: data.sessionId,
          userId: data.userId,
          userName: data.userName,
          avatar: data.avatar,
          location: data.location,
          metadata: data.metadata,
          joinedAt: data.joinedAt?.toDate() || new Date(),
          lastSeen: data.lastSeen?.toDate() || new Date(),
          isActive: data.isActive,
          timeOnPage: data.timeOnPage || 0
        };
        
        visitors.push(visitor);
        this.visitors.set(visitor.id, visitor);
      });

      // Notify subscribers
      this.notifyPagePresenceSubscribers(page, visitors);
    });

    this.unsubscribers.set(`presence_${page}`, unsubscribe);
  }

  private cleanupPagePresenceListener(page: string): void {
    const unsubscribe = this.unsubscribers.get(`presence_${page}`);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribers.delete(`presence_${page}`);
    }
    this.presenceSubscribers.delete(page);
  }

  private async registerVisitor(visitor: Visitor): Promise<void> {
    try {
      await setDoc(doc(db, 'visitor_presence', visitor.id), {
        sessionId: visitor.sessionId,
        userId: visitor.userId || null,
        userName: visitor.userName || null,
        avatar: visitor.avatar || null,
        location: visitor.location,
        metadata: visitor.metadata,
        joinedAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        isActive: true,
        timeOnPage: 0
      });
    } catch (error) {
      console.error('Error registering visitor:', error);
    }
  }

  private async updateVisitorPresence(): Promise<void> {
    if (!this.currentVisitor) return;

    try {
      await setDoc(doc(db, 'visitor_presence', this.currentVisitor.id), {
        location: this.currentVisitor.location,
        lastSeen: serverTimestamp(),
        timeOnPage: this.currentVisitor.timeOnPage,
        isActive: true
      }, { merge: true });

      // Broadcast update
      webSocketService.send('visitor_update', {
        visitor: this.currentVisitor,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error updating visitor presence:', error);
    }
  }

  private async removeVisitor(visitorId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'visitor_presence', visitorId));
      
      // Broadcast leave event
      webSocketService.send('visitor_leave', {
        visitorId,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error removing visitor:', error);
    }
  }

  private storePageView(pageView: PageView): void {
    const page = pageView.page;
    if (!this.pageViews.has(page)) {
      this.pageViews.set(page, []);
    }
    this.pageViews.get(page)!.push(pageView);

    // Store in Firebase for persistence
    this.storePageViewInDatabase(pageView);
  }

  private async storePageViewInDatabase(pageView: PageView): Promise<void> {
    try {
      await setDoc(doc(db, 'page_views', pageView.id), {
        visitorId: pageView.visitorId,
        page: pageView.page,
        url: pageView.url,
        title: pageView.title,
        referrer: pageView.referrer,
        timestamp: serverTimestamp(),
        duration: pageView.duration || null,
        scrollDepth: pageView.scrollDepth || 0,
        interactions: pageView.interactions || 0
      });
    } catch (error) {
      console.error('Error storing page view:', error);
    }
  }

  private endPageView(pageView: PageView): void {
    pageView.duration = Date.now() - pageView.timestamp.getTime();
    
    // Update in database
    this.storePageViewInDatabase(pageView);
  }

  private setupScrollTracking(): void {
    let maxScrollDepth = 0;
    
    const trackScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = Math.round((scrollTop / docHeight) * 100);
      
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        if (this.currentPageView) {
          this.currentPageView.scrollDepth = maxScrollDepth;
        }
      }
    };

    window.addEventListener('scroll', trackScroll, { passive: true });
  }

  private setupInteractionTracking(): void {
    let interactions = 0;
    
    const trackInteraction = () => {
      interactions++;
      if (this.currentPageView) {
        this.currentPageView.interactions = interactions;
      }
    };

    // Track various interactions
    ['click', 'keydown', 'scroll', 'mousemove'].forEach(event => {
      document.addEventListener(event, trackInteraction, { passive: true });
    });
  }

  private handlePageHidden(): void {
    if (this.currentVisitor) {
      this.currentVisitor.isActive = false;
      this.updateVisitorPresence();
    }
  }

  private handlePageVisible(): void {
    if (this.currentVisitor) {
      this.currentVisitor.isActive = true;
      this.currentVisitor.lastSeen = new Date();
      this.updateVisitorPresence();
    }
  }

  private handlePageUnload(): void {
    if (this.currentPageView) {
      this.endPageView(this.currentPageView);
    }
    
    if (this.currentVisitor) {
      // Use sendBeacon for reliable tracking
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/visitor/leave', JSON.stringify({
          visitorId: this.currentVisitor.id,
          timestamp: Date.now()
        }));
      }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.updatePresence();
      this.calculateAndSendStats();
    }, 30000); // Update every 30 seconds
  }

  private calculateAndSendStats(): void {
    const stats: VisitorStats = {
      totalVisitors: this.visitors.size,
      activeVisitors: this.getTotalActiveVisitors(),
      pageVisitors: this.getPageVisitorCounts(),
      realTimeData: {
        timestamp: new Date(),
        visitors: this.getTotalActiveVisitors(),
        pages: this.getActivePages()
      },
      demographics: {
        countries: this.getCountryStats(),
        browsers: this.getBrowserStats(),
        devices: this.getDeviceStats()
      }
    };

    // Notify subscribers
    this.statsSubscribers.forEach(callback => {
      try {
        callback(stats);
      } catch (error) {
        console.error('Error notifying stats subscriber:', error);
      }
    });
  }

  private notifyPagePresenceSubscribers(page: string, visitors: Visitor[]): void {
    const subscribers = this.presenceSubscribers.get(page);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(visitors);
        } catch (error) {
          console.error('Error notifying presence subscriber:', error);
        }
      });
    }
  }

  // WebSocket event handlers
  private handleVisitorJoined(data: any): void {
    const visitor = data.visitor;
    this.visitors.set(visitor.id, visitor);
    
    // Notify relevant page subscribers
    this.notifyPagePresenceSubscribers(
      visitor.location.page,
      Array.from(this.visitors.values()).filter(v => v.location.page === visitor.location.page)
    );
  }

  private handleVisitorLeft(data: any): void {
    this.visitors.delete(data.visitorId);
    
    // Notify all page subscribers
    this.presenceSubscribers.forEach((subscribers, page) => {
      const pageVisitors = Array.from(this.visitors.values())
        .filter(v => v.location.page === page);
      this.notifyPagePresenceSubscribers(page, pageVisitors);
    });
  }

  private handleVisitorUpdated(data: any): void {
    const visitor = data.visitor;
    this.visitors.set(visitor.id, visitor);
    
    // Notify relevant page subscribers
    this.notifyPagePresenceSubscribers(
      visitor.location.page,
      Array.from(this.visitors.values()).filter(v => v.location.page === visitor.location.page)
    );
  }

  private handlePageView(data: any): void {
    // Handle incoming page view data
    this.storePageView(data.pageView);
  }

  private handleVisitorStats(data: any): void {
    // Handle incoming visitor stats
    this.statsSubscribers.forEach(callback => {
      try {
        callback(data.stats);
      } catch (error) {
        console.error('Error notifying stats subscriber:', error);
      }
    });
  }

  // Utility methods
  private getCurrentPage(): string {
    return window.location.pathname;
  }

  private getCurrentUser(): any {
    // Get current user from auth context or localStorage
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('visitor_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('visitor_session_id', sessionId);
    }
    return sessionId;
  }

  private generateVisitorId(): string {
    return `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePageViewId(): string {
    return `pageview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getDeviceMetadata(): Promise<any> {
    const userAgent = navigator.userAgent;
    
    return {
      userAgent,
      browser: this.getBrowserName(userAgent),
      os: this.getOSName(userAgent),
      device: this.getDeviceType(userAgent),
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }

  private getBrowserName(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOSName(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private getDeviceType(userAgent: string): string {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'Mobile';
    if (/Tablet|iPad/.test(userAgent)) return 'Tablet';
    return 'Desktop';
  }

  private getPageVisitorCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    
    Array.from(this.visitors.values()).forEach(visitor => {
      if (visitor.isActive) {
        const page = visitor.location.page;
        counts[page] = (counts[page] || 0) + 1;
      }
    });

    return counts;
  }

  private getActivePages(): Array<{ page: string; count: number }> {
    const pageCounts = this.getPageVisitorCounts();
    return Object.entries(pageCounts)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count);
  }

  private getCountryStats(): Array<{ country: string; count: number }> {
    const countries: Record<string, number> = {};
    
    Array.from(this.visitors.values()).forEach(visitor => {
      const country = visitor.metadata.country || 'Unknown';
      countries[country] = (countries[country] || 0) + 1;
    });

    return Object.entries(countries)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);
  }

  private getBrowserStats(): Array<{ browser: string; count: number }> {
    const browsers: Record<string, number> = {};
    
    Array.from(this.visitors.values()).forEach(visitor => {
      const browser = visitor.metadata.browser || 'Unknown';
      browsers[browser] = (browsers[browser] || 0) + 1;
    });

    return Object.entries(browsers)
      .map(([browser, count]) => ({ browser, count }))
      .sort((a, b) => b.count - a.count);
  }

  private getDeviceStats(): Array<{ device: string; count: number }> {
    const devices: Record<string, number> = {};
    
    Array.from(this.visitors.values()).forEach(visitor => {
      const device = visitor.metadata.device || 'Unknown';
      devices[device] = (devices[device] || 0) + 1;
    });

    return Object.entries(devices)
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count);
  }

  private getTotalPageViews(): number {
    return Array.from(this.pageViews.values())
      .reduce((total, views) => total + views.length, 0);
  }

  private getAverageTimeOnSite(): number {
    const timeOnSite = Array.from(this.visitors.values())
      .map(v => v.timeOnPage)
      .filter(time => time > 0);
    
    return timeOnSite.length > 0 
      ? timeOnSite.reduce((sum, time) => sum + time, 0) / timeOnSite.length 
      : 0;
  }

  private calculateBounceRate(): number {
    // Simplified bounce rate calculation
    const totalSessions = this.visitors.size;
    const bouncedSessions = Array.from(this.visitors.values())
      .filter(v => v.timeOnPage < 10000).length; // Less than 10 seconds
    
    return totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;
  }

  private getTopPages(): Array<{ page: string; views: number }> {
    const pageViewCounts: Record<string, number> = {};
    
    Array.from(this.pageViews.values()).forEach(views => {
      views.forEach(view => {
        pageViewCounts[view.page] = (pageViewCounts[view.page] || 0) + 1;
      });
    });

    return Object.entries(pageViewCounts)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views);
  }

  private getTrafficSources(): Array<{ source: string; count: number }> {
    // Simplified traffic source analysis
    const sources: Record<string, number> = {};
    
    Array.from(this.pageViews.values()).forEach(views => {
      views.forEach(view => {
        const referrer = view.referrer || 'Direct';
        const source = this.categorizeReferrer(referrer);
        sources[source] = (sources[source] || 0) + 1;
      });
    });

    return Object.entries(sources)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  }

  private categorizeReferrer(referrer: string): string {
    if (!referrer || referrer === '') return 'Direct';
    if (referrer.includes('google.com')) return 'Google';
    if (referrer.includes('facebook.com')) return 'Facebook';
    if (referrer.includes('twitter.com')) return 'Twitter';
    if (referrer.includes('linkedin.com')) return 'LinkedIn';
    return 'Other';
  }

  private getDemographics(): any {
    return {
      countries: this.getCountryStats(),
      browsers: this.getBrowserStats(),
      devices: this.getDeviceStats()
    };
  }
}

// Export singleton instance
export const liveVisitorService = new LiveVisitorService(); 