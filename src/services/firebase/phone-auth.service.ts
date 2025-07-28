import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  PhoneAuthProvider,
  signInWithCredential,
  ConfirmationResult 
} from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { authService } from '../auth';

interface PhoneAuthState {
  confirmationResult: ConfirmationResult | null;
  verificationId: string | null;
  recaptchaVerifier: RecaptchaVerifier | null;
}

class PhoneAuthService {
  private authState: PhoneAuthState = {
    confirmationResult: null,
    verificationId: null,
    recaptchaVerifier: null
  };

  // Initialize reCAPTCHA verifier
  private initializeRecaptcha(containerId: string): RecaptchaVerifier {
    if (this.authState.recaptchaVerifier) {
      this.authState.recaptchaVerifier.clear();
    }

    this.authState.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible',
      'callback': () => {
        console.log('reCAPTCHA solved');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      }
    });

    return this.authState.recaptchaVerifier;
  }

  // Format phone number for Firebase (add country code if missing)
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if missing (assuming India +91)
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    // Add + prefix
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
    
    // Indian phone number validation
    if (cleaned.length === 10 && !cleaned.match(/^[6-9]\d{9}$/)) {
      return { isValid: false, message: 'Please enter a valid Indian phone number' };
    }
    
    return { isValid: true, message: 'Valid phone number' };
  }

  // Send OTP to phone number
  async sendOTP(phoneNumber: string, recaptchaContainerId: string = 'recaptcha-container'): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      // Validate phone number
      const validation = this.validatePhoneNumber(phoneNumber);
      if (!validation.isValid) {
        return { success: false, message: validation.message };
      }

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Initialize reCAPTCHA
      const recaptchaVerifier = this.initializeRecaptcha(recaptchaContainerId);
      
      // Send OTP
      this.authState.confirmationResult = await signInWithPhoneNumber(
        auth, 
        formattedPhone, 
        recaptchaVerifier
      );
      
      // Store formatted phone for later use
      localStorage.setItem('pendingPhoneAuth', formattedPhone);
      
      return {
        success: true,
        message: 'OTP sent successfully! Please check your phone.'
      };
    } catch (error: any) {
      console.error('Send OTP error:', error);
      
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format.';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later.';
      }
      
      return {
        success: false,
        message: errorMessage,
        error: error.message
      };
    }
  }

  // Verify OTP and complete phone authentication
  async verifyOTP(otpCode: string): Promise<{
    success: boolean;
    message: string;
    user?: any;
    error?: string;
  }> {
    try {
      if (!this.authState.confirmationResult) {
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

      // Verify OTP
      const result = await this.authState.confirmationResult.confirm(otpCode);
      const user = result.user;
      
      if (user) {
        // Create or update user document in Firestore
        const phoneNumber = localStorage.getItem('pendingPhoneAuth') || user.phoneNumber || '';
        await this.createOrUpdatePhoneUser(user.uid, phoneNumber, user);
        
        // Clean up
        localStorage.removeItem('pendingPhoneAuth');
        this.clearAuthState();
        
        return {
          success: true,
          message: 'Phone number verified successfully!',
          user: {
            id: user.uid,
            phoneNumber: user.phoneNumber,
            name: user.displayName || `User-${user.phoneNumber?.slice(-4)}`,
            email: user.email,
            provider: 'phone',
            verified: true
          }
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

  // Create or update user document for phone authentication
  private async createOrUpdatePhoneUser(uid: string, phoneNumber: string, firebaseUser: any): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      const existingDoc = await getDoc(userRef);
      
      const userData = {
        phoneNumber,
        name: firebaseUser.displayName || `User-${phoneNumber?.slice(-4)}`,
        email: firebaseUser.email || null,
        role: 'user',
        provider: 'phone',
        verified: true,
        lastLogin: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      if (existingDoc.exists()) {
        // Update existing user
        await setDoc(userRef, userData, { merge: true });
      } else {
        // Create new user
        await setDoc(userRef, {
          ...userData,
          createdAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error creating/updating phone user:', error);
    }
  }

  // Resend OTP
  async resendOTP(phoneNumber: string, recaptchaContainerId: string = 'recaptcha-container'): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    // Clear current state and send new OTP
    this.clearAuthState();
    return this.sendOTP(phoneNumber, recaptchaContainerId);
  }

  // Clear authentication state
  private clearAuthState(): void {
    if (this.authState.recaptchaVerifier) {
      this.authState.recaptchaVerifier.clear();
    }
    
    this.authState = {
      confirmationResult: null,
      verificationId: null,
      recaptchaVerifier: null
    };
  }

  // Check if user has a verified phone number
  async hasVerifiedPhone(userId: string): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      return userData?.phoneNumber && userData?.verified;
    } catch (error) {
      console.error('Error checking phone verification:', error);
      return false;
    }
  }

  // Get user's phone number
  async getUserPhone(userId: string): Promise<string | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      return userData?.phoneNumber || null;
    } catch (error) {
      console.error('Error getting user phone:', error);
      return null;
    }
  }

  // Cleanup on component unmount
  cleanup(): void {
    this.clearAuthState();
    localStorage.removeItem('pendingPhoneAuth');
  }
}

export const phoneAuthService = new PhoneAuthService(); 