import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { firebaseAuthService } from '../services/firebase/auth.service';
import { unifiedAuthService } from '../services/firebase/unified-auth.service';
import { ipAuthService } from '../services/firebase/ip-auth.service';

interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  isAdmin: boolean;
  provider: 'google' | 'phone' | 'email' | 'ip';
  verified: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signInWithPhone: (phoneNumber: string) => Promise<{ success: boolean; message: string }>;
  verifyOTP: (otp: string) => Promise<{ success: boolean; message: string; user?: AuthUser }>;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<AuthUser>) => Promise<void>;
  refreshUser: () => Promise<void>;
  checkIPAuth: () => Promise<boolean>;
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

  useEffect(() => {
    const initAuth = async () => {
      try {
        // First check IP authentication
        const ipAuthResult = await checkIPAuthentication();
        if (ipAuthResult) {
          setLoading(false);
          return;
        }

        // Then setup Firebase auth listener
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          try {
            if (firebaseUser) {
              // User is signed in, fetch additional data from Firestore
              const socialUser = await firebaseAuthService.getCurrentUser();
              if (socialUser) {
                const authUser: AuthUser = {
                  id: socialUser.id,
                  email: socialUser.email,
                  name: socialUser.name,
                  phoneNumber: firebaseUser.phoneNumber,
                  photoURL: socialUser.profileImage || firebaseUser.photoURL,
                  isAdmin: socialUser.email === 'admin@carelwavemedia.com' || socialUser.id.startsWith('admin_'),
                  provider: socialUser.provider === 'google' ? 'google' : 'email',
                  verified: firebaseUser.emailVerified || !!firebaseUser.phoneNumber
                };
                setUser(authUser);
                
                // Store session in localStorage for persistence
                localStorage.setItem('authUser', JSON.stringify(authUser));
                localStorage.setItem('authTimestamp', Date.now().toString());
              } else {
                setUser(null);
                localStorage.removeItem('authUser');
                localStorage.removeItem('authTimestamp');
              }
            } else {
              // Check for stored session
              const storedUser = localStorage.getItem('authUser');
              const storedTimestamp = localStorage.getItem('authTimestamp');
              
              if (storedUser && storedTimestamp) {
                const timestamp = parseInt(storedTimestamp);
                const twentyFourHours = 24 * 60 * 60 * 1000;
                
                if (Date.now() - timestamp < twentyFourHours) {
                  // Session is still valid, restore user
                  setUser(JSON.parse(storedUser));
                } else {
                  // Session expired, clear storage
                  localStorage.removeItem('authUser');
                  localStorage.removeItem('authTimestamp');
                  setUser(null);
                }
              } else {
                setUser(null);
              }
            }
          } catch (error) {
            console.error('Auth state change error:', error);
            setUser(null);
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
  }, []);

  const checkIPAuthentication = async (): Promise<boolean> => {
    try {
      // Check if user is already IP authenticated
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
          verified: true
        };
        setUser(authUser);
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
          email: result.user.email,
          name: result.user.name,
          phoneNumber: null,
          photoURL: null,
          isAdmin: result.user.isAdmin,
          provider: 'ip',
          verified: true
        };
        setUser(authUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('IP authentication failed:', error);
      return false;
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const result = await firebaseAuthService.signInWithEmail(email, password);
      
      if (result.success && result.user) {
        const authUser: AuthUser = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          phoneNumber: null,
          photoURL: result.user.profileImage,
          isAdmin: result.user.email === 'admin@carelwavemedia.com',
          provider: 'email',
          verified: true
        };
        
        setUser(authUser);
        localStorage.setItem('authUser', JSON.stringify(authUser));
        localStorage.setItem('authTimestamp', Date.now().toString());
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Sign in error:', error);
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
          email: result.user.email || null,
          name: result.user.name,
          phoneNumber: result.user.phoneNumber,
          photoURL: result.user.avatarUrl || null,
          isAdmin: result.user.role === 'admin' || result.user.adminAccess === true,
          provider: 'phone',
          verified: result.user.verified
        };
        
        setUser(authUser);
        localStorage.setItem('authUser', JSON.stringify(authUser));
        localStorage.setItem('authTimestamp', Date.now().toString());
        
        return { success: true, message: result.message, user: authUser };
      }
      
      return { success: false, message: result.message };
    } catch (error) {
      console.error('OTP verification error:', error);
      return { success: false, message: 'OTP verification failed' };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<boolean> => {
    try {
      setLoading(true);
      const result = await firebaseAuthService.signInWithGoogle();
      
      if (result.success && result.user) {
        const authUser: AuthUser = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          phoneNumber: null,
          photoURL: result.user.profileImage,
          isAdmin: result.user.email === 'admin@carelwavemedia.com',
          provider: 'google',
          verified: true
        };
        
        setUser(authUser);
        localStorage.setItem('authUser', JSON.stringify(authUser));
        localStorage.setItem('authTimestamp', Date.now().toString());
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Google sign in error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Clear IP authentication if exists
      ipAuthService.clearIPAuth();
      
      // Sign out from Firebase
      await firebaseAuthService.signOut();
      
      // Clear local storage
      localStorage.removeItem('authUser');
      localStorage.removeItem('authTimestamp');
      
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (data: Partial<AuthUser>): Promise<void> => {
    if (!user) return;
    
    try {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Update profile error:', error);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Check IP auth first
      const ipAuthResult = await checkIPAuthentication();
      if (ipAuthResult) {
        return;
      }
      
      // Then check Firebase auth
      const socialUser = await firebaseAuthService.getCurrentUser();
      if (socialUser) {
        const authUser: AuthUser = {
          id: socialUser.id,
          email: socialUser.email,
          name: socialUser.name,
          phoneNumber: null,
          photoURL: socialUser.profileImage,
          isAdmin: socialUser.email === 'admin@carelwavemedia.com',
          provider: socialUser.provider === 'google' ? 'google' : 'email',
          verified: true
        };
        
        setUser(authUser);
        localStorage.setItem('authUser', JSON.stringify(authUser));
        localStorage.setItem('authTimestamp', Date.now().toString());
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin ?? false,
    signIn,
    signInWithPhone,
    verifyOTP,
    signInWithGoogle,
    signOut,
    updateUserProfile,
    refreshUser,
    checkIPAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 