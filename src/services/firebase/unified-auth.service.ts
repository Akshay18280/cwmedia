/**
 * @fileoverview Unified Authentication Service for Carelwave Media
 * Handles both user and admin authentication using Firebase Auth and custom OTP verification
 * Supports phone authentication, Google OAuth, and admin verification flows
 * @version 2.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 * @updated 2025-01-15
 */

import { 
  signInWithPhoneNumber, 
  signInWithPopup, 
  GoogleAuthProvider, 
  RecaptchaVerifier,
  ConfirmationResult,
  User,
  Auth,
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { smsService } from './sms.service';

/**
 * Interface for user profile data stored in Firestore
 */
interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  isAdmin: boolean;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}

/**
 * Interface for admin OTP verification data
 */
interface AdminOTPData {
  phoneNumber: string;
  otp: string;
  expiresAt: Timestamp;
  attempts: number;
}

/**
 * Exported user type for auth consumers
 */
export interface AuthUser {
  id: string;
  email?: string;
  name: string;
  role: 'user' | 'admin';
  provider: string;
  verified: boolean;
  profileImage?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  adminAccess?: boolean;
}

/**
 * Unified Authentication Service
 * Provides authentication methods for both regular users and administrators
 */
class UnifiedAuthService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;
  private pendingPhoneNumber: string | null = null;
  private readonly MAX_OTP_ATTEMPTS = 3;
  private readonly OTP_EXPIRY_MINUTES = 10;

  /**
   * Initializes reCAPTCHA verifier for phone authentication
   * Creates an invisible reCAPTCHA widget for spam protection
   * @param containerId - HTML element ID for reCAPTCHA container
   * @returns Promise that resolves when reCAPTCHA is initialized
   */
  async initializeRecaptcha(containerId: string = 'recaptcha-container'): Promise<void> {
    try {
      // Clean up existing verifier
      if (this.recaptchaVerifier) {
        this.recaptchaVerifier.clear();
        this.recaptchaVerifier = null;
      }

      // Create reCAPTCHA verifier
      this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA verified successfully');
        },
        'expired-callback': () => {
          console.warn('reCAPTCHA expired, please try again');
        }
      });

      await this.recaptchaVerifier.render();
      console.log('reCAPTCHA initialized successfully');
    } catch (error) {
      console.error('Failed to initialize reCAPTCHA:', error);
      throw new Error('reCAPTCHA initialization failed');
    }
  }

  // Format and validate phone number
  private formatPhoneNumber(phoneNumber: string): string {
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return '+' + cleaned;
  }

  // Validate phone number format
  validatePhoneNumber(phoneNumber: string): { isValid: boolean; message: string } {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length < 10) {
      return { isValid: false, message: 'Phone number is too short' };
    }
    
    if (cleaned.length > 15) {
      return { isValid: false, message: 'Phone number is too long' };
    }
    
    if (cleaned.length === 10 && !cleaned.match(/^[6-9]\d{9}$/)) {
      return { isValid: false, message: 'Please enter a valid Indian phone number' };
    }
    
    return { isValid: true, message: 'Valid phone number' };
  }

  // Check if phone number belongs to admin
  // NOTE: Admin role should be verified server-side using Firebase Custom Claims
  // This method is deprecated and returns false for security
  private isAdminPhoneNumber(phoneNumber: string): boolean {
    console.warn('Admin phone check is deprecated. Use Firebase Custom Claims for admin verification.');
    return false;
  }

  // Unified phone authentication (handles both admin and users)
  async sendPhoneOTP(phoneNumber: string): Promise<{
    success: boolean;
    message: string;
    userType: 'admin' | 'user';
    error?: string;
  }> {
    try {
      // Validate phone number
      const validation = this.validatePhoneNumber(phoneNumber);
      if (!validation.isValid) {
        return { 
          success: false, 
          message: validation.message,
          userType: 'user'
        };
      }

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const isAdmin = this.isAdminPhoneNumber(formattedPhone);
      
      // Store auth state
      // this.authState.phoneNumber = formattedPhone; // This line is removed as per new_code
      // this.authState.userType = isAdmin ? 'admin' : 'user'; // This line is removed as per new_code

      // Admin authentication is handled via Firebase Custom Claims
      // All users go through the same Firebase Phone Auth flow
      {
        // Use Firebase Phone Auth for regular users
        try {
          await this.initializeRecaptcha();

          this.confirmationResult = await signInWithPhoneNumber(
            auth!,
            formattedPhone,
            this.recaptchaVerifier!
          );

          this.pendingPhoneNumber = formattedPhone;
          localStorage.setItem('pendingPhoneAuth', formattedPhone);
          
          return {
            success: true,
            message: 'OTP sent successfully! Please check your phone.',
            userType: 'user'
          };
        } catch (error: any) {
          console.error('Firebase Phone Auth error:', error);
          
          let errorMessage = 'Failed to send OTP. Please try again.';
          
          if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many requests. Please try again later.';
          } else if (error.code === 'auth/invalid-phone-number') {
            errorMessage = 'Invalid phone number format.';
          } else if (error.code === 'auth/quota-exceeded') {
            errorMessage = 'SMS quota exceeded. Please try again later.';
          } else if (error.code === 'auth/missing-app-credential') {
            errorMessage = 'Phone authentication not properly configured.';
          }
          
          return {
            success: false,
            message: errorMessage,
            userType: 'user',
            error: error.message
          };
        }
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      return {
        success: false,
        message: 'Failed to send OTP. Please try again.',
        userType: 'user',
        error: error.message
      };
    }
  }

  // Verify OTP for both admin and users
  async verifyPhoneOTP(otpCode: string): Promise<{
    success: boolean;
    message: string;
    user?: AuthUser;
    error?: string;
  }> {
    try {
      // if (!this.authState.phoneNumber || !this.authState.userType) { // This line is removed as per new_code
      if (!this.confirmationResult) { // This line is changed as per new_code
        return {
          success: false,
          message: 'No OTP request found. Please request a new OTP.'
        };
      }

      if (otpCode.length !== 6) {
        return {
          success: false,
          message: 'Please enter a valid 6-digit OTP.'
        };
      }

      // Verify OTP using Firebase
      if (!this.confirmationResult) {
        return {
          success: false,
          message: 'No OTP request found. Please request a new OTP.'
        };
      }

      const result = await this.confirmationResult.confirm(otpCode);
      const firebaseUser = result.user;

      if (firebaseUser) {
        // Get admin status from Firebase Custom Claims
        const idTokenResult = await firebaseUser.getIdTokenResult();
        const isAdmin = idTokenResult.claims.admin === true;

        const user: AuthUser = {
          id: firebaseUser.uid,
          phoneNumber: firebaseUser.phoneNumber || '',
          name: firebaseUser.displayName || `User-${firebaseUser.phoneNumber?.slice(-4) || 'Unknown'}`,
          role: isAdmin ? 'admin' : 'user',
          provider: 'phone',
          verified: true,
          adminAccess: isAdmin
        };

        // Firestore write is non-blocking
        try {
          await this.createOrUpdateUser(user);
        } catch (firestoreErr) {
          console.warn('⚠️ User document write failed (non-fatal):', firestoreErr);
        }
        this.pendingPhoneNumber = null;
        localStorage.removeItem('pendingPhoneAuth');

        return {
          success: true,
          message: isAdmin ? 'Admin access granted successfully!' : 'Phone verified successfully!',
          user
        };
      }

      return {
        success: false,
        message: 'Verification failed. Please try again.'
      };
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      
      let errorMessage = 'Invalid OTP. Please check and try again.';
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid OTP code. Please check and try again.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'OTP has expired. Please request a new OTP.';
      }
      
      return {
        success: false,
        message: errorMessage,
        error: error.message
      };
    }
  }

  // Google Authentication (for regular users)
  async signInWithGoogle(): Promise<{
    success: boolean;
    message: string;
    user?: AuthUser;
    error?: string;
  }> {
    try {
      if (!auth) {
        return {
          success: false,
          message: 'Firebase not initialized. Please refresh and try again.'
        };
      }

      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');

      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      if (firebaseUser) {
        const googleUser: AuthUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || 'Google User',
          role: 'user',
          provider: 'google',
          verified: true,
          profileImage: firebaseUser.photoURL || undefined,
          avatarUrl: firebaseUser.photoURL || undefined,
          adminAccess: false
        };

        // Firestore write is non-blocking — auth succeeds even if user doc write fails
        try {
          await this.createOrUpdateUser(googleUser);
        } catch (firestoreErr) {
          console.warn('⚠️ User document write failed (non-fatal):', firestoreErr);
        }

        return {
          success: true,
          message: 'Google sign-in successful!',
          user: googleUser
        };
      }

      return {
        success: false,
        message: 'Google sign-in failed. Please try again.'
      };
    } catch (error: any) {
      console.error('Google sign-in error:', error);

      let errorMessage = 'Google sign-in failed. Please try again.';

      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in cancelled. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup blocked. Please allow popups and try again.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google sign-in is not enabled. Please contact support.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign-in cancelled. Please try again.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
      }

      return {
        success: false,
        message: errorMessage,
        error: error.message
      };
    }
  }

  // Create or update user document
  private async createOrUpdateUser(user: AuthUser): Promise<void> {
    if (!db) {
      console.warn('⚠️ Firestore not initialized, skipping user document write');
      return;
    }

    try {
      console.log('🔄 Creating/updating user:', { id: user.id, role: user.role, provider: user.provider });

      const userRef = doc(db, 'users', user.id);
      const existingDoc = await getDoc(userRef);

      const userData = {
        email: user.email || '',
        name: user.name,
        role: user.role,
        provider: user.provider,
        verified: user.verified,
        profileImage: user.profileImage || null,
        avatarUrl: user.avatarUrl || null,
        phoneNumber: user.phoneNumber || null,
        lastLogin: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      if (existingDoc.exists()) {
        console.log('✅ Updating existing user document');
        await setDoc(userRef, userData, { merge: true });
        console.log('✅ User document updated successfully');
      } else {
        console.log('✅ Creating new user document');
        await setDoc(userRef, {
          ...userData,
          createdAt: Timestamp.now()
        });
        console.log('✅ User document created successfully');
      }
    } catch (error: any) {
      console.error('❌ Error creating/updating user:', error.code, error.message);
      throw error; // Re-throw — caller handles gracefully
    }
  }

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      if (!auth || !db) return null;
      const user = auth.currentUser;
      if (!user) return null;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) return null;

      const userData = userDoc.data();
      return {
        id: user.uid,
        phoneNumber: userData.phoneNumber,
        email: userData.email,
        name: userData.name || user.displayName || 'User',
        role: userData.role || 'user',
        provider: userData.provider || 'phone',
        verified: userData.verified || false,
        profileImage: userData.profileImage || user.photoURL,
        adminAccess: userData.adminAccess || false
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Sign out user
  async signOut(): Promise<void> {
    try {
      if (auth) await auth.signOut();
      // this.clearAuthState(); // This line is removed as per new_code
      localStorage.removeItem('pendingPhoneAuth');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  // Resend OTP
  async resendOTP(): Promise<{
    success: boolean;
    message: string;
    userType: 'admin' | 'user';
    error?: string;
  }> {
    if (!this.pendingPhoneNumber) {
      return {
        success: false,
        message: 'No phone number found. Please start over.',
        userType: 'user'
      };
    }

    return this.sendPhoneOTP(this.pendingPhoneNumber);
  }

  // Clear authentication state
  private clearAuthState(): void {
    if (this.recaptchaVerifier) {
      try {
        this.recaptchaVerifier.clear();
      } catch (error) {
        console.log('Error clearing reCAPTCHA:', error);
      }
    }
    
    // this.authState = { // This line is removed as per new_code
    //   confirmationResult: null, // This line is removed as per new_code
    //   recaptchaVerifier: null, // This line is removed as per new_code
    //   phoneNumber: null, // This line is removed as per new_code
    //   userType: null // This line is removed as per new_code
    // }; // This line is removed as per new_code
  }

  // Cleanup on component unmount
  cleanup(): void {
    this.clearAuthState();
    localStorage.removeItem('pendingPhoneAuth');
  }

  // Check if user has admin access
  isAdmin(user: AuthUser | null): boolean {
    return user?.role === 'admin' && user?.adminAccess === true;
  }

  // Get phone number display format
  getFormattedPhoneNumber(): string | null {
    if (!this.pendingPhoneNumber) return null;

    const phone = this.pendingPhoneNumber.replace('+91', '');
    return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
  }
}

export const unifiedAuthService = new UnifiedAuthService(); 