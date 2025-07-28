import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { smsService } from './sms.service';

interface AuthState {
  confirmationResult: ConfirmationResult | null;
  recaptchaVerifier: RecaptchaVerifier | null;
  phoneNumber: string | null;
  userType: 'admin' | 'user' | null;
}

interface AuthUser {
  id: string;
  phoneNumber?: string;
  email?: string;
  name: string;
  role: 'admin' | 'user';
  provider: 'phone' | 'google';
  verified: boolean;
  profileImage?: string;
  adminAccess?: boolean;
}

class UnifiedAuthService {
  private authState: AuthState = {
    confirmationResult: null,
    recaptchaVerifier: null,
    phoneNumber: null,
    userType: null
  };

  private readonly adminPhoneNumber = '6264507878';

  // Initialize reCAPTCHA with better error handling
  private initializeRecaptcha(containerId: string = 'recaptcha-container'): RecaptchaVerifier {
    try {
      // Clear existing verifier
      if (this.authState.recaptchaVerifier) {
        this.authState.recaptchaVerifier.clear();
      }

      // Ensure container exists
      let container = document.getElementById(containerId);
      if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.style.display = 'none';
        document.body.appendChild(container);
      }

      this.authState.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        'size': 'invisible',
        'callback': (response: any) => {
          console.log('reCAPTCHA solved successfully');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired, please try again');
        },
        'error-callback': (error: any) => {
          console.error('reCAPTCHA error:', error);
        }
      });

      return this.authState.recaptchaVerifier;
    } catch (error) {
      console.error('Failed to initialize reCAPTCHA:', error);
      throw new Error('Failed to initialize phone verification. Please refresh and try again.');
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
  private isAdminPhoneNumber(phoneNumber: string): boolean {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned === this.adminPhoneNumber || cleaned === `91${this.adminPhoneNumber}`;
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
      this.authState.phoneNumber = formattedPhone;
      this.authState.userType = isAdmin ? 'admin' : 'user';

      if (isAdmin) {
        // Use Twilio SMS for admin
        const result = await smsService.generateAdminOTP(this.adminPhoneNumber);
        return {
          success: result.success,
          message: result.success 
            ? 'Admin OTP sent to your registered number!' 
            : result.message,
          userType: 'admin',
          error: result.error
        };
      } else {
        // Use Firebase Phone Auth for regular users
        try {
          const recaptchaVerifier = this.initializeRecaptcha();
          
          this.authState.confirmationResult = await signInWithPhoneNumber(
            auth, 
            formattedPhone, 
            recaptchaVerifier
          );
          
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
      if (!this.authState.phoneNumber || !this.authState.userType) {
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

      if (this.authState.userType === 'admin') {
        // Verify admin OTP using SMS service
        const result = await smsService.verifyAdminOTP(otpCode, this.adminPhoneNumber);
        
        if (result.success) {
          const adminUser: AuthUser = {
            id: 'admin_' + this.adminPhoneNumber,
            phoneNumber: this.authState.phoneNumber,
            name: 'Admin (Akshay Verma)',
            role: 'admin',
            provider: 'phone',
            verified: true,
            adminAccess: true
          };

          // Store admin session
          await this.createOrUpdateUser(adminUser);
          this.clearAuthState();
          
          return {
            success: true,
            message: 'Admin access granted successfully!',
            user: adminUser
          };
        } else {
          return {
            success: false,
            message: result.message
          };
        }
      } else {
        // Verify regular user OTP using Firebase
        if (!this.authState.confirmationResult) {
          return {
            success: false,
            message: 'No OTP request found. Please request a new OTP.'
          };
        }

        const result = await this.authState.confirmationResult.confirm(otpCode);
        const firebaseUser = result.user;
        
        if (firebaseUser) {
          const regularUser: AuthUser = {
            id: firebaseUser.uid,
            phoneNumber: this.authState.phoneNumber,
            name: `User-${this.authState.phoneNumber.slice(-4)}`,
            role: 'user',
            provider: 'phone',
            verified: true,
            adminAccess: false
          };

          // Store user session
          await this.createOrUpdateUser(regularUser);
          localStorage.removeItem('pendingPhoneAuth');
          this.clearAuthState();
          
          return {
            success: true,
            message: 'Phone verified successfully!',
            user: regularUser
          };
        }

        return {
          success: false,
          message: 'Verification failed. Please try again.'
        };
      }
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
          adminAccess: false
        };

        await this.createOrUpdateUser(googleUser);
        
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
    try {
      const userRef = doc(db, 'users', user.id);
      const existingDoc = await getDoc(userRef);
      
      const userData = {
        ...user,
        lastLogin: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      if (existingDoc.exists()) {
        await updateDoc(userRef, userData);
      } else {
        await setDoc(userRef, {
          ...userData,
          createdAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error creating/updating user:', error);
    }
  }

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
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
      await auth.signOut();
      this.clearAuthState();
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
    if (!this.authState.phoneNumber) {
      return {
        success: false,
        message: 'No phone number found. Please start over.',
        userType: 'user'
      };
    }

    this.clearAuthState();
    return this.sendPhoneOTP(this.authState.phoneNumber);
  }

  // Clear authentication state
  private clearAuthState(): void {
    if (this.authState.recaptchaVerifier) {
      try {
        this.authState.recaptchaVerifier.clear();
      } catch (error) {
        console.log('Error clearing reCAPTCHA:', error);
      }
    }
    
    this.authState = {
      confirmationResult: null,
      recaptchaVerifier: null,
      phoneNumber: null,
      userType: null
    };
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
    if (!this.authState.phoneNumber) return null;
    
    const phone = this.authState.phoneNumber.replace('+91', '');
    return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
  }
}

export const unifiedAuthService = new UnifiedAuthService();
export type { AuthUser }; 