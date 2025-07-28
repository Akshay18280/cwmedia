/**
 * Live Visitor Counter Component
 * Displays real-time visitor count and presence indicators
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Eye, Users, Activity, Globe } from 'lucide-react';
import { liveVisitorService, Visitor, VisitorStats } from '../../services/realtime/LiveVisitorService';
import { ModernCard } from '../ModernDesignSystem';

interface LiveVisitorCounterProps {
  page?: string;
  showDetails?: boolean;
  showPresence?: boolean;
  variant?: 'compact' | 'full' | 'minimal';
  className?: string;
}

interface VisitorPresenceProps {
  visitors: Visitor[];
  maxVisible?: number;
}

const VisitorPresence: React.FC<VisitorPresenceProps> = ({ visitors, maxVisible = 5 }) => {
  const visibleVisitors = visitors.slice(0, maxVisible);
  const hiddenCount = Math.max(0, visitors.length - maxVisible);

  if (visitors.length === 0) return null;

  return (
    <div className="flex items-center space-x-2">
      <div className="flex -space-x-2">
        {visibleVisitors.map((visitor, index) => (
          <div
            key={visitor.id}
            className="relative"
            title={visitor.userName || 'Anonymous visitor'}
          >
            {visitor.avatar ? (
              <img
                src={visitor.avatar}
                alt={visitor.userName || 'Visitor'}
                className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 object-cover"
              />
            ) : (
              <div className="w-6 h-6 bg-gradient-flow rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                <span className="text-white text-caption font-medium">
                  {visitor.userName ? visitor.userName.charAt(0).toUpperCase() : '?'}
                </span>
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-gray-800"></div>
          </div>
        ))}
        
        {hiddenCount > 0 && (
          <div className="w-6 h-6 bg-low-contrast rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
            <span className="text-caption font-medium text-medium-contrast">
              +{hiddenCount}
            </span>
          </div>
        )}
      </div>

      <span className="text-body-sm text-medium-contrast">
        {visitors.length === 1 ? '1 person' : `${visitors.length} people`} viewing
      </span>
    </div>
  );
};

export const LiveVisitorCounter: React.FC<LiveVisitorCounterProps> = ({
  page,
  showDetails = false,
  showPresence = false,
  variant = 'compact',
  className = ''
}) => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Get current page if not specified
  const currentPage = page || window.location.pathname;

  // Subscribe to page visitors
  useEffect(() => {
    if (!currentPage) return;

    const unsubscribe = liveVisitorService.subscribeToPageVisitors(currentPage, (pageVisitors) => {
      setVisitors(pageVisitors);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentPage]);

  // Subscribe to visitor stats
  useEffect(() => {
    if (!showDetails) return;

    const unsubscribe = liveVisitorService.subscribeToStats((visitorStats) => {
      setStats(visitorStats);
    });

    return unsubscribe;
  }, [showDetails]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getActivityLevel = (count: number): { level: string; color: string } => {
    if (count >= 100) return { level: 'Very High', color: 'text-red-500' };
    if (count >= 50) return { level: 'High', color: 'text-orange-500' };
    if (count >= 20) return { level: 'Medium', color: 'text-yellow-500' };
    if (count >= 5) return { level: 'Low', color: 'text-green-500' };
    return { level: 'Very Low', color: 'text-blue-500' };
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-low-contrast rounded"></div>
          <div className="w-16 h-4 bg-low-contrast rounded"></div>
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-body-sm text-medium-contrast">
            {visitors.length}
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Eye className="w-4 h-4 text-medium-contrast" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <span className="text-body-sm font-medium text-high-contrast">
            {formatNumber(visitors.length)}
          </span>
          <span className="text-body-sm text-medium-contrast">online</span>
        </div>

        {showPresence && visitors.length > 0 && (
          <VisitorPresence visitors={visitors} maxVisible={3} />
        )}
      </div>
    );
  }

  // Full variant
  return (
    <ModernCard className={`p-4 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-green-500" />
          <h3 className="text-subtitle font-semibold text-high-contrast">
            Live Activity
          </h3>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-body-sm text-medium-contrast">Live</span>
        </div>
      </div>

      {/* Current Page Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-title font-bold text-high-contrast">
            {formatNumber(visitors.length)}
          </div>
          <div className="text-body-sm text-medium-contrast">
            Current Page
          </div>
        </div>

        {stats && (
          <div className="text-center">
            <div className="text-title font-bold text-high-contrast">
              {formatNumber(stats.activeVisitors)}
            </div>
            <div className="text-body-sm text-medium-contrast">
              Total Online
            </div>
          </div>
        )}
      </div>

      {/* Activity Level */}
      {(() => {
        const activity = getActivityLevel(visitors.length);
        return (
          <div className="flex items-center justify-between p-3 bg-low-contrast rounded-lg">
            <span className="text-body-sm text-medium-contrast">
              Activity Level
            </span>
            <span className={`text-body-sm font-medium ${activity.color}`}>
              {activity.level}
            </span>
          </div>
        );
      })()}

      {/* Visitor Presence */}
      {showPresence && visitors.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-body-sm font-medium text-medium-contrast">
            Currently Viewing
          </h4>
          <VisitorPresence visitors={visitors} maxVisible={8} />
        </div>
      )}

      {/* Additional Stats */}
      {showDetails && stats && (
        <div className="border-t border-medium-contrast pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-body-lg font-semibold text-high-contrast">
                {formatNumber(stats.totalVisitors)}
              </div>
              <div className="text-caption text-medium-contrast">
                Total Visitors
              </div>
            </div>
            <div>
              <div className="text-body-lg font-semibold text-high-contrast">
                {Object.keys(stats.pageVisitors).length}
              </div>
              <div className="text-caption text-medium-contrast">
                Active Pages
              </div>
            </div>
          </div>

          {/* Top Pages */}
          {stats.realTimeData.pages.length > 0 && (
            <div>
              <h5 className="text-body-sm font-medium text-medium-contrast mb-2">
                Most Popular Pages
              </h5>
              <div className="space-y-1">
                {stats.realTimeData.pages.slice(0, 3).map((pageData, index) => (
                  <div key={pageData.page} className="flex items-center justify-between text-body-sm">
                    <span className="text-medium-contrast truncate flex-1">
                      {pageData.page === '/' ? 'Home' : pageData.page}
                    </span>
                    <div className="flex items-center space-x-1">
                      <span className="text-high-contrast font-medium">
                        {pageData.count}
                      </span>
                      <Users className="w-3 h-3 text-low-contrast" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Demographics */}
          {stats.demographics.countries.length > 0 && (
            <div>
              <h5 className="text-body-sm font-medium text-medium-contrast mb-2">
                Top Countries
              </h5>
              <div className="space-y-1">
                {stats.demographics.countries.slice(0, 3).map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between text-body-sm">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-3 h-3 text-low-contrast" />
                      <span className="text-medium-contrast">
                        {country.country}
                      </span>
                    </div>
                    <span className="text-high-contrast font-medium">
                      {country.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </ModernCard>
  );
}; 