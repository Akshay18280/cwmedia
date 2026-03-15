/**
 * Video Streaming Service
 * Handles video playback, adaptive bitrate streaming, and CDN delivery
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

import { appConfig } from '@/config/appConfig';

export interface VideoStream {
  id: string;
  url: string;
  quality: string;
  bitrate: number;
  resolution: string;
  codec: string;
  format: string;
}

export interface VideoSource {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  duration: number;
  streams: VideoStream[];
  metadata: VideoStreamMetadata;
  analytics: VideoAnalytics;
}

export interface VideoStreamMetadata {
  uploadedAt: Date;
  size: number;
  aspectRatio: string;
  framerate: number;
  audioCodec?: string;
  subtitles?: SubtitleTrack[];
  chapters?: VideoChapter[];
}

export interface SubtitleTrack {
  id: string;
  language: string;
  label: string;
  url: string;
  default?: boolean;
}

export interface VideoChapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  thumbnail?: string;
}

export interface VideoAnalytics {
  views: number;
  uniqueViews: number;
  totalWatchTime: number;
  averageWatchTime: number;
  completionRate: number;
  engagementRate: number;
  qualityDistribution: Record<string, number>;
  deviceDistribution: Record<string, number>;
  geographicDistribution: Record<string, number>;
}

export interface PlaybackOptions {
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  poster?: string;
  playbackRate?: number;
  volume?: number;
  currentTime?: number;
  quality?: string;
  adaptiveStreaming?: boolean;
  enableAnalytics?: boolean;
}

export interface PlaybackState {
  currentTime: number;
  duration: number;
  paused: boolean;
  muted: boolean;
  volume: number;
  playbackRate: number;
  buffered: TimeRanges | null;
  seekable: TimeRanges | null;
  currentQuality: string;
  availableQualities: string[];
  isLive: boolean;
  hasError: boolean;
  error?: string;
}

export interface StreamingEvent {
  type: StreamingEventType;
  timestamp: number;
  data?: any;
}

export type StreamingEventType = 
  | 'play' 
  | 'pause' 
  | 'seek' 
  | 'ended' 
  | 'error' 
  | 'qualitychange' 
  | 'buffering' 
  | 'progress'
  | 'timeupdate'
  | 'volumechange'
  | 'ratechange';

class VideoStreamingService {
  private activeStreams = new Map<string, VideoSource>();
  private eventListeners = new Map<string, Set<(event: StreamingEvent) => void>>();
  private analyticsBuffer = new Map<string, StreamingEvent[]>();
  private cdnEndpoints: string[] = [];
  private adaptiveStreamingEnabled = true;

  constructor() {
    this.initializeCDN();
    this.startAnalyticsFlush();
  }

  /**
   * Initialize CDN endpoints
   */
  private initializeCDN(): void {
    // Configure CDN endpoints based on build mode
    if (import.meta.env.PROD) {
      this.cdnEndpoints = [...appConfig.cdn.endpoints];
    } else {
      this.cdnEndpoints = [
        'http://localhost:3001'
      ];
    }
  }

  /**
   * Get video source with all streaming options
   */
  public async getVideoSource(videoId: string): Promise<VideoSource | null> {
    try {
      // Check cache first
      if (this.activeStreams.has(videoId)) {
        return this.activeStreams.get(videoId)!;
      }

      // Fetch from API
      const response = await fetch(`/api/videos/${videoId}/stream`);
      if (!response.ok) {
        throw new Error('Video not found');
      }

      const data = await response.json();
      const videoSource: VideoSource = {
        id: data.id,
        title: data.title,
        description: data.description,
        thumbnail: data.thumbnail,
        duration: data.duration,
        streams: this.optimizeStreamUrls(data.streams),
        metadata: {
          uploadedAt: new Date(data.uploadedAt),
          size: data.size,
          aspectRatio: data.aspectRatio,
          framerate: data.framerate,
          audioCodec: data.audioCodec,
          subtitles: data.subtitles || [],
          chapters: data.chapters || []
        },
        analytics: data.analytics || this.createEmptyAnalytics()
      };

      // Cache the source
      this.activeStreams.set(videoId, videoSource);

      return videoSource;

    } catch (error) {
      console.error('Error getting video source:', error);
      return null;
    }
  }

  /**
   * Get optimal video stream based on device and connection
   */
  public getOptimalStream(videoSource: VideoSource, options?: {
    maxBitrate?: number;
    preferredQuality?: string;
    deviceType?: string;
    connectionType?: string;
  }): VideoStream {
    const { streams } = videoSource;
    
    if (streams.length === 0) {
      throw new Error('No streams available');
    }

    // Sort streams by quality (highest first)
    const sortedStreams = [...streams].sort((a, b) => b.bitrate - a.bitrate);

    // If specific quality requested, find it
    if (options?.preferredQuality) {
      const preferredStream = streams.find(s => s.quality === options.preferredQuality);
      if (preferredStream) {
        return preferredStream;
      }
    }

    // Auto-select based on device capabilities and connection
    const deviceCapabilities = this.getDeviceCapabilities(options?.deviceType);
    const connectionQuality = this.assessConnectionQuality(options?.connectionType);

    // Filter streams based on device capabilities
    let availableStreams = sortedStreams.filter(stream => {
      const [width, height] = this.parseResolution(stream.resolution);
      return height <= deviceCapabilities.maxHeight && 
             stream.bitrate <= deviceCapabilities.maxBitrate;
    });

    // Further filter based on connection quality
    if (options?.maxBitrate || connectionQuality.maxBitrate) {
      const maxBitrate = Math.min(
        options?.maxBitrate || Infinity,
        connectionQuality.maxBitrate
      );
      availableStreams = availableStreams.filter(s => s.bitrate <= maxBitrate);
    }

    // Return the highest quality available stream
    return availableStreams[0] || streams[streams.length - 1];
  }

  /**
   * Create adaptive streaming playlist
   */
  public createAdaptivePlaylist(videoSource: VideoSource): string {
    const { streams } = videoSource;
    
    // Generate HLS playlist
    let playlist = '#EXTM3U\n';
    playlist += '#EXT-X-VERSION:6\n';
    playlist += '#EXT-X-INDEPENDENT-SEGMENTS\n';

    streams.forEach(stream => {
      const [width, height] = this.parseResolution(stream.resolution);
      playlist += `#EXT-X-STREAM-INF:BANDWIDTH=${stream.bitrate * 1000},RESOLUTION=${width}x${height},CODECS="${this.getCodecString(stream)}"\n`;
      playlist += `${stream.url}\n`;
    });

    return playlist;
  }

  /**
   * Track video analytics event
   */
  public trackEvent(videoId: string, event: StreamingEvent): void {
    // Add to analytics buffer
    if (!this.analyticsBuffer.has(videoId)) {
      this.analyticsBuffer.set(videoId, []);
    }
    this.analyticsBuffer.get(videoId)!.push(event);

    // Notify event listeners
    const listeners = this.eventListeners.get(videoId);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }

    // Real-time analytics for critical events
    if (['play', 'pause', 'ended', 'error'].includes(event.type)) {
      this.sendAnalyticsImmediate(videoId, event);
    }
  }

  /**
   * Subscribe to streaming events
   */
  public addEventListener(videoId: string, listener: (event: StreamingEvent) => void): () => void {
    if (!this.eventListeners.has(videoId)) {
      this.eventListeners.set(videoId, new Set());
    }
    this.eventListeners.get(videoId)!.add(listener);

    return () => {
      const listeners = this.eventListeners.get(videoId);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.eventListeners.delete(videoId);
        }
      }
    };
  }

  /**
   * Get video analytics
   */
  public async getVideoAnalytics(videoId: string, timeRange?: {
    start: Date;
    end: Date;
  }): Promise<VideoAnalytics> {
    try {
      const params = new URLSearchParams();
      if (timeRange) {
        params.append('start', timeRange.start.toISOString());
        params.append('end', timeRange.end.toISOString());
      }

      const response = await fetch(`/api/videos/${videoId}/analytics?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      return await response.json();

    } catch (error) {
      console.error('Error getting video analytics:', error);
      return this.createEmptyAnalytics();
    }
  }

  /**
   * Preload video for faster playback
   */
  public async preloadVideo(videoId: string, quality?: string): Promise<void> {
    try {
      const videoSource = await this.getVideoSource(videoId);
      if (!videoSource) {
        throw new Error('Video not found');
      }

      const stream = quality 
        ? videoSource.streams.find(s => s.quality === quality)
        : this.getOptimalStream(videoSource);

      if (!stream) {
        throw new Error('No suitable stream found');
      }

      // Create a preload request
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = stream.url;
      link.as = 'video';
      document.head.appendChild(link);

      // Track preload analytics
      this.trackEvent(videoId, {
        type: 'progress',
        timestamp: Date.now(),
        data: { action: 'preload', quality: stream.quality }
      });

    } catch (error) {
      console.error('Error preloading video:', error);
      throw error;
    }
  }

  /**
   * Get bandwidth estimation
   */
  public async estimateBandwidth(): Promise<number> {
    try {
      // Use Network Information API if available
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection && connection.downlink) {
          return connection.downlink * 1000; // Convert Mbps to kbps
        }
      }

      // Fallback: perform a small download test
      const testUrl = `${this.cdnEndpoints[0]}/bandwidth-test.dat`;
      const startTime = Date.now();
      
      const response = await fetch(testUrl, { cache: 'no-store' });
      const buffer = await response.arrayBuffer();
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000; // seconds
      const sizeInBits = buffer.byteLength * 8;
      
      return Math.round(sizeInBits / duration / 1000); // kbps

    } catch (error) {
      console.error('Error estimating bandwidth:', error);
      // Return conservative default
      return 1000; // 1 Mbps
    }
  }

  /**
   * Update video view count
   */
  public async updateViewCount(videoId: string, data: {
    watchTime: number;
    completed: boolean;
    quality: string;
    device: string;
    location?: string;
  }): Promise<void> {
    try {
      await fetch(`/api/videos/${videoId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          timestamp: new Date(),
          sessionId: this.getSessionId()
        })
      });

    } catch (error) {
      console.error('Error updating view count:', error);
    }
  }

  // Private helper methods

  private optimizeStreamUrls(streams: VideoStream[]): VideoStream[] {
    return streams.map(stream => ({
      ...stream,
      url: this.getCDNUrl(stream.url)
    }));
  }

  private getCDNUrl(originalUrl: string): string {
    // Simple round-robin CDN selection
    const cdnIndex = Math.floor(Math.random() * this.cdnEndpoints.length);
    const cdnEndpoint = this.cdnEndpoints[cdnIndex];
    
    // If URL is already absolute, return as is
    if (originalUrl.startsWith('http')) {
      return originalUrl;
    }

    return `${cdnEndpoint}${originalUrl}`;
  }

  private getDeviceCapabilities(deviceType?: string): {
    maxHeight: number;
    maxBitrate: number;
  } {
    const screenHeight = window.screen.height;
    const devicePixelRatio = window.devicePixelRatio || 1;
    const effectiveHeight = screenHeight * devicePixelRatio;

    // Determine capabilities based on device
    if (deviceType === 'mobile' || window.innerWidth <= 768) {
      return {
        maxHeight: Math.min(effectiveHeight, 720),
        maxBitrate: 2000 // 2 Mbps
      };
    }

    if (deviceType === 'tablet' || window.innerWidth <= 1024) {
      return {
        maxHeight: Math.min(effectiveHeight, 1080),
        maxBitrate: 4000 // 4 Mbps
      };
    }

    // Desktop
    return {
      maxHeight: effectiveHeight,
      maxBitrate: 8000 // 8 Mbps
    };
  }

  private assessConnectionQuality(connectionType?: string): {
    maxBitrate: number;
    description: string;
  } {
    // Use Network Information API if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        
        switch (effectiveType) {
          case 'slow-2g':
            return { maxBitrate: 400, description: 'Very slow connection' };
          case '2g':
            return { maxBitrate: 800, description: 'Slow connection' };
          case '3g':
            return { maxBitrate: 2000, description: 'Moderate connection' };
          case '4g':
            return { maxBitrate: 8000, description: 'Fast connection' };
          default:
            return { maxBitrate: 4000, description: 'Unknown connection' };
        }
      }
    }

    // Fallback based on connection type hint
    switch (connectionType) {
      case 'wifi':
        return { maxBitrate: 8000, description: 'WiFi connection' };
      case 'cellular':
        return { maxBitrate: 2000, description: 'Cellular connection' };
      default:
        return { maxBitrate: 4000, description: 'Unknown connection' };
    }
  }

  private parseResolution(resolution: string): [number, number] {
    const [width, height] = resolution.split('x').map(Number);
    return [width || 0, height || 0];
  }

  private getCodecString(stream: VideoStream): string {
    // Return appropriate codec string for HLS
    switch (stream.codec) {
      case 'h264':
        return 'avc1.42E01E,mp4a.40.2';
      case 'h265':
        return 'hev1.1.6.L93.90,mp4a.40.2';
      case 'vp9':
        return 'vp09.00.10.08,opus';
      default:
        return 'avc1.42E01E,mp4a.40.2';
    }
  }

  private createEmptyAnalytics(): VideoAnalytics {
    return {
      views: 0,
      uniqueViews: 0,
      totalWatchTime: 0,
      averageWatchTime: 0,
      completionRate: 0,
      engagementRate: 0,
      qualityDistribution: {},
      deviceDistribution: {},
      geographicDistribution: {}
    };
  }

  private startAnalyticsFlush(): void {
    // Flush analytics buffer every 30 seconds
    setInterval(() => {
      this.flushAnalytics();
    }, 30000);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushAnalytics();
    });
  }

  private async flushAnalytics(): Promise<void> {
    if (this.analyticsBuffer.size === 0) return;

    try {
      const analyticsData = Array.from(this.analyticsBuffer.entries()).map(([videoId, events]) => ({
        videoId,
        events: events.splice(0) // Remove events from buffer
      }));

      await fetch('/api/videos/analytics/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analytics: analyticsData })
      });

      // Clear processed buffers
      analyticsData.forEach(({ videoId }) => {
        if (this.analyticsBuffer.get(videoId)?.length === 0) {
          this.analyticsBuffer.delete(videoId);
        }
      });

    } catch (error) {
      console.error('Error flushing analytics:', error);
    }
  }

  private async sendAnalyticsImmediate(videoId: string, event: StreamingEvent): Promise<void> {
    try {
      await fetch(`/api/videos/${videoId}/analytics/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('Error sending immediate analytics:', error);
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('video_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('video_session_id', sessionId);
    }
    return sessionId;
  }
}

// Export singleton instance
export const videoStreamingService = new VideoStreamingService(); 