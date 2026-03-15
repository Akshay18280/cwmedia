/**
 * Real-time Notification Service
 * Handles all types of notifications including push, toast, and in-app notifications
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

import { webSocketService } from './WebSocketService';
import { toast } from 'sonner';
import { appConfig } from '@/config/appConfig';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  read: boolean;
  persistent: boolean;
  category: NotificationCategory;
  priority: NotificationPriority;
  userId?: string;
  actionUrl?: string;
  icon?: string;
}

export type NotificationType = 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'comment' 
  | 'like' 
  | 'mention' 
  | 'post' 
  | 'system' 
  | 'admin';

export type NotificationCategory = 
  | 'engagement' 
  | 'content' 
  | 'system' 
  | 'security' 
  | 'admin' 
  | 'marketing';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPermissions {
  browser: NotificationPermission;
  sound: boolean;
  vibration: boolean;
  desktop: boolean;
  inApp: boolean;
}

class NotificationService {
  private notifications: Map<string, Notification> = new Map();
  private subscribers: Set<(notifications: Notification[]) => void> = new Set();
  private pushSubscription: PushSubscription | null = null;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private permissions: NotificationPermissions = {
    browser: 'default',
    sound: true,
    vibration: true,
    desktop: true,
    inApp: true
  };

  constructor() {
    this.init();
  }

  /**
   * Initialize notification service
   */
  private async init(): Promise<void> {
    // Load saved notifications
    this.loadStoredNotifications();

    // Check browser support
    this.checkBrowserSupport();

    // Initialize service worker for push notifications
    await this.initServiceWorker();

    // Connect to WebSocket for real-time notifications
    this.initWebSocketListeners();

    // Load user preferences
    this.loadUserPreferences();
  }

  /**
   * Check browser support for notifications
   */
  private checkBrowserSupport(): void {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('This browser does not support service workers');
      return;
    }

    if (!('PushManager' in window)) {
      console.warn('This browser does not support push notifications');
      return;
    }
  }

  /**
   * Initialize service worker for push notifications
   */
  private async initServiceWorker(): Promise<void> {
    try {
      if ('serviceWorker' in navigator) {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  /**
   * Initialize WebSocket listeners for real-time notifications
   */
  private initWebSocketListeners(): void {
    webSocketService.subscribe('notification', (data) => {
      this.handleIncomingNotification(data);
    });

    webSocketService.subscribe('notification_update', (data) => {
      this.handleNotificationUpdate(data);
    });

    webSocketService.subscribe('notification_bulk', (data) => {
      this.handleBulkNotifications(data);
    });
  }

  /**
   * Request notification permission
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    this.permissions.browser = permission;
    this.saveUserPreferences();

    return permission;
  }

  /**
   * Subscribe to push notifications
   */
  public async subscribeToPush(): Promise<boolean> {
    // Feature guard: skip if push notifications are disabled or VAPID key not provided
    if (!appConfig.features.enablePushNotifications || !appConfig.notifications.vapidPublicKey) {
      console.warn('Push notifications disabled — VAPID public key not configured');
      return false;
    }

    try {
      if (!this.serviceWorkerRegistration) {
        console.error('Service Worker not available');
        return false;
      }

      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
      }

      const vapidPublicKey = appConfig.notifications.vapidPublicKey;

      this.pushSubscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(this.pushSubscription);

      console.log('Push notification subscription successful');
      return true;

    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  public async unsubscribeFromPush(): Promise<boolean> {
    try {
      if (this.pushSubscription) {
        await this.pushSubscription.unsubscribe();
        this.pushSubscription = null;
        
        // Notify server of unsubscription
        await this.removeSubscriptionFromServer();
        
        console.log('Unsubscribed from push notifications');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  /**
   * Show notification
   */
  public show(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): string {
    const fullNotification: Notification = {
      id: this.generateNotificationId(),
      timestamp: new Date(),
      read: false,
      ...notification
    };

    // Store notification
    this.notifications.set(fullNotification.id, fullNotification);

    // Show based on user preferences
    this.displayNotification(fullNotification);

    // Notify subscribers
    this.notifySubscribers();

    // Save to storage
    this.saveNotificationsToStorage();

    return fullNotification.id;
  }

  /**
   * Display notification based on type and preferences
   */
  private displayNotification(notification: Notification): void {
    // Always show in-app notification if enabled
    if (this.permissions.inApp) {
      this.showToastNotification(notification);
    }

    // Show desktop notification if permission granted and enabled
    if (this.permissions.desktop && this.permissions.browser === 'granted') {
      this.showDesktopNotification(notification);
    }

    // Play sound if enabled
    if (this.permissions.sound) {
      this.playNotificationSound(notification);
    }

    // Vibrate if enabled and supported
    if (this.permissions.vibration && 'vibrate' in navigator) {
      this.vibrateDevice(notification);
    }
  }

  /**
   * Show toast notification
   */
  private showToastNotification(notification: Notification): void {
    const options = {
      duration: notification.persistent ? Infinity : this.getToastDuration(notification.priority),
      action: notification.actionUrl ? {
        label: 'View',
        onClick: () => window.open(notification.actionUrl, '_blank')
      } : undefined
    };

    switch (notification.type) {
      case 'success':
        toast.success(notification.title, { description: notification.message, ...options });
        break;
      case 'error':
        toast.error(notification.title, { description: notification.message, ...options });
        break;
      case 'warning':
        toast.warning(notification.title, { description: notification.message, ...options });
        break;
      case 'info':
      default:
        toast.info(notification.title, { description: notification.message, ...options });
        break;
    }
  }

  /**
   * Show desktop notification
   */
  private showDesktopNotification(notification: Notification): void {
    if (this.permissions.browser !== 'granted') return;

    const options: NotificationOptions = {
      body: notification.message,
      icon: notification.icon || '/icon-192x192.png',
      tag: notification.id,
      badge: '/icon-192x192.png',
      data: {
        url: notification.actionUrl,
        notificationId: notification.id
      },
      requireInteraction: notification.priority === 'urgent',
      silent: !this.permissions.sound
    };

    const desktopNotification = new Notification(notification.title, options);

    // Handle click
    desktopNotification.onclick = () => {
      if (notification.actionUrl) {
        window.open(notification.actionUrl, '_blank');
      }
      this.markAsRead(notification.id);
      desktopNotification.close();
    };

    // Auto-close after duration
    setTimeout(() => {
      desktopNotification.close();
    }, this.getDesktopNotificationDuration(notification.priority));
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(notification: Notification): void {
    try {
      const audio = new Audio(this.getNotificationSoundUrl(notification.type));
      audio.volume = 0.3;
      audio.play().catch(error => {
        console.warn('Failed to play notification sound:', error);
      });
    } catch (error) {
      console.warn('Notification sound not available:', error);
    }
  }

  /**
   * Vibrate device for notification
   */
  private vibrateDevice(notification: Notification): void {
    if (!('vibrate' in navigator)) return;

    const pattern = this.getVibrationPattern(notification.type);
    navigator.vibrate(pattern);
  }

  /**
   * Mark notification as read
   */
  public markAsRead(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.read = true;
      this.notifySubscribers();
      this.saveNotificationsToStorage();
      return true;
    }
    return false;
  }

  /**
   * Mark all notifications as read
   */
  public markAllAsRead(): void {
    for (const notification of this.notifications.values()) {
      notification.read = true;
    }
    this.notifySubscribers();
    this.saveNotificationsToStorage();
  }

  /**
   * Delete notification
   */
  public delete(notificationId: string): boolean {
    const deleted = this.notifications.delete(notificationId);
    if (deleted) {
      this.notifySubscribers();
      this.saveNotificationsToStorage();
    }
    return deleted;
  }

  /**
   * Clear all notifications
   */
  public clearAll(): void {
    this.notifications.clear();
    this.notifySubscribers();
    this.saveNotificationsToStorage();
  }

  /**
   * Get all notifications
   */
  public getAll(): Notification[] {
    return Array.from(this.notifications.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get unread notifications
   */
  public getUnread(): Notification[] {
    return this.getAll().filter(n => !n.read);
  }

  /**
   * Get unread count
   */
  public getUnreadCount(): number {
    return this.getUnread().length;
  }

  /**
   * Subscribe to notification updates
   */
  public subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.subscribers.add(callback);
    
    // Send initial notifications
    callback(this.getAll());
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Update notification preferences
   */
  public updatePreferences(preferences: Partial<NotificationPermissions>): void {
    this.permissions = { ...this.permissions, ...preferences };
    this.saveUserPreferences();
  }

  /**
   * Get current preferences
   */
  public getPreferences(): NotificationPermissions {
    return { ...this.permissions };
  }

  // Private helper methods

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getToastDuration(priority: NotificationPriority): number {
    switch (priority) {
      case 'low': return 3000;
      case 'normal': return 5000;
      case 'high': return 8000;
      case 'urgent': return 10000;
      default: return 5000;
    }
  }

  private getDesktopNotificationDuration(priority: NotificationPriority): number {
    switch (priority) {
      case 'low': return 5000;
      case 'normal': return 8000;
      case 'high': return 12000;
      case 'urgent': return 15000;
      default: return 8000;
    }
  }

  private getNotificationSoundUrl(type: NotificationType): string {
    // In production, these should be actual audio files
    const soundMap: Record<NotificationType, string> = {
      info: '/sounds/info.mp3',
      success: '/sounds/success.mp3',
      warning: '/sounds/warning.mp3',
      error: '/sounds/error.mp3',
      comment: '/sounds/message.mp3',
      like: '/sounds/like.mp3',
      mention: '/sounds/mention.mp3',
      post: '/sounds/post.mp3',
      system: '/sounds/system.mp3',
      admin: '/sounds/admin.mp3'
    };
    
    return soundMap[type] || soundMap.info;
  }

  private getVibrationPattern(type: NotificationType): number[] {
    const patterns: Record<NotificationType, number[]> = {
      info: [100],
      success: [100, 50, 100],
      warning: [200, 100, 200],
      error: [300, 100, 300, 100, 300],
      comment: [100, 50, 100, 50, 100],
      like: [50, 50, 50],
      mention: [200, 100, 200, 100, 200],
      post: [150],
      system: [100, 100, 100],
      admin: [250, 100, 250, 100, 250]
    };
    
    return patterns[type] || patterns.info;
  }

  private handleIncomingNotification(data: any): void {
    this.show({
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
      persistent: data.persistent || false,
      category: data.category,
      priority: data.priority || 'normal',
      userId: data.userId,
      actionUrl: data.actionUrl,
      icon: data.icon
    });
  }

  private handleNotificationUpdate(data: any): void {
    const notification = this.notifications.get(data.id);
    if (notification) {
      Object.assign(notification, data.updates);
      this.notifySubscribers();
      this.saveNotificationsToStorage();
    }
  }

  private handleBulkNotifications(data: any): void {
    data.notifications.forEach((notifData: any) => {
      this.handleIncomingNotification(notifData);
    });
  }

  private notifySubscribers(): void {
    const notifications = this.getAll();
    this.subscribers.forEach(callback => {
      try {
        callback(notifications);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  private saveNotificationsToStorage(): void {
    try {
      const notifications = Array.from(this.notifications.values());
      localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save notifications to storage:', error);
    }
  }

  private loadStoredNotifications(): void {
    try {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        const notifications: Notification[] = JSON.parse(stored);
        notifications.forEach(notification => {
          notification.timestamp = new Date(notification.timestamp);
          this.notifications.set(notification.id, notification);
        });
      }
    } catch (error) {
      console.error('Failed to load stored notifications:', error);
    }
  }

  private saveUserPreferences(): void {
    try {
      localStorage.setItem('notification_preferences', JSON.stringify(this.permissions));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }

  private loadUserPreferences(): void {
    try {
      const stored = localStorage.getItem('notification_preferences');
      if (stored) {
        this.permissions = { ...this.permissions, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      // In production, send to your backend API
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId: this.getCurrentUserId()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  }

  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      // In production, notify your backend API
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.getCurrentUserId()
        })
      });
    } catch (error) {
      console.error('Error removing subscription from server:', error);
    }
  }

  private getCurrentUserId(): string | null {
    // Get current user ID from auth context or storage
    return localStorage.getItem('currentUserId');
  }

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
}

// Export singleton instance
export const notificationService = new NotificationService(); 