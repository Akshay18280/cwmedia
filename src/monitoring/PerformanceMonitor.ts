/**
 * Performance Monitoring System for Carelwave Media
 * Real-time performance tracking, error monitoring, and user analytics
 * Integrated with modern monitoring services and custom metrics
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

// Core Web Vitals interface
interface CoreWebVitals {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  inp: number; // Interaction to Next Paint
}

// Performance metrics interface
interface PerformanceMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  timeToInteractive: number;
  resourceLoadTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  navigationTiming: PerformanceNavigationTiming;
  resourceTiming: PerformanceResourceTiming[];
}

// User interaction metrics
interface UserMetrics {
  sessionDuration: number;
  pageViews: number;
  bounceRate: number;
  scrollDepth: number;
  clickEvents: number;
  formSubmissions: number;
  voiceCommandsUsed: number;
  themeChanges: number;
}

// Error tracking interface
interface ErrorReport {
  message: string;
  stack: string;
  filename: string;
  lineno: number;
  colno: number;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: Record<string, any>;
}

// API performance metrics
interface APIMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  success: boolean;
  size: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics | null = null;
  private coreWebVitals: Partial<CoreWebVitals> = {};
  private userMetrics: UserMetrics = {
    sessionDuration: 0,
    pageViews: 0,
    bounceRate: 0,
    scrollDepth: 0,
    clickEvents: 0,
    formSubmissions: 0,
    voiceCommandsUsed: 0,
    themeChanges: 0
  };
  private errors: ErrorReport[] = [];
  private apiMetrics: APIMetrics[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private sessionStartTime: number = Date.now();
  private lastActivityTime: number = Date.now();
  private isMonitoring: boolean = false;
  private reportingEndpoint: string = '/api/analytics/performance';

  constructor(config: { reportingEndpoint?: string; autoStart?: boolean } = {}) {
    this.reportingEndpoint = config.reportingEndpoint || this.reportingEndpoint;
    
    if (config.autoStart !== false) {
      this.startMonitoring();
    }
  }

  /**
   * Start performance monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring || typeof window === 'undefined') return;

    this.isMonitoring = true;
    this.sessionStartTime = Date.now();

    // Initialize Core Web Vitals monitoring
    this.initializeCoreWebVitals();

    // Initialize performance observers
    this.initializePerformanceObservers();

    // Initialize error tracking
    this.initializeErrorTracking();

    // Initialize user interaction tracking
    this.initializeUserTracking();

    // Initialize API monitoring
    this.initializeAPIMonitoring();

    // Start periodic reporting
    this.startPeriodicReporting();

    console.log('Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    // Remove event listeners
    this.removeEventListeners();

    console.log('Performance monitoring stopped');
  }

  /**
   * Initialize Core Web Vitals monitoring
   */
  private initializeCoreWebVitals(): void {
    // First Contentful Paint (FCP)
    this.observePerformance('paint', (entries) => {
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.coreWebVitals.fcp = entry.startTime;
        }
      });
    });

    // Largest Contentful Paint (LCP)
    this.observePerformance('largest-contentful-paint', (entries) => {
      entries.forEach((entry) => {
        this.coreWebVitals.lcp = entry.startTime;
      });
    });

    // First Input Delay (FID) and Interaction to Next Paint (INP)
    this.observePerformance('first-input', (entries) => {
      entries.forEach((entry) => {
        this.coreWebVitals.fid = entry.processingStart - entry.startTime;
      });
    });

    // Cumulative Layout Shift (CLS)
    this.observePerformance('layout-shift', (entries) => {
      let clsValue = 0;
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.coreWebVitals.cls = clsValue;
    });

    // Time to First Byte (TTFB)
    if (window.performance && window.performance.getEntriesByType) {
      const navEntry = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navEntry) {
        this.coreWebVitals.ttfb = navEntry.responseStart - navEntry.requestStart;
      }
    }
  }

  /**
   * Initialize performance observers
   */
  private initializePerformanceObservers(): void {
    // Navigation timing
    this.observePerformance('navigation', (entries) => {
      entries.forEach((entry) => {
        const navEntry = entry as PerformanceNavigationTiming;
        this.metrics = {
          pageLoadTime: navEntry.loadEventEnd - navEntry.navigationStart,
          domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.navigationStart,
          timeToInteractive: this.calculateTTI(navEntry),
          resourceLoadTime: navEntry.loadEventEnd - navEntry.domContentLoadedEventEnd,
          cacheHitRate: this.calculateCacheHitRate(),
          memoryUsage: this.getMemoryUsage(),
          navigationTiming: navEntry,
          resourceTiming: performance.getEntriesByType('resource') as PerformanceResourceTiming[]
        };
      });
    });

    // Resource timing
    this.observePerformance('resource', (entries) => {
      entries.forEach((entry) => {
        const resourceEntry = entry as PerformanceResourceTiming;
        
        // Track slow resources
        const loadTime = resourceEntry.responseEnd - resourceEntry.startTime;
        if (loadTime > 1000) { // Resources taking more than 1 second
          this.reportSlowResource(resourceEntry);
        }
      });
    });

    // Long tasks
    this.observePerformance('longtask', (entries) => {
      entries.forEach((entry) => {
        this.reportLongTask(entry);
      });
    });
  }

  /**
   * Initialize error tracking
   */
  private initializeErrorTracking(): void {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack || '',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: this.getSessionId(),
        severity: this.determineSeverity(event.error),
        context: this.getErrorContext()
      });
    });

    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack || '',
        filename: 'unknown',
        lineno: 0,
        colno: 0,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: this.getSessionId(),
        severity: 'medium',
        context: { type: 'promise_rejection', reason: event.reason }
      });
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement;
        this.reportError({
          message: `Resource loading error: ${target.tagName}`,
          stack: '',
          filename: (target as any).src || (target as any).href || 'unknown',
          lineno: 0,
          colno: 0,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          sessionId: this.getSessionId(),
          severity: 'low',
          context: { type: 'resource_error', element: target.tagName }
        });
      }
    }, true);
  }

  /**
   * Initialize user interaction tracking
   */
  private initializeUserTracking(): void {
    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.userMetrics.sessionDuration += Date.now() - this.lastActivityTime;
      } else {
        this.lastActivityTime = Date.now();
        this.userMetrics.pageViews++;
      }
    });

    // Scroll tracking
    let maxScrollDepth = 0;
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollDepth = (scrollTop + windowHeight) / documentHeight * 100;
      
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        this.userMetrics.scrollDepth = Math.round(scrollDepth);
      }
    });

    // Click tracking
    document.addEventListener('click', (event) => {
      this.userMetrics.clickEvents++;
      this.trackUserInteraction('click', event.target as HTMLElement);
    });

    // Form submission tracking
    document.addEventListener('submit', (event) => {
      this.userMetrics.formSubmissions++;
      this.trackUserInteraction('form_submit', event.target as HTMLElement);
    });

    // Voice command tracking
    window.addEventListener('voiceCommandUsed', () => {
      this.userMetrics.voiceCommandsUsed++;
    });

    // Theme change tracking
    window.addEventListener('themeChanged', () => {
      this.userMetrics.themeChanges++;
    });
  }

  /**
   * Initialize API monitoring
   */
  private initializeAPIMonitoring(): void {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0] as string;
      const options = args[1] || {};
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        this.trackAPICall({
          endpoint: url,
          method: options.method || 'GET',
          responseTime: endTime - startTime,
          statusCode: response.status,
          success: response.ok,
          size: parseInt(response.headers.get('content-length') || '0'),
          timestamp: Date.now()
        });
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        
        this.trackAPICall({
          endpoint: url,
          method: options.method || 'GET',
          responseTime: endTime - startTime,
          statusCode: 0,
          success: false,
          size: 0,
          timestamp: Date.now()
        });
        
        throw error;
      }
    };
  }

  /**
   * Observe performance entries
   */
  private observePerformance(type: string, callback: (entries: PerformanceEntry[]) => void): void {
    if (!window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe({ entryTypes: [type] });
      this.observers.set(type, observer);
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error);
    }
  }

  /**
   * Calculate Time to Interactive
   */
  private calculateTTI(navEntry: PerformanceNavigationTiming): number {
    // Simplified TTI calculation
    return navEntry.domInteractive - navEntry.navigationStart;
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(): number {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    if (resources.length === 0) return 0;

    const cachedResources = resources.filter(resource => 
      resource.transferSize === 0 || resource.transferSize < resource.decodedBodySize
    );

    return (cachedResources.length / resources.length) * 100;
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage(): number {
    const memory = (performance as any).memory;
    return memory ? memory.usedJSHeapSize / 1024 / 1024 : 0; // MB
  }

  /**
   * Report slow resource
   */
  private reportSlowResource(resource: PerformanceResourceTiming): void {
    console.warn('Slow resource detected:', {
      name: resource.name,
      duration: resource.responseEnd - resource.startTime,
      size: resource.transferSize
    });
  }

  /**
   * Report long task
   */
  private reportLongTask(entry: PerformanceEntry): void {
    console.warn('Long task detected:', {
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime
    });
  }

  /**
   * Report error
   */
  private reportError(error: ErrorReport): void {
    this.errors.push(error);
    
    // Send to monitoring service
    if (error.severity === 'critical' || error.severity === 'high') {
      this.sendErrorReport(error);
    }
  }

  /**
   * Track API call
   */
  private trackAPICall(metrics: APIMetrics): void {
    this.apiMetrics.push(metrics);
    
    // Report slow API calls
    if (metrics.responseTime > 2000) {
      console.warn('Slow API call detected:', metrics);
    }
  }

  /**
   * Track user interaction
   */
  private trackUserInteraction(type: string, element: HTMLElement): void {
    // Track interaction with analytics
    const elementInfo = {
      tag: element.tagName,
      id: element.id,
      className: element.className,
      textContent: element.textContent?.slice(0, 50)
    };

    // Send to analytics
    this.sendAnalyticsEvent('user_interaction', {
      interaction_type: type,
      element: elementInfo,
      timestamp: Date.now()
    });
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error): ErrorReport['severity'] {
    if (!error) return 'low';
    
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('fetch')) return 'medium';
    if (message.includes('chunk') || message.includes('loading')) return 'medium';
    if (message.includes('permission') || message.includes('security')) return 'high';
    if (message.includes('crash') || message.includes('fatal')) return 'critical';
    
    return 'low';
  }

  /**
   * Get error context
   */
  private getErrorContext(): Record<string, any> {
    return {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt
      } : null,
      memory: (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit
      } : null,
      timing: this.metrics,
      userAgent: navigator.userAgent
    };
  }

  /**
   * Get session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('performance_session_id');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('performance_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Send error report to monitoring service
   */
  private async sendErrorReport(error: ErrorReport): Promise<void> {
    try {
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error)
      });
    } catch (err) {
      console.error('Failed to send error report:', err);
    }
  }

  /**
   * Send analytics event
   */
  private async sendAnalyticsEvent(eventName: string, data: any): Promise<void> {
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: eventName, data })
      });
    } catch (err) {
      console.error('Failed to send analytics event:', err);
    }
  }

  /**
   * Start periodic reporting
   */
  private startPeriodicReporting(): void {
    // Report metrics every 30 seconds
    setInterval(() => {
      this.sendPerformanceReport();
    }, 30000);

    // Report on page unload
    window.addEventListener('beforeunload', () => {
      this.sendPerformanceReport(true);
    });
  }

  /**
   * Send performance report
   */
  private async sendPerformanceReport(isPageUnload = false): Promise<void> {
    const report = {
      session: {
        id: this.getSessionId(),
        duration: Date.now() - this.sessionStartTime,
        timestamp: Date.now()
      },
      coreWebVitals: this.coreWebVitals,
      metrics: this.metrics,
      userMetrics: this.userMetrics,
      errors: this.errors.slice(-10), // Last 10 errors
      apiMetrics: this.apiMetrics.slice(-20), // Last 20 API calls
      isPageUnload
    };

    try {
      if (isPageUnload && navigator.sendBeacon) {
        navigator.sendBeacon(
          this.reportingEndpoint,
          JSON.stringify(report)
        );
      } else {
        await fetch(this.reportingEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report)
        });
      }
    } catch (error) {
      console.error('Failed to send performance report:', error);
    }
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    // This is a simplified cleanup - in a real implementation,
    // you would need to track and remove all added event listeners
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): {
    coreWebVitals: Partial<CoreWebVitals>;
    performance: PerformanceMetrics | null;
    user: UserMetrics;
    errors: ErrorReport[];
    api: APIMetrics[];
  } {
    return {
      coreWebVitals: this.coreWebVitals,
      performance: this.metrics,
      user: this.userMetrics,
      errors: this.errors,
      api: this.apiMetrics
    };
  }

  /**
   * Force performance report
   */
  public async reportNow(): Promise<void> {
    await this.sendPerformanceReport();
  }

  /**
   * Clear stored metrics
   */
  public clearMetrics(): void {
    this.errors = [];
    this.apiMetrics = [];
    this.userMetrics = {
      sessionDuration: 0,
      pageViews: 0,
      bounceRate: 0,
      scrollDepth: 0,
      clickEvents: 0,
      formSubmissions: 0,
      voiceCommandsUsed: 0,
      themeChanges: 0
    };
  }
}

// Singleton instance
let performanceMonitorInstance: PerformanceMonitor | null = null;

/**
 * Get performance monitor instance
 */
export const getPerformanceMonitor = (config?: any): PerformanceMonitor => {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor(config);
  }
  return performanceMonitorInstance;
};

/**
 * Initialize performance monitoring
 */
export const initializePerformanceMonitoring = (config?: any): PerformanceMonitor => {
  const monitor = getPerformanceMonitor(config);
  monitor.startMonitoring();
  return monitor;
};

export default PerformanceMonitor;
export type { CoreWebVitals, PerformanceMetrics, UserMetrics, ErrorReport, APIMetrics }; 