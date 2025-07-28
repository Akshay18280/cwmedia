/**
 * Live Notifications Component
 * Real-time notification display and management
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Settings, Check, CheckCheck, Trash2, Filter } from 'lucide-react';
import { notificationService, Notification, NotificationPermissions } from '../../services/realtime/NotificationService';
import { ModernButton, ModernCard } from '../ModernDesignSystem';

interface LiveNotificationsProps {
  variant?: 'dropdown' | 'panel' | 'inline';
  maxNotifications?: number;
  showSettings?: boolean;
  className?: string;
}

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onAction?: (notification: Notification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRead,
  onDelete,
  onAction
}) => {
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'comment': return '💬';
      case 'like': return '❤️';
      case 'mention': return '@';
      case 'post': return '📝';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'admin': return '👑';
      case 'system': return '⚙️';
      default: return 'ℹ️';
    }
  };

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'urgent': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'normal': return 'border-l-blue-500';
      case 'low': return 'border-l-gray-500';
      default: return 'border-l-blue-500';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div
      className={`p-4 border-l-4 ${getPriorityColor()} ${
        notification.read ? 'bg-low-contrast' : 'bg-medium-contrast'
      } hover:bg-medium-contrast transition-colors cursor-pointer group`}
      onClick={() => !notification.read && onRead(notification.id)}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0 text-lg">
          {notification.icon || getNotificationIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`text-body font-medium ${
                notification.read ? 'text-medium-contrast' : 'text-high-contrast'
              }`}>
                {notification.title}
              </h4>
              <p className={`text-body-sm mt-1 ${
                notification.read ? 'text-low-contrast' : 'text-medium-contrast'
              }`}>
                {notification.message}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-caption text-low-contrast">
                  {formatTimeAgo(notification.timestamp)}
                </span>
                <span className={`px-2 py-1 rounded-full text-caption font-medium ${
                  notification.category === 'engagement' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                  notification.category === 'content' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                  notification.category === 'system' ? 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400' :
                  notification.category === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                  'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400'
                }`}>
                  {notification.category}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRead(notification.id);
                  }}
                  className="p-1 text-blue-500 hover:text-blue-600 transition-colors"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                className="p-1 text-red-500 hover:text-red-600 transition-colors"
                title="Delete notification"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Button */}
          {notification.actionUrl && (
            <div className="mt-3">
              <ModernButton
                variant="minimal"
                intent="primary"
                size="xs"
                onClick={() => onAction?.(notification)}
              >
                View
              </ModernButton>
            </div>
          )}
        </div>

        {/* Unread Indicator */}
        {!notification.read && (
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
        )}
      </div>
    </div>
  );
};

const NotificationSettings: React.FC<{
  permissions: NotificationPermissions;
  onUpdate: (permissions: Partial<NotificationPermissions>) => void;
  onClose: () => void;
}> = ({ permissions, onUpdate, onClose }) => {
  const [localPermissions, setLocalPermissions] = useState(permissions);

  const handleToggle = (key: keyof NotificationPermissions, value: any) => {
    const updated = { ...localPermissions, [key]: value };
    setLocalPermissions(updated);
    onUpdate({ [key]: value });
  };

  const requestBrowserPermission = async () => {
    const permission = await notificationService.requestPermission();
    setLocalPermissions(prev => ({ ...prev, browser: permission }));
  };

  return (
    <ModernCard className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-title font-bold text-high-contrast">
          Notification Settings
        </h3>
        <button
          onClick={onClose}
          className="p-2 text-low-contrast hover:text-medium-contrast transition-colors rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Browser Notifications */}
        <div className="space-y-2">
          <h4 className="text-subtitle font-semibold text-high-contrast">
            Browser Notifications
          </h4>
          <div className="flex items-center justify-between">
            <span className="text-body text-medium-contrast">
              Desktop notifications
            </span>
            <div className="flex items-center space-x-2">
              <span className={`text-body-sm ${
                localPermissions.browser === 'granted' ? 'text-green-600' :
                localPermissions.browser === 'denied' ? 'text-red-600' :
                'text-yellow-600'
              }`}>
                {localPermissions.browser === 'granted' ? 'Enabled' :
                 localPermissions.browser === 'denied' ? 'Blocked' : 'Not Set'}
              </span>
              {localPermissions.browser !== 'granted' && (
                <ModernButton
                  variant="minimal"
                  intent="primary"
                  size="xs"
                  onClick={requestBrowserPermission}
                >
                  Enable
                </ModernButton>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-body text-medium-contrast">
              Show on desktop
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPermissions.desktop}
                onChange={(e) => handleToggle('desktop', e.target.checked)}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${
                localPermissions.desktop ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  localPermissions.desktop ? 'translate-x-5' : 'translate-x-0'
                } mt-0.5 ml-0.5`}></div>
              </div>
            </label>
          </div>
        </div>

        {/* In-App Notifications */}
        <div className="space-y-2">
          <h4 className="text-subtitle font-semibold text-high-contrast">
            In-App Notifications
          </h4>
          <div className="flex items-center justify-between">
            <span className="text-body text-medium-contrast">
              Toast notifications
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPermissions.inApp}
                onChange={(e) => handleToggle('inApp', e.target.checked)}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${
                localPermissions.inApp ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  localPermissions.inApp ? 'translate-x-5' : 'translate-x-0'
                } mt-0.5 ml-0.5`}></div>
              </div>
            </label>
          </div>
        </div>

        {/* Sound & Vibration */}
        <div className="space-y-2">
          <h4 className="text-subtitle font-semibold text-high-contrast">
            Sound & Vibration
          </h4>
          <div className="flex items-center justify-between">
            <span className="text-body text-medium-contrast">
              Sound alerts
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPermissions.sound}
                onChange={(e) => handleToggle('sound', e.target.checked)}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${
                localPermissions.sound ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  localPermissions.sound ? 'translate-x-5' : 'translate-x-0'
                } mt-0.5 ml-0.5`}></div>
              </div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-body text-medium-contrast">
              Vibration (mobile)
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPermissions.vibration}
                onChange={(e) => handleToggle('vibration', e.target.checked)}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${
                localPermissions.vibration ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  localPermissions.vibration ? 'translate-x-5' : 'translate-x-0'
                } mt-0.5 ml-0.5`}></div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </ModernCard>
  );
};

export const LiveNotifications: React.FC<LiveNotificationsProps> = ({
  variant = 'dropdown',
  maxNotifications = 10,
  showSettings = true,
  className = ''
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [permissions, setPermissions] = useState<NotificationPermissions>({
    browser: 'default',
    sound: true,
    vibration: true,
    desktop: true,
    inApp: true
  });
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Subscribe to notifications
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications);
    });

    // Load permissions
    setPermissions(notificationService.getPreferences());

    return unsubscribe;
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications
    .filter(n => filter === 'all' || !n.read)
    .slice(0, maxNotifications);

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleDelete = (id: string) => {
    notificationService.delete(id);
  };

  const handleClearAll = () => {
    notificationService.clearAll();
  };

  const handleAction = (notification: Notification) => {
    if (notification.actionUrl) {
      if (notification.actionUrl.startsWith('http')) {
        window.open(notification.actionUrl, '_blank');
      } else {
        window.location.href = notification.actionUrl;
      }
    }
    handleMarkAsRead(notification.id);
  };

  const handlePermissionUpdate = (newPermissions: Partial<NotificationPermissions>) => {
    notificationService.updatePreferences(newPermissions);
    setPermissions(prev => ({ ...prev, ...newPermissions }));
  };

  if (variant === 'inline') {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-title font-bold text-high-contrast">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-blue-500 text-white rounded-full text-caption">
                {unreadCount}
              </span>
            )}
          </h3>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <ModernButton
                variant="minimal"
                intent="secondary"
                size="sm"
                icon={CheckCheck}
                onClick={handleMarkAllAsRead}
              >
                Mark all read
              </ModernButton>
            )}
            {showSettings && (
              <ModernButton
                variant="minimal"
                intent="secondary"
                size="sm"
                icon={Settings}
                onClick={() => setShowSettingsPanel(true)}
              />
            )}
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-low-contrast" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
            className="px-3 py-1 bg-medium-contrast border border-medium-contrast rounded-lg text-body-sm text-high-contrast focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All notifications</option>
            <option value="unread">Unread only</option>
          </select>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length > 0 ? (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={handleMarkAsRead}
                onDelete={handleDelete}
                onAction={handleAction}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Bell className="w-8 h-8 mx-auto mb-2 text-low-contrast" />
            <p className="text-medium-contrast">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        )}

        {/* Settings Panel */}
        {showSettingsPanel && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <NotificationSettings
              permissions={permissions}
              onUpdate={handlePermissionUpdate}
              onClose={() => setShowSettingsPanel(false)}
            />
          </div>
        )}
      </div>
    );
  }

  // Dropdown or Panel variant
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Icon Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-medium-contrast hover:text-high-contrast transition-colors rounded-lg"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-caption font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown/Panel */}
      {isOpen && (
        <div className={`absolute right-0 top-full mt-2 w-80 max-h-96 bg-medium-contrast border border-medium-contrast rounded-lg shadow-lg z-50 ${
          variant === 'panel' ? 'relative w-full max-h-none' : ''
        }`}>
          {/* Header */}
          <div className="p-4 border-b border-low-contrast">
            <div className="flex items-center justify-between">
              <h3 className="text-subtitle font-semibold text-high-contrast">
                Notifications
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="p-1 text-blue-500 hover:text-blue-600 transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                {showSettings && (
                  <button
                    onClick={() => setShowSettingsPanel(true)}
                    className="p-1 text-low-contrast hover:text-medium-contrast transition-colors"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}
                {variant === 'dropdown' && (
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-low-contrast hover:text-medium-contrast transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1 mt-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-full text-body-sm transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'text-medium-contrast hover:text-high-contrast'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-full text-body-sm transition-colors ${
                  filter === 'unread'
                    ? 'bg-blue-500 text-white'
                    : 'text-medium-contrast hover:text-high-contrast'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  onAction={handleAction}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <Bell className="w-8 h-8 mx-auto mb-2 text-low-contrast" />
                <p className="text-medium-contrast">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-low-contrast">
              <ModernButton
                variant="minimal"
                intent="secondary"
                size="sm"
                onClick={handleClearAll}
                className="w-full"
              >
                Clear All Notifications
              </ModernButton>
            </div>
          )}
        </div>
      )}

      {/* Settings Panel */}
      {showSettingsPanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <NotificationSettings
            permissions={permissions}
            onUpdate={handlePermissionUpdate}
            onClose={() => setShowSettingsPanel(false)}
          />
        </div>
      )}
    </div>
  );
}; 