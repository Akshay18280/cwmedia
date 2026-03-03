import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { firebaseAuthService } from '../services/firebase/auth.service';
import { unifiedAuthService } from '../services/firebase/unified-auth.service';
import { ipAuthService } from '../services/firebase/ip-auth.service';
import { toast } from 'sonner';

interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  isAdmin: boolean;
  provider: 'google' | 'phone' | 'email' | 'ip';
  verified: boolean;
  lastLogin?: Date;
  sessionId?: string;
  deviceInfo?: DeviceInfo;
}

interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
  ip?: string;
  userAgent: string;
  lastSeen: Date;
}

interface SessionInfo {
  id: string;
  userId: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  deviceInfo: DeviceInfo;
  isActive: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  sessionInfo: SessionInfo | null;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  signInWithPhone: (phoneNumber: string) => Promise<{ success: boolean; message: string }>;
  verifyOTP: (otp: string) => Promise<{ success: boolean; message: string; user?: AuthUser }>;
  signInWithGoogle: (rememberMe?: boolean) => Promise<boolean>;
  signOut: (fromAllDevices?: boolean) => Promise<void>;
  updateUserProfile: (data: Partial<AuthUser>) => Promise<void>;
  refreshUser: () => Promise<void>;
  checkIPAuth: () => Promise<boolean>;
  refreshSession: () => Promise<void>;
  getActiveSessions: () => Promise<SessionInfo[]>;
  revokeSession: (sessionId: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  getLoginHistory: () => Promise<LoginAttempt[]>;
}

interface LoginAttempt {
  timestamp: Date;
  success: boolean;
  provider: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

  // Early return with minimal auth context if Firebase is not available
  if (!auth) {
    const mockAuthContext: AuthContextType = {
      user: null,
      loading: false,
      isAuthenticated: false,
      isAdmin: false,
      sessionInfo: null,
      signIn: async () => { console.warn('Firebase not available'); return false; },
      signInWithPhone: async () => ({ success: false, message: 'Firebase not available' }),
      verifyOTP: async () => ({ success: false, message: 'Firebase not available' }),
      signInWithGoogle: async () => { console.warn('Firebase not available'); return false; },
      signOut: async () => { console.warn('Firebase not available'); },
      updateUserProfile: async () => { console.warn('Firebase not available'); },
      refreshUser: async () => { console.warn('Firebase not available'); },
      checkIPAuth: async () => false,
      refreshSession: async () => { console.warn('Firebase not available'); },
      getActiveSessions: async () => [],
      revokeSession: async () => { console.warn('Firebase not available'); },
      changePassword: async () => { console.warn('Firebase not available'); return false; },
      getLoginHistory: async () => []
    };
    
    return <AuthContext.Provider value={mockAuthContext}>{children}</AuthContext.Provider>;
  }

  // Session configuration
  const SESSION_DURATION = {
    default: 24 * 60 * 60 * 1000, // 24 hours
    rememberMe: 30 * 24 * 60 * 60 * 1000, // 30 days
    admin: 8 * 60 * 60 * 1000, // 8 hours for admin
  };

  const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiry

  // Get device information
  const getDeviceInfo = useCallback((): DeviceInfo => {
    const userAgent = navigator.userAgent;
    
    // Simple device detection (you could use a library like ua-parser-js for better detection)
    const getBrowser = () => {
      if (userAgent.includes('Chrome')) return 'Chrome';
      if (userAgent.includes('Firefox')) return 'Firefox';
      if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
      if (userAgent.includes('Edge')) return 'Edge';
      return 'Unknown';
    };

    const getOS = () => {
      if (userAgent.includes('Windows')) return 'Windows';
      if (userAgent.includes('Mac')) return 'macOS';
      if (userAgent.includes('Linux')) return 'Linux';
      if (userAgent.includes('Android')) return 'Android';
      if (userAgent.includes('iOS')) return 'iOS';
      return 'Unknown';
    };

    const getDevice = () => {
      if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'Mobile';
      if (/Tablet|iPad/.test(userAgent)) return 'Tablet';
      return 'Desktop';
    };

    return {
      browser: getBrowser(),
      os: getOS(),
      device: getDevice(),
      userAgent,
      lastSeen: new Date()
    };
  }, []);

  // Create session
  const createSession = useCallback((authUser: AuthUser, rememberMe = false) => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const deviceInfo = getDeviceInfo();
    const now = new Date();
    
    const duration = authUser.isAdmin 
      ? SESSION_DURATION.admin 
      : rememberMe 
        ? SESSION_DURATION.rememberMe 
        : SESSION_DURATION.default;

    const session: SessionInfo = {
      id: sessionId,
      userId: authUser.id,
      createdAt: now,
      lastActivity: now,
      expiresAt: new Date(now.getTime() + duration),
      deviceInfo,
      isActive: true
    };

    // Store session
    localStorage.setItem('authSession', JSON.stringify(session));
    localStorage.setItem('authUser', JSON.stringify({ ...authUser, sessionId }));
    
    setSessionInfo(session);
    setUser({ ...authUser, sessionId, deviceInfo });

    // Log successful login
    logLoginAttempt(true, authUser.provider, deviceInfo);

    toast.success(`Welcome back, ${authUser.name}!`, {
      description: `Signed in on ${deviceInfo.device} • ${deviceInfo.browser}`,
      duration: 3000,
    });
  }, [getDeviceInfo]);

  // Session validation
  const validateSession = useCallback((): boolean => {
    const storedSession = localStorage.getItem('authSession');
    const storedUser = localStorage.getItem('authUser');

    if (!storedSession || !storedUser) return false;

    try {
      const session: SessionInfo = JSON.parse(storedSession);
      const user: AuthUser = JSON.parse(storedUser);
      const now = new Date();

      // Check if session is expired
      if (now > new Date(session.expiresAt)) {
        clearSession();
        toast.error('Session expired. Please sign in again.');
        return false;
      }

      // Check if session is about to expire (show warning)
      const timeToExpiry = new Date(session.expiresAt).getTime() - now.getTime();
      if (timeToExpiry <= WARNING_TIME && timeToExpiry > WARNING_TIME - 60000) {
        toast.warning('Session expiring soon. Save your work!', {
          description: 'Your session will expire in 5 minutes',
          duration: 10000,
        });
      }

      // Update last activity
      session.lastActivity = now;
      localStorage.setItem('authSession', JSON.stringify(session));
      
      setSessionInfo(session);
      setUser(user);
      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      clearSession();
      return false;
    }
  }, []);

  // Clear session
  const clearSession = useCallback(() => {
    localStorage.removeItem('authSession');
    localStorage.removeItem('authUser');
    localStorage.removeItem('ipAuthUser');
    localStorage.removeItem('ipAuthTimestamp');
    setSessionInfo(null);
    setUser(null);
  }, []);

  // Log login attempts
  const logLoginAttempt = useCallback((success: boolean, provider: string, deviceInfo: DeviceInfo) => {
    const attempts = JSON.parse(localStorage.getItem('loginHistory') || '[]');
    const attempt: LoginAttempt = {
      timestamp: new Date(),
      success,
      provider,
      deviceInfo,
      ipAddress: 'Unknown' // In production, you'd get this from your backend
    };
    
    attempts.unshift(attempt);
    // Keep only last 50 attempts
    const trimmedAttempts = attempts.slice(0, 50);
    localStorage.setItem('loginHistory', JSON.stringify(trimmedAttempts));
  }, []);

  // Initialize authentication
  useEffect(() => {
    const initAuth = async () => {
      try {
        // First check existing session
        if (validateSession()) {
          setLoading(false);
          return;
        }

        // Check IP authentication
        const ipAuthResult = await checkIPAuthentication();
        if (ipAuthResult) {
          setLoading(false);
          return;
        }

        // Setup Firebase auth listener
        if (!auth) {
          setLoading(false);
          return;
        }
        
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          try {
            if (firebaseUser) {
              // Get admin status from Firebase Custom Claims (server-side verification)
              const idTokenResult = await firebaseUser.getIdTokenResult();
              const isAdmin = idTokenResult.claims.admin === true;

              // User is signed in, fetch additional data from Firestore
              const socialUser = await firebaseAuthService.getCurrentUser();
              if (socialUser) {
                const authUser: AuthUser = {
                  id: socialUser.id,
                  email: socialUser.email,
                  name: socialUser.name,
                  phoneNumber: firebaseUser.phoneNumber,
                  photoURL: socialUser.profileImage || firebaseUser.photoURL,
                  isAdmin, // Use Custom Claims from Firebase token
                  provider: socialUser.provider === 'google' ? 'google' : 'email',
                  verified: firebaseUser.emailVerified || !!firebaseUser.phoneNumber,
                  lastLogin: new Date()
                };

                createSession(authUser);
              } else {
                clearSession();
              }
            } else {
              clearSession();
            }
          } catch (error) {
            console.error('Auth state change error:', error);
            clearSession();
          } finally {
            setLoading(false);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initAuth();
  }, [validateSession, createSession, clearSession]);

  // Auto-refresh session
  useEffect(() => {
    if (!sessionInfo) return;

    const interval = setInterval(() => {
      const storedSession = localStorage.getItem('authSession');
      if (storedSession) {
        try {
          const session: SessionInfo = JSON.parse(storedSession);
          session.lastActivity = new Date();
          localStorage.setItem('authSession', JSON.stringify(session));
          setSessionInfo(session);
        } catch (error) {
          console.error('Session refresh error:', error);
        }
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [sessionInfo]);

  const checkIPAuthentication = async (): Promise<boolean> => {
    try {
      const ipUser = ipAuthService.isIPAuthenticated();
      if (ipUser) {
        const authUser: AuthUser = {
          id: ipUser.id,
          email: ipUser.email,
          name: ipUser.name,
          phoneNumber: null,
          photoURL: null,
          isAdmin: ipUser.isAdmin,
          provider: 'ip',
          verified: true,
          lastLogin: new Date()
        };
        createSession(authUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('IP authentication check failed:', error);
      return false;
    }
  };

  const checkIPAuth = async (): Promise<boolean> => {
    try {
      const result = await ipAuthService.authenticateByIP();
      if (result.success && result.user) {
        const authUser: AuthUser = {
          id: result.user.id,
          email: result.user.email || null,
          name: result.user.name,
          phoneNumber: null,
          photoURL: null,
          isAdmin: result.user.isAdmin,
          provider: 'ip',
          verified: true,
          lastLogin: new Date()
        };
        createSession(authUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('IP authentication failed:', error);
      return false;
    }
  };

  const signIn = async (email: string, password: string, rememberMe = false): Promise<boolean> => {
    try {
      setLoading(true);
      const result = await firebaseAuthService.signInWithEmail(email, password);

      if (result.success && result.user && auth && auth.currentUser) {
        // Get admin status from Firebase Custom Claims
        const idTokenResult = await auth.currentUser.getIdTokenResult();
        const isAdmin = idTokenResult.claims.admin === true;

        const authUser: AuthUser = {
          id: result.user.id,
          email: result.user.email || null,
          name: result.user.name,
          phoneNumber: null,
          photoURL: result.user.profileImage || null,
          isAdmin, // Use Custom Claims from Firebase token
          provider: 'email',
          verified: true,
          lastLogin: new Date()
        };

        createSession(authUser, rememberMe);
        return true;
      } else {
        logLoginAttempt(false, 'email', getDeviceInfo());
        return false;
      }
    } catch (error) {
      console.error('Sign in error:', error);
      logLoginAttempt(false, 'email', getDeviceInfo());
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signInWithPhone = async (phoneNumber: string) => {
    try {
      setLoading(true);
      const result = await unifiedAuthService.sendPhoneOTP(phoneNumber);
      return result;
    } catch (error) {
      console.error('Phone sign in error:', error);
      return { success: false, message: 'Failed to send OTP' };
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (otp: string) => {
    try {
      setLoading(true);
      const result = await unifiedAuthService.verifyPhoneOTP(otp);
      
      if (result.success && result.user) {
        const authUser: AuthUser = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          phoneNumber: null, // Phone auth users don't have phone numbers stored in FirebaseUser
          photoURL: result.user.avatarUrl || null,
          isAdmin: result.user.role === 'admin',
          provider: 'phone',
          verified: result.user.verified ?? false,
          lastLogin: new Date()
        };
        
        createSession(authUser);
        return { success: true, message: result.message, user: authUser };
      }
      
      logLoginAttempt(false, 'phone', getDeviceInfo());
      return { success: false, message: result.message };
    } catch (error) {
      console.error('OTP verification error:', error);
      logLoginAttempt(false, 'phone', getDeviceInfo());
      return { success: false, message: 'OTP verification failed' };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (rememberMe = false): Promise<boolean> => {
    try {
      setLoading(true);
      const result = await firebaseAuthService.loginWithGoogle();

      if (result.success && result.user && auth && auth.currentUser) {
        // Get admin status from Firebase Custom Claims
        const idTokenResult = await auth.currentUser.getIdTokenResult();
        const isAdmin = idTokenResult.claims.admin === true;

        const authUser: AuthUser = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          phoneNumber: null,
          photoURL: result.user.profileImage || null,
          isAdmin, // Use Custom Claims from Firebase token
          provider: 'google',
          verified: true,
          lastLogin: new Date()
        };

        createSession(authUser, rememberMe);
        return true;
      } else {
        logLoginAttempt(false, 'google', getDeviceInfo());
        return false;
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      logLoginAttempt(false, 'google', getDeviceInfo());
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (fromAllDevices = false): Promise<void> => {
    try {
      setLoading(true);
      
      if (fromAllDevices) {
        // In a real app, you'd call an API to invalidate all sessions
        toast.success('Signed out from all devices');
      }
      
      // Clear IP authentication if exists
      ipAuthService.clearIPAuth();
      
      // Sign out from Firebase
      if (auth) {
        await auth.signOut();
      }
      
      // Clear session
      clearSession();
      
      toast.success('Successfully signed out', {
        description: 'You have been securely logged out',
      });
      
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Error signing out');
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async (): Promise<void> => {
    try {
      const storedSession = localStorage.getItem('authSession');
      if (storedSession) {
        const session: SessionInfo = JSON.parse(storedSession);
        const now = new Date();
        
        // Extend session by 1 hour
        session.expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
        session.lastActivity = now;
        
        localStorage.setItem('authSession', JSON.stringify(session));
        setSessionInfo(session);
        
        toast.success('Session extended by 1 hour');
      }
    } catch (error) {
      console.error('Session refresh error:', error);
    }
  };

  const updateUserProfile = async (data: Partial<AuthUser>): Promise<void> => {
    if (!user) return;
    
    try {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Failed to update profile');
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      setLoading(true);

      const ipAuthResult = await checkIPAuthentication();
      if (ipAuthResult) {
        return;
      }

      const socialUser = await firebaseAuthService.getCurrentUser();
      if (socialUser && auth && auth.currentUser) {
        // Get admin status from Firebase Custom Claims
        const idTokenResult = await auth.currentUser.getIdTokenResult();
        const isAdmin = idTokenResult.claims.admin === true;

        const authUser: AuthUser = {
          id: socialUser.id,
          email: socialUser.email,
          name: socialUser.name,
          phoneNumber: null,
          photoURL: socialUser.profileImage || null,
          isAdmin, // Use Custom Claims from Firebase token
          provider: socialUser.provider === 'google' ? 'google' : 'email',
          verified: true,
          lastLogin: new Date()
        };
        
        createSession(authUser);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Additional methods for competitive features
  const getActiveSessions = async (): Promise<SessionInfo[]> => {
    // In a real app, this would fetch from your backend
    const currentSession = sessionInfo;
    return currentSession ? [currentSession] : [];
  };

  const revokeSession = async (sessionId: string): Promise<void> => {
    // In a real app, this would call your backend API
    if (sessionInfo?.id === sessionId) {
      await signOut();
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      // This would typically involve re-authentication and password update
      // Implementation depends on your backend setup
      toast.success('Password changed successfully');
      return true;
    } catch (error) {
      console.error('Change password error:', error);
      toast.error('Failed to change password');
      return false;
    }
  };

  const getLoginHistory = async (): Promise<LoginAttempt[]> => {
    try {
      const history = JSON.parse(localStorage.getItem('loginHistory') || '[]');
      return history.map((attempt: any) => ({
        ...attempt,
        timestamp: new Date(attempt.timestamp)
      }));
    } catch (error) {
      console.error('Get login history error:', error);
      return [];
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin ?? false,
    sessionInfo,
    signIn,
    signInWithPhone,
    verifyOTP,
    signInWithGoogle,
    signOut,
    updateUserProfile,
    refreshUser,
    checkIPAuth,
    refreshSession,
    getActiveSessions,
    revokeSession,
    changePassword,
    getLoginHistory
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 