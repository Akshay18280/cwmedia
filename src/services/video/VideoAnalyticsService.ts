/**
 * Video Analytics Service
 * Comprehensive analytics tracking for video content and engagement
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

import { collection, addDoc, getDocs, query, where, orderBy, limit, startAfter, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface VideoAnalyticsEvent {
  id?: string;
  videoId: string;
  postId?: string;
  userId?: string;
  sessionId: string;
  eventType: VideoEventType;
  timestamp: Date;
  data: any;
  metadata: {
    userAgent: string;
    device: string;
    browser: string;
    os: string;
    country?: string;
    city?: string;
    referrer?: string;
    quality?: string;
    volume?: number;
    playbackRate?: number;
  };
}

export type VideoEventType = 
  | 'video_load'
  | 'play'
  | 'pause'
  | 'seek'
  | 'ended'
  | 'quality_change'
  | 'volume_change'
  | 'rate_change'
  | 'fullscreen_enter'
  | 'fullscreen_exit'
  | 'like'
  | 'unlike'
  | 'share'
  | 'bookmark'
  | 'comment'
  | 'progress_25'
  | 'progress_50'
  | 'progress_75'
  | 'progress_100'
  | 'buffer_start'
  | 'buffer_end'
  | 'error';

export interface VideoViewSession {
  id?: string;
  videoId: string;
  postId?: string;
  userId?: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  watchTime: number;
  completionRate: number;
  averageQuality: string;
  interactions: number;
  metadata: {
    device: string;
    browser: string;
    os: string;
    country?: string;
    referrer?: string;
    isUnique: boolean;
  };
}

export interface VideoAnalyticsReport {
  videoId: string;
  postId?: string;
  reportPeriod: {
    start: Date;
    end: Date;
  };
  
  // View metrics
  totalViews: number;
  uniqueViews: number;
  averageViewDuration: number;
  completionRate: number;
  totalWatchTime: number;
  
  // Engagement metrics
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  engagementRate: number;
  
  // Quality metrics
  qualityDistribution: Array<{ quality: string; percentage: number; views: number }>;
  averageQuality: string;
  
  // Device & browser analytics
  deviceBreakdown: Array<{ device: string; views: number; percentage: number }>;
  browserBreakdown: Array<{ browser: string; views: number; percentage: number }>;
  osBreakdown: Array<{ os: string; views: number; percentage: number }>;
  
  // Geographic analytics
  countryBreakdown: Array<{ country: string; views: number; percentage: number }>;
  topCities: Array<{ city: string; country: string; views: number }>;
  
  // Time-based analytics
  viewsByHour: Array<{ hour: number; views: number }>;
  viewsByDay: Array<{ date: string; views: number; watchTime: number }>;
  peakViewingTime: { hour: number; day: string };
  
  // Retention analytics
  audienceRetention: Array<{ timePercent: number; retentionPercent: number }>;
  averageDropoffPoint: number;
  
  // Traffic sources
  trafficSources: Array<{ source: string; views: number; percentage: number }>;
  topReferrers: Array<{ referrer: string; views: number }>;
  
  // Performance metrics
  averageLoadTime: number;
  bufferingEvents: number;
  errorRate: number;
  
  // Comparative metrics
  performanceScore: number;
  benchmarkComparison: {
    industry: number;
    category: number;
    channel: number;
  };
}

export interface RealtimeAnalytics {
  videoId: string;
  currentViewers: number;
  concurrentPeakToday: number;
  liveEngagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  realtimeLocations: Array<{ country: string; viewers: number }>;
  realtimeDevices: Array<{ device: string; viewers: number }>;
  chatActivity?: number;
}

class VideoAnalyticsService {
  private readonly EVENTS_COLLECTION = 'video_analytics_events';
  private readonly SESSIONS_COLLECTION = 'video_view_sessions';
  private readonly REPORTS_COLLECTION = 'video_analytics_reports';
  
  private eventBuffer: VideoAnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout;
  private activeSessions = new Map<string, VideoViewSession>();

  constructor() {
    // Flush events every 10 seconds
    this.flushInterval = setInterval(() => {
      this.flushEventBuffer();
    }, 10000);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushEventBuffer();
      this.endAllSessions();
    });
  }

  /**
   * Track video analytics event
   */
  public trackEvent(
    videoId: string,
    eventType: VideoEventType,
    data: any = {},
    userId?: string,
    postId?: string
  ): void {
    const sessionId = this.getSessionId();
    
    const event: VideoAnalyticsEvent = {
      videoId,
      postId,
      userId,
      sessionId,
      eventType,
      timestamp: new Date(),
      data,
      metadata: {
        ...this.getDeviceMetadata(),
        ...data.metadata
      }
    };

    // Add to buffer
    this.eventBuffer.push(event);

    // Handle special events
    this.handleSpecialEvent(event);

    // Immediate flush for critical events
    if (['play', 'ended', 'error'].includes(eventType)) {
      this.flushEventBuffer();
    }
  }

  /**
   * Start video view session
   */
  public startViewSession(
    videoId: string,
    userId?: string,
    postId?: string
  ): string {
    const sessionId = this.getSessionId();
    
    const session: VideoViewSession = {
      videoId,
      postId,
      userId,
      sessionId,
      startTime: new Date(),
      duration: 0,
      watchTime: 0,
      completionRate: 0,
      averageQuality: 'auto',
      interactions: 0,
      metadata: {
        ...this.getDeviceMetadata(),
        isUnique: this.isUniqueView(videoId, userId)
      }
    };

    this.activeSessions.set(sessionId, session);
    
    this.trackEvent(videoId, 'video_load', {
      sessionStarted: true,
      isUnique: session.metadata.isUnique
    }, userId, postId);

    return sessionId;
  }

  /**
   * Update view session
   */
  public updateViewSession(
    sessionId: string,
    updates: Partial<VideoViewSession>
  ): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    Object.assign(session, updates);
    
    // Update watch time
    if (updates.watchTime !== undefined) {
      session.watchTime = updates.watchTime;
    }

    // Update completion rate
    if (updates.duration && updates.watchTime) {
      session.completionRate = Math.min(100, (updates.watchTime / updates.duration) * 100);
    }
  }

  /**
   * End view session
   */
  public async endViewSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.endTime = new Date();
    
    try {
      // Save session to database
      await addDoc(collection(db, this.SESSIONS_COLLECTION), {
        ...session,
        startTime: session.startTime,
        endTime: session.endTime,
        timestamp: serverTimestamp()
      });

      // Track session end event
      this.trackEvent(session.videoId, 'ended', {
        sessionDuration: session.duration,
        watchTime: session.watchTime,
        completionRate: session.completionRate,
        interactions: session.interactions
      }, session.userId, session.postId);

      // Remove from active sessions
      this.activeSessions.delete(sessionId);

    } catch (error) {
      console.error('Error ending view session:', error);
    }
  }

  /**
   * Get realtime analytics
   */
  public async getRealtimeAnalytics(videoId: string): Promise<RealtimeAnalytics> {
    try {
      // Get current viewers (active sessions in last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const realtimeQuery = query(
        collection(db, this.EVENTS_COLLECTION),
        where('videoId', '==', videoId),
        where('timestamp', '>=', fiveMinutesAgo),
        where('eventType', 'in', ['play', 'video_load'])
      );

      const snapshot = await getDocs(realtimeQuery);
      const events = snapshot.docs.map(doc => doc.data() as VideoAnalyticsEvent);

      // Calculate current viewers (unique sessions)
      const uniqueSessions = new Set(events.map(e => e.sessionId));
      const currentViewers = uniqueSessions.size;

      // Get today's peak concurrent viewers
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayPeakQuery = query(
        collection(db, this.REPORTS_COLLECTION),
        where('videoId', '==', videoId),
        where('reportDate', '==', today)
      );
      
      const todayPeakSnapshot = await getDocs(todayPeakQuery);
      const concurrentPeakToday = todayPeakSnapshot.docs[0]?.data()?.concurrentPeak || 0;

      // Group by location and device
      const locationCounts = new Map<string, number>();
      const deviceCounts = new Map<string, number>();

      events.forEach(event => {
        const country = event.metadata.country || 'Unknown';
        const device = event.metadata.device || 'Unknown';
        
        locationCounts.set(country, (locationCounts.get(country) || 0) + 1);
        deviceCounts.set(device, (deviceCounts.get(device) || 0) + 1);
      });

      return {
        videoId,
        currentViewers,
        concurrentPeakToday,
        liveEngagement: {
          likes: 0, // Get from real-time data
          comments: 0,
          shares: 0
        },
        realtimeLocations: Array.from(locationCounts.entries())
          .map(([country, viewers]) => ({ country, viewers }))
          .sort((a, b) => b.viewers - a.viewers),
        realtimeDevices: Array.from(deviceCounts.entries())
          .map(([device, viewers]) => ({ device, viewers }))
          .sort((a, b) => b.viewers - a.viewers)
      };

    } catch (error) {
      console.error('Error getting realtime analytics:', error);
      return {
        videoId,
        currentViewers: 0,
        concurrentPeakToday: 0,
        liveEngagement: { likes: 0, comments: 0, shares: 0 },
        realtimeLocations: [],
        realtimeDevices: []
      };
    }
  }

  /**
   * Generate analytics report
   */
  public async generateReport(
    videoId: string,
    startDate: Date,
    endDate: Date,
    postId?: string
  ): Promise<VideoAnalyticsReport> {
    try {
      // Get all events in date range
      const eventsQuery = query(
        collection(db, this.EVENTS_COLLECTION),
        where('videoId', '==', videoId),
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate),
        orderBy('timestamp', 'desc')
      );

      const eventsSnapshot = await getDocs(eventsQuery);
      const events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      } as VideoAnalyticsEvent));

      // Get all sessions in date range
      const sessionsQuery = query(
        collection(db, this.SESSIONS_COLLECTION),
        where('videoId', '==', videoId),
        where('startTime', '>=', startDate),
        where('startTime', '<=', endDate)
      );

      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = sessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate()
      } as VideoViewSession));

      // Calculate metrics
      const report = this.calculateReportMetrics(videoId, events, sessions, startDate, endDate, postId);
      
      // Save report to database
      await addDoc(collection(db, this.REPORTS_COLLECTION), {
        ...report,
        generatedAt: serverTimestamp()
      });

      return report;

    } catch (error) {
      console.error('Error generating analytics report:', error);
      throw error;
    }
  }

  /**
   * Get video performance comparison
   */
  public async getPerformanceComparison(
    videoId: string,
    compareWith: 'industry' | 'category' | 'channel' = 'category'
  ): Promise<{ metric: string; value: number; benchmark: number; percentile: number }[]> {
    try {
      // This would integrate with industry benchmarks
      // For now, return mock comparison data
      
      const report = await this.generateReport(videoId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date());
      
      return [
        {
          metric: 'Completion Rate',
          value: report.completionRate,
          benchmark: 65,
          percentile: report.completionRate > 65 ? 75 : 25
        },
        {
          metric: 'Engagement Rate',
          value: report.engagementRate,
          benchmark: 4.5,
          percentile: report.engagementRate > 4.5 ? 80 : 30
        },
        {
          metric: 'Average View Duration',
          value: report.averageViewDuration,
          benchmark: 180,
          percentile: report.averageViewDuration > 180 ? 70 : 40
        }
      ];

    } catch (error) {
      console.error('Error getting performance comparison:', error);
      return [];
    }
  }

  /**
   * Get audience insights
   */
  public async getAudienceInsights(
    videoId: string,
    days: number = 30
  ): Promise<{
    demographics: any;
    interests: any;
    behavior: any;
    loyalty: any;
  }> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    try {
      const report = await this.generateReport(videoId, startDate, endDate);
      
      return {
        demographics: {
          devices: report.deviceBreakdown,
          browsers: report.browserBreakdown,
          locations: report.countryBreakdown
        },
        interests: {
          // Would come from user profile analysis
          categories: [],
          relatedContent: []
        },
        behavior: {
          viewingPatterns: report.viewsByHour,
          retentionCurve: report.audienceRetention,
          engagementPoints: []
        },
        loyalty: {
          returnViewers: 0,
          subscriptionRate: 0,
          shareRate: (report.shares / report.totalViews) * 100
        }
      };

    } catch (error) {
      console.error('Error getting audience insights:', error);
      return {
        demographics: {},
        interests: {},
        behavior: {},
        loyalty: {}
      };
    }
  }

  // Private helper methods

  private async flushEventBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const eventsToFlush = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      // Batch write events to Firestore
      const batch = eventsToFlush.map(event => ({
        ...event,
        timestamp: event.timestamp
      }));

      // In a real implementation, use batch writes for better performance
      await Promise.all(
        batch.map(event => 
          addDoc(collection(db, this.EVENTS_COLLECTION), {
            ...event,
            timestamp: serverTimestamp()
          })
        )
      );

    } catch (error) {
      console.error('Error flushing event buffer:', error);
      // Add events back to buffer for retry
      this.eventBuffer.unshift(...eventsToFlush);
    }
  }

  private handleSpecialEvent(event: VideoAnalyticsEvent): void {
    const session = this.activeSessions.get(event.sessionId);
    if (!session) return;

    switch (event.eventType) {
      case 'play':
      case 'pause':
      case 'seek':
        session.interactions++;
        break;
      
      case 'quality_change':
        session.averageQuality = event.data.quality || session.averageQuality;
        break;
      
      case 'ended':
        session.completionRate = 100;
        break;
    }
  }

  private calculateReportMetrics(
    videoId: string,
    events: VideoAnalyticsEvent[],
    sessions: VideoViewSession[],
    startDate: Date,
    endDate: Date,
    postId?: string
  ): VideoAnalyticsReport {
    // Calculate view metrics
    const totalViews = sessions.length;
    const uniqueViews = new Set(sessions.map(s => s.userId).filter(Boolean)).size;
    const totalWatchTime = sessions.reduce((sum, s) => sum + s.watchTime, 0);
    const averageViewDuration = totalViews > 0 ? totalWatchTime / totalViews : 0;
    const completionRate = sessions.length > 0 ? 
      sessions.reduce((sum, s) => sum + s.completionRate, 0) / sessions.length : 0;

    // Calculate engagement metrics
    const engagementEvents = events.filter(e => 
      ['like', 'share', 'comment', 'bookmark'].includes(e.eventType)
    );
    const likes = events.filter(e => e.eventType === 'like').length;
    const shares = events.filter(e => e.eventType === 'share').length;
    const comments = events.filter(e => e.eventType === 'comment').length;
    const bookmarks = events.filter(e => e.eventType === 'bookmark').length;
    const engagementRate = totalViews > 0 ? (engagementEvents.length / totalViews) * 100 : 0;

    // Calculate device/browser breakdown
    const deviceCounts = this.calculateBreakdown(sessions, 'device');
    const browserCounts = this.calculateBreakdown(sessions, 'browser');
    const osCounts = this.calculateBreakdown(sessions, 'os');
    const countryCounts = this.calculateBreakdown(sessions, 'country');

    // Calculate quality distribution
    const qualityCounts = this.calculateBreakdown(sessions, 'averageQuality');

    // Calculate time-based analytics
    const viewsByHour = this.calculateViewsByHour(sessions);
    const viewsByDay = this.calculateViewsByDay(sessions);

    // Calculate audience retention (simplified)
    const audienceRetention = this.calculateAudienceRetention(events);

    // Calculate traffic sources
    const trafficSources = this.calculateTrafficSources(sessions);

    return {
      videoId,
      postId,
      reportPeriod: { start: startDate, end: endDate },
      
      totalViews,
      uniqueViews,
      averageViewDuration,
      completionRate,
      totalWatchTime,
      
      likes,
      dislikes: 0, // Not tracked yet
      comments,
      shares,
      bookmarks,
      engagementRate,
      
      qualityDistribution: qualityCounts,
      averageQuality: this.getMostCommon(sessions.map(s => s.averageQuality)),
      
      deviceBreakdown: deviceCounts,
      browserBreakdown: browserCounts,
      osBreakdown: osCounts,
      
      countryBreakdown: countryCounts,
      topCities: [], // Not implemented yet
      
      viewsByHour,
      viewsByDay,
      peakViewingTime: this.calculatePeakViewingTime(viewsByHour, viewsByDay),
      
      audienceRetention,
      averageDropoffPoint: this.calculateAverageDropoffPoint(audienceRetention),
      
      trafficSources,
      topReferrers: [], // Not implemented yet
      
      averageLoadTime: 0, // Not tracked yet
      bufferingEvents: events.filter(e => e.eventType === 'buffer_start').length,
      errorRate: (events.filter(e => e.eventType === 'error').length / totalViews) * 100,
      
      performanceScore: this.calculatePerformanceScore(completionRate, engagementRate, averageViewDuration),
      benchmarkComparison: {
        industry: 0,
        category: 0,
        channel: 0
      }
    };
  }

  private calculateBreakdown(
    sessions: VideoViewSession[],
    field: keyof VideoViewSession['metadata']
  ): Array<{ [key: string]: any; views: number; percentage: number }> {
    const counts = new Map<string, number>();
    
    sessions.forEach(session => {
      const value = (session.metadata as any)[field] || 'Unknown';
      counts.set(value, (counts.get(value) || 0) + 1);
    });

    const total = sessions.length;
    
    return Array.from(counts.entries())
      .map(([key, views]) => ({
        [field === 'averageQuality' ? 'quality' : field]: key,
        views,
        percentage: total > 0 ? (views / total) * 100 : 0
      }))
      .sort((a, b) => b.views - a.views);
  }

  private calculateViewsByHour(sessions: VideoViewSession[]): Array<{ hour: number; views: number }> {
    const hourCounts = new Array(24).fill(0);
    
    sessions.forEach(session => {
      const hour = session.startTime.getHours();
      hourCounts[hour]++;
    });

    return hourCounts.map((views, hour) => ({ hour, views }));
  }

  private calculateViewsByDay(sessions: VideoViewSession[]): Array<{ date: string; views: number; watchTime: number }> {
    const dayCounts = new Map<string, { views: number; watchTime: number }>();
    
    sessions.forEach(session => {
      const date = session.startTime.toISOString().split('T')[0];
      const current = dayCounts.get(date) || { views: 0, watchTime: 0 };
      
      dayCounts.set(date, {
        views: current.views + 1,
        watchTime: current.watchTime + session.watchTime
      });
    });

    return Array.from(dayCounts.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateAudienceRetention(events: VideoAnalyticsEvent[]): Array<{ timePercent: number; retentionPercent: number }> {
    // Simplified retention calculation
    const progressEvents = events.filter(e => 
      ['progress_25', 'progress_50', 'progress_75', 'progress_100'].includes(e.eventType)
    );

    const totalSessions = new Set(events.map(e => e.sessionId)).size;
    
    return [
      { timePercent: 25, retentionPercent: this.calculateRetentionAtPoint(progressEvents, 'progress_25', totalSessions) },
      { timePercent: 50, retentionPercent: this.calculateRetentionAtPoint(progressEvents, 'progress_50', totalSessions) },
      { timePercent: 75, retentionPercent: this.calculateRetentionAtPoint(progressEvents, 'progress_75', totalSessions) },
      { timePercent: 100, retentionPercent: this.calculateRetentionAtPoint(progressEvents, 'progress_100', totalSessions) }
    ];
  }

  private calculateRetentionAtPoint(events: VideoAnalyticsEvent[], eventType: string, totalSessions: number): number {
    const uniqueSessions = new Set(events.filter(e => e.eventType === eventType).map(e => e.sessionId));
    return totalSessions > 0 ? (uniqueSessions.size / totalSessions) * 100 : 0;
  }

  private calculateTrafficSources(sessions: VideoViewSession[]): Array<{ source: string; views: number; percentage: number }> {
    const sources = new Map<string, number>();
    
    sessions.forEach(session => {
      const referrer = session.metadata.referrer || 'Direct';
      const source = this.categorizeReferrer(referrer);
      sources.set(source, (sources.get(source) || 0) + 1);
    });

    const total = sessions.length;
    
    return Array.from(sources.entries())
      .map(([source, views]) => ({
        source,
        views,
        percentage: total > 0 ? (views / total) * 100 : 0
      }))
      .sort((a, b) => b.views - a.views);
  }

  private calculatePeakViewingTime(
    viewsByHour: Array<{ hour: number; views: number }>,
    viewsByDay: Array<{ date: string; views: number; watchTime: number }>
  ): { hour: number; day: string } {
    const peakHour = viewsByHour.reduce((max, current) => 
      current.views > max.views ? current : max
    );
    
    const peakDay = viewsByDay.reduce((max, current) => 
      current.views > max.views ? current : max
    );

    return {
      hour: peakHour.hour,
      day: peakDay.date
    };
  }

  private calculateAverageDropoffPoint(retention: Array<{ timePercent: number; retentionPercent: number }>): number {
    // Find the point where retention drops below 50%
    const dropoffPoint = retention.find(point => point.retentionPercent < 50);
    return dropoffPoint ? dropoffPoint.timePercent : 100;
  }

  private calculatePerformanceScore(completionRate: number, engagementRate: number, averageViewDuration: number): number {
    // Weighted score calculation
    const completionWeight = 0.4;
    const engagementWeight = 0.3;
    const durationWeight = 0.3;
    
    const normalizedCompletion = Math.min(completionRate / 100, 1);
    const normalizedEngagement = Math.min(engagementRate / 10, 1); // Assuming 10% is excellent
    const normalizedDuration = Math.min(averageViewDuration / 300, 1); // Assuming 5 minutes is excellent
    
    return Math.round(
      (normalizedCompletion * completionWeight +
       normalizedEngagement * engagementWeight +
       normalizedDuration * durationWeight) * 100
    );
  }

  private categorizeReferrer(referrer: string): string {
    if (!referrer || referrer === 'Direct') return 'Direct';
    if (referrer.includes('google.')) return 'Google Search';
    if (referrer.includes('youtube.')) return 'YouTube';
    if (referrer.includes('facebook.')) return 'Facebook';
    if (referrer.includes('twitter.')) return 'Twitter';
    if (referrer.includes('linkedin.')) return 'LinkedIn';
    return 'Other';
  }

  private getMostCommon<T>(array: T[]): T {
    const counts = new Map<T, number>();
    array.forEach(item => counts.set(item, (counts.get(item) || 0) + 1));
    
    let maxCount = 0;
    let mostCommon = array[0];
    
    counts.forEach((count, item) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    });
    
    return mostCommon;
  }

  private endAllSessions(): void {
    this.activeSessions.forEach((session, sessionId) => {
      this.endViewSession(sessionId);
    });
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('video_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('video_session_id', sessionId);
    }
    return sessionId;
  }

  private isUniqueView(videoId: string, userId?: string): boolean {
    // Check if this user has viewed this video before (simplified)
    const viewKey = `viewed_${videoId}_${userId || 'anonymous'}`;
    const hasViewed = localStorage.getItem(viewKey);
    
    if (!hasViewed) {
      localStorage.setItem(viewKey, Date.now().toString());
      return true;
    }
    
    return false;
  }

  private getDeviceMetadata(): Partial<VideoAnalyticsEvent['metadata']> {
    const userAgent = navigator.userAgent;
    
    return {
      userAgent,
      device: this.getDeviceType(),
      browser: this.getBrowserName(userAgent),
      os: this.getOSName(userAgent),
      referrer: document.referrer || 'Direct'
    };
  }

  private getDeviceType(): string {
    const width = window.innerWidth;
    if (width <= 768) return 'Mobile';
    if (width <= 1024) return 'Tablet';
    return 'Desktop';
  }

  private getBrowserName(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  }

  private getOSName(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Other';
  }
}

// Export singleton instance
export const videoAnalyticsService = new VideoAnalyticsService(); 