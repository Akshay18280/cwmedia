import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings, 
  LogOut, 
  Shield, 
  Clock, 
  Smartphone, 
  Monitor, 
  AlertTriangle, 
  RefreshCw,
  Eye,
  History,
  ChevronDown,
  Bell,
  UserCircle,
  Key,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface UserMenuProps {
  className?: string;
}

export default function UserMenu({ className = '' }: UserMenuProps) {
  const { 
    user, 
    sessionInfo, 
    signOut, 
    refreshSession, 
    getActiveSessions, 
    getLoginHistory,
    isAdmin 
  } = useAuth();
  const navigate = useNavigate();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [recentLogins, setRecentLogins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load session data when menu opens
  useEffect(() => {
    if (isOpen) {
      loadSessionData();
    }
  }, [isOpen]);

  const loadSessionData = async () => {
    try {
      const sessions = await getActiveSessions();
      const history = await getLoginHistory();
      setActiveSessions(sessions);
      setRecentLogins(history.slice(0, 3)); // Last 3 logins
    } catch (error) {
      console.error('Failed to load session data:', error);
    }
  };

  const handleSignOut = async (fromAllDevices = false) => {
    setLoading(true);
    try {
      await signOut(fromAllDevices);
      navigate('/');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSession = async () => {
    setLoading(true);
    try {
      await refreshSession();
      await loadSessionData();
    } catch (error) {
      toast.error('Failed to refresh session');
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getProviderBadge = (provider: string) => {
    const colors = {
      google: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      phone: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      email: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      ip: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[provider as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {provider.toUpperCase()}
      </span>
    );
  };

  if (!user) return null;

  const sessionExpiry = sessionInfo ? new Date(sessionInfo.expiresAt) : null;
  const timeToExpiry = sessionExpiry ? sessionExpiry.getTime() - Date.now() : 0;
  const isExpiringSoon = timeToExpiry > 0 && timeToExpiry < 30 * 60 * 1000; // 30 minutes

  return (
    <div className={`relative ${className}`}>
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="relative">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.name || 'User'}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
          
          {/* Status indicator */}
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${
            isExpiringSoon ? 'bg-yellow-500' : 'bg-green-500'
          }`} />
        </div>
        
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {user.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {user.email}
          </div>
        </div>
        
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Content */}
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <div className="flex items-center space-x-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name || 'User'}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-white text-lg font-medium">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{user.name}</h3>
                  <p className="text-sm text-white/80 truncate">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {getProviderBadge(user.provider)}
                    {user.isAdmin && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        ADMIN
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Session Info */}
            {sessionInfo && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowSessionDetails(!showSessionDetails)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Session Status</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${
                    showSessionDetails ? 'rotate-180' : ''
                  }`} />
                </button>
                
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    {getDeviceIcon(sessionInfo.deviceInfo.device)}
                    <span>{sessionInfo.deviceInfo.browser} on {sessionInfo.deviceInfo.os}</span>
                  </div>
                  
                  {sessionExpiry && (
                    <div className={`mt-1 flex items-center space-x-1 ${
                      isExpiringSoon ? 'text-yellow-600' : ''
                    }`}>
                      <Clock className="w-3 h-3" />
                      <span>
                        Expires {formatDistanceToNow(sessionExpiry, { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>

                {showSessionDetails && (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs">
                      <span className="text-gray-500">Last activity:</span>{' '}
                      {formatDistanceToNow(new Date(sessionInfo.lastActivity), { addSuffix: true })}
                    </div>
                    
                    {isExpiringSoon && (
                      <button
                        onClick={handleRefreshSession}
                        disabled={loading}
                        className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                        <span>Extend Session</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Menu Items */}
            <div className="py-2">
              <Link
                to="/profile"
                className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setIsOpen(false)}
              >
                <UserCircle className="w-4 h-4" />
                <span>Profile Settings</span>
              </Link>

              <Link
                to="/security"
                className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setIsOpen(false)}
              >
                <Key className="w-4 h-4" />
                <span>Security & Privacy</span>
              </Link>

              <Link
                to="/login-history"
                className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setIsOpen(false)}
              >
                <History className="w-4 h-4" />
                <span>Login History</span>
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsOpen(false)}
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Dashboard</span>
                </Link>
              )}
            </div>

            {/* Recent Logins */}
            {recentLogins.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Recent Activity
                </h4>
                <div className="space-y-1">
                  {recentLogins.map((login, index) => (
                    <div key={index} className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        {getDeviceIcon(login.deviceInfo.device)}
                        <span>{login.deviceInfo.browser}</span>
                        {getProviderBadge(login.provider)}
                      </div>
                      <span>{formatDistanceToNow(login.timestamp, { addSuffix: true })}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sign Out Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                <button
                  onClick={() => handleSignOut(false)}
                  disabled={loading}
                  className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
                
                <button
                  onClick={() => handleSignOut(true)}
                  disabled={loading}
                  className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Sign Out All Devices</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 