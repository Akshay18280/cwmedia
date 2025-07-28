/**
 * Progressive Web App Manager for Carelwave Media
 * Comprehensive PWA implementation with offline support, push notifications, and app-like experience
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

// Service Worker registration interface
interface ServiceWorkerConfig {
  swPath: string;
  scope: string;
  updateViaCache: 'all' | 'imports' | 'none';
  skipWaiting: boolean;
}

// Push notification configuration
interface PushNotificationConfig {
  vapidPublicKey: string;
  serverEndpoint: string;
}

// App install prompt interface
interface InstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Cache configuration
interface CacheConfig {
  cacheName: string;
  version: string;
  staticAssets: string[];
  apiEndpoints: string[];
  maxAge: number;
  maxEntries: number;
}

// PWA status interface
interface PWAStatus {
  isInstalled: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  pushSupported: boolean;
  pushEnabled: boolean;
  cacheStatus: 'active' | 'updating' | 'error';
  lastSync: number;
}

class PWAManager {
  private serviceWorker: ServiceWorkerRegistration | null = null;
  private installPromptEvent: InstallPromptEvent | null = null;
  private isInstalled: boolean = false;
  private pushSubscription: PushSubscription | null = null;
  private cacheConfig: CacheConfig;
  private pushConfig: PushNotificationConfig | null = null;
  private status: PWAStatus = {
    isInstalled: false,
    isOnline: navigator.onLine,
    hasUpdate: false,
    pushSupported: 'serviceWorker' in navigator && 'PushManager' in window,
    pushEnabled: false,
    cacheStatus: 'active',
    lastSync: 0
  };

  constructor(
    swConfig: ServiceWorkerConfig,
    cacheConfig: CacheConfig,
    pushConfig?: PushNotificationConfig
  ) {
    this.cacheConfig = cacheConfig;
    this.pushConfig = pushConfig || null;
    
    if ('serviceWorker' in navigator) {
      this.initializePWA(swConfig);
    } else {
      console.warn('Service Worker not supported in this browser');
    }
  }

  /**
   * Initialize PWA features
   */
  private async initializePWA(swConfig: ServiceWorkerConfig): Promise<void> {
    try {
      // Register service worker
      await this.registerServiceWorker(swConfig);
      
      // Setup installation prompt
      this.setupInstallPrompt();
      
      // Setup push notifications
      if (this.pushConfig) {
        await this.setupPushNotifications();
      }
      
      // Setup offline/online detection
      this.setupNetworkDetection();
      
      // Setup background sync
      this.setupBackgroundSync();
      
      // Setup periodic sync
      this.setupPeriodicSync();
      
      // Check if app is installed
      this.checkInstallationStatus();
      
      console.log('PWA initialization complete');
    } catch (error) {
      console.error('PWA initialization failed:', error);
    }
  }

  /**
   * Register service worker
   */
  private async registerServiceWorker(config: ServiceWorkerConfig): Promise<void> {
    try {
      this.serviceWorker = await navigator.serviceWorker.register(config.swPath, {
        scope: config.scope,
        updateViaCache: config.updateViaCache
      });

      console.log('Service Worker registered:', this.serviceWorker);

      // Handle updates
      this.serviceWorker.addEventListener('updatefound', () => {
        const newWorker = this.serviceWorker!.installing;
        if (newWorker) {
          this.handleServiceWorkerUpdate(newWorker);
        }
      });

      // Check for existing updates
      if (this.serviceWorker.waiting) {
        this.status.hasUpdate = true;
        this.notifyUpdateAvailable();
      }

      // Listen for controller changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      // Skip waiting if configured
      if (config.skipWaiting && this.serviceWorker.waiting) {
        this.serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Handle service worker updates
   */
  private handleServiceWorkerUpdate(newWorker: ServiceWorker): void {
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // New version available
          this.status.hasUpdate = true;
          this.notifyUpdateAvailable();
        } else {
          // First time install
          console.log('Service Worker installed for the first time');
        }
      }
    });
  }

  /**
   * Setup app installation prompt
   */
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPromptEvent = event as InstallPromptEvent;
      this.showInstallBanner();
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.status.isInstalled = true;
      this.hideInstallBanner();
      this.trackEvent('pwa_installed');
      console.log('PWA was installed');
    });
  }

  /**
   * Setup push notifications
   */
  private async setupPushNotifications(): Promise<void> {
    if (!this.pushConfig || !this.status.pushSupported) {
      return;
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Subscribe to push notifications
        await this.subscribeToPushNotifications();
      } else {
        console.log('Push notification permission denied');
      }
    } catch (error) {
      console.error('Push notification setup failed:', error);
    }
  }

  /**
   * Subscribe to push notifications
   */
  private async subscribeToPushNotifications(): Promise<void> {
    if (!this.serviceWorker || !this.pushConfig) {
      throw new Error('Service Worker or push config not available');
    }

    try {
      const subscription = await this.serviceWorker.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.pushConfig.vapidPublicKey)
      });

      this.pushSubscription = subscription;
      this.status.pushEnabled = true;

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);

      console.log('Push notification subscription successful');
    } catch (error) {
      console.error('Push notification subscription failed:', error);
    }
  }

  /**
   * Setup network detection
   */
  private setupNetworkDetection(): void {
    const updateOnlineStatus = () => {
      this.status.isOnline = navigator.onLine;
      this.notifyNetworkStatusChange();
      
      if (navigator.onLine) {
        this.syncOfflineData();
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  }

  /**
   * Setup background sync
   */
  private setupBackgroundSync(): void {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        // Register background sync
        return registration.sync.register('background-sync');
      }).catch((error) => {
        console.error('Background sync registration failed:', error);
      });
    }
  }

  /**
   * Setup periodic sync
   */
  private setupPeriodicSync(): void {
    if ('serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        // Register periodic sync (requires user engagement)
        return (registration as any).periodicSync.register('periodic-sync', {
          minInterval: 24 * 60 * 60 * 1000 // 24 hours
        });
      }).catch((error) => {
        console.error('Periodic sync registration failed:', error);
      });
    }
  }

  /**
   * Check installation status
   */
  private checkInstallationStatus(): void {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      this.status.isInstalled = true;
    }

    // Check if installed via browser
    if (window.navigator && (window.navigator as any).standalone) {
      this.isInstalled = true;
      this.status.isInstalled = true;
    }
  }

  /**
   * Show app install prompt
   */
  public async showInstallPrompt(): Promise<boolean> {
    if (!this.installPromptEvent) {
      console.log('No install prompt available');
      return false;
    }

    try {
      await this.installPromptEvent.prompt();
      const choice = await this.installPromptEvent.userChoice;
      
      this.installPromptEvent = null;
      
      if (choice.outcome === 'accepted') {
        this.trackEvent('pwa_install_accepted');
        return true;
      } else {
        this.trackEvent('pwa_install_dismissed');
        return false;
      }
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }

  /**
   * Update app
   */
  public async updateApp(): Promise<void> {
    if (!this.serviceWorker || !this.serviceWorker.waiting) {
      throw new Error('No update available');
    }

    this.serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });
    this.status.hasUpdate = false;
  }

  /**
   * Cache resource
   */
  public async cacheResource(url: string, response?: Response): Promise<void> {
    try {
      const cache = await caches.open(this.cacheConfig.cacheName);
      
      if (response) {
        await cache.put(url, response);
      } else {
        await cache.add(url);
      }
      
      console.log(`Resource cached: ${url}`);
    } catch (error) {
      console.error(`Failed to cache resource ${url}:`, error);
    }
  }

  /**
   * Get cached resource
   */
  public async getCachedResource(url: string): Promise<Response | undefined> {
    try {
      const cache = await caches.open(this.cacheConfig.cacheName);
      return await cache.match(url);
    } catch (error) {
      console.error(`Failed to get cached resource ${url}:`, error);
      return undefined;
    }
  }

  /**
   * Clear cache
   */
  public async clearCache(): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('Cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Store data for offline use
   */
  public async storeOfflineData(key: string, data: any): Promise<void> {
    try {
      const serializedData = JSON.stringify({
        data,
        timestamp: Date.now(),
        version: this.cacheConfig.version
      });
      
      localStorage.setItem(`pwa_offline_${key}`, serializedData);
    } catch (error) {
      console.error(`Failed to store offline data for ${key}:`, error);
    }
  }

  /**
   * Get offline data
   */
  public getOfflineData(key: string): any | null {
    try {
      const serializedData = localStorage.getItem(`pwa_offline_${key}`);
      if (!serializedData) return null;
      
      const { data, timestamp, version } = JSON.parse(serializedData);
      
      // Check if data is too old
      if (Date.now() - timestamp > this.cacheConfig.maxAge) {
        localStorage.removeItem(`pwa_offline_${key}`);
        return null;
      }
      
      // Check version compatibility
      if (version !== this.cacheConfig.version) {
        localStorage.removeItem(`pwa_offline_${key}`);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error(`Failed to get offline data for ${key}:`, error);
      return null;
    }
  }

  /**
   * Send push notification
   */
  public async sendPushNotification(
    title: string, 
    options: NotificationOptions = {}
  ): Promise<void> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    if (Notification.permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const notification = new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  /**
   * Share content
   */
  public async shareContent(shareData: ShareData): Promise<boolean> {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        this.trackEvent('pwa_content_shared', { method: 'native' });
        return true;
      } catch (error) {
        console.error('Native sharing failed:', error);
      }
    }

    // Fallback to custom share
    this.showCustomShareDialog(shareData);
    return false;
  }

  /**
   * Sync offline data
   */
  private async syncOfflineData(): Promise<void> {
    try {
      // Get all offline data
      const offlineKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('pwa_offline_'));

      for (const key of offlineKeys) {
        const data = this.getOfflineData(key.replace('pwa_offline_', ''));
        if (data && data.needsSync) {
          await this.syncDataToServer(key, data);
          localStorage.removeItem(key);
        }
      }

      this.status.lastSync = Date.now();
      console.log('Offline data synchronized');
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  }

  /**
   * Show install banner
   */
  private showInstallBanner(): void {
    // Create and show custom install banner
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.innerHTML = `
      <div class="pwa-banner-content">
        <div class="pwa-banner-text">
          <h3>Install Carelwave Media</h3>
          <p>Get the full app experience with offline access</p>
        </div>
        <div class="pwa-banner-actions">
          <button id="pwa-install-btn" class="btn-primary">Install</button>
          <button id="pwa-dismiss-btn" class="btn-secondary">Dismiss</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(banner);
    
    // Add event listeners
    document.getElementById('pwa-install-btn')?.addEventListener('click', () => {
      this.showInstallPrompt();
    });
    
    document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
      this.hideInstallBanner();
    });
  }

  /**
   * Hide install banner
   */
  private hideInstallBanner(): void {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.remove();
    }
  }

  /**
   * Show custom share dialog
   */
  private showCustomShareDialog(shareData: ShareData): void {
    // Implementation would create a custom share dialog
    console.log('Custom share dialog for:', shareData);
  }

  /**
   * Notify update available
   */
  private notifyUpdateAvailable(): void {
    // Show update notification
    const notification = document.createElement('div');
    notification.id = 'pwa-update-notification';
    notification.innerHTML = `
      <div class="pwa-notification-content">
        <p>A new version is available!</p>
        <button id="pwa-update-btn">Update Now</button>
        <button id="pwa-update-dismiss">Later</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    document.getElementById('pwa-update-btn')?.addEventListener('click', () => {
      this.updateApp();
    });
    
    document.getElementById('pwa-update-dismiss')?.addEventListener('click', () => {
      notification.remove();
    });
  }

  /**
   * Notify network status change
   */
  private notifyNetworkStatusChange(): void {
    const event = new CustomEvent('networkStatusChange', {
      detail: { isOnline: this.status.isOnline }
    });
    window.dispatchEvent(event);
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    if (!this.pushConfig) return;

    try {
      await fetch(this.pushConfig.serverEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent
        })
      });
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  /**
   * Sync data to server
   */
  private async syncDataToServer(key: string, data: any): Promise<void> {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data })
      });
    } catch (error) {
      console.error(`Failed to sync data for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Track analytics event
   */
  private trackEvent(eventName: string, data?: any): void {
    // Send to analytics
    if (window.gtag) {
      window.gtag('event', eventName, data);
    }
  }

  /**
   * Convert VAPID key
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Get PWA status
   */
  public getStatus(): PWAStatus {
    return { ...this.status };
  }

  /**
   * Get installation status
   */
  public isAppInstalled(): boolean {
    return this.isInstalled;
  }

  /**
   * Get push subscription
   */
  public getPushSubscription(): PushSubscription | null {
    return this.pushSubscription;
  }

  /**
   * Unsubscribe from push notifications
   */
  public async unsubscribeFromPush(): Promise<void> {
    if (this.pushSubscription) {
      await this.pushSubscription.unsubscribe();
      this.pushSubscription = null;
      this.status.pushEnabled = false;
    }
  }
}

export default PWAManager;
export type { 
  ServiceWorkerConfig, 
  PushNotificationConfig, 
  CacheConfig, 
  PWAStatus,
  InstallPromptEvent 
}; 