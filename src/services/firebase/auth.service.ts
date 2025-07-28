import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import type { FirebaseUser, CreateFirebaseUser } from '../../types/firebase';

export interface SocialUser {
  id: string;
  email: string;
  name: string;
  company?: string;
  position?: string;
  profileImage?: string;
  linkedinUrl?: string;
  provider: 'google' | 'linkedin';
  providerId: string;
}

class FirebaseAuthService {
  private readonly usersCollection = collection(db, 'users');
  private readonly otpCollection = collection(db, 'admin_verification');

  // Get current user
  getCurrentUser(): Promise<SocialUser | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        
        if (user) {
          try {
            const userDoc = await this.getUserDocument(user.uid);
            if (userDoc) {
              resolve({
                id: user.uid,
                email: user.email || '',
                name: userDoc.name || user.displayName || '',
                company: userDoc.company,
                position: userDoc.position,
                profileImage: userDoc.profileImage || user.photoURL || undefined,
                linkedinUrl: userDoc.linkedinUrl,
                provider: 'google' as const,
                providerId: user.uid
              });
            } else {
              resolve(null);
            }
          } catch (error) {
            console.error('Error getting user document:', error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  }

  // Get user document from Firestore
  private async getUserDocument(uid: string): Promise<FirebaseUser | null> {
    try {
      const userDocRef = doc(this.usersCollection, uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as FirebaseUser;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user document:', error);
      return null;
    }
  }

  // Create or update user document
  private async createOrUpdateUser(user: User, additionalData?: Partial<FirebaseUser>): Promise<FirebaseUser> {
    const userDocRef = doc(this.usersCollection, user.uid);
    const existingUser = await getDoc(userDocRef);
    
    const now = Timestamp.now();
    const userData: CreateFirebaseUser = {
      email: user.email || '',
      name: user.displayName || '',
      avatarUrl: user.photoURL || undefined,
      role: 'user',
      provider: 'google',
      providerId: user.uid,
      verified: user.emailVerified,
      lastLogin: now,
      ...additionalData
    };

    if (existingUser.exists()) {
      // Update existing user
      await updateDoc(userDocRef, {
        ...userData,
        updatedAt: now,
        lastLogin: now
      });
    } else {
      // Create new user
      await setDoc(userDocRef, {
        ...userData,
        createdAt: now,
        updatedAt: now
      });
    }

    const finalUser = await getDoc(userDocRef);
    return { id: finalUser.id, ...finalUser.data() } as FirebaseUser;
  }

  // Sign in with email and password (admin)
  async signInWithEmail(email: string, password: string): Promise<{ success: boolean; user?: SocialUser; error?: string }> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update user document with login time
      await this.createOrUpdateUser(user);
      
      const socialUser: SocialUser = {
        id: user.uid,
        email: user.email || '',
        name: user.displayName || '',
        provider: 'google',
        providerId: user.uid
      };

      return { success: true, user: socialUser };
    } catch (error) {
      console.error('Email sign in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sign in'
      };
    }
  }

  // Sign up with email and password
  async signUpWithEmail(email: string, password: string, name: string): Promise<{ success: boolean; user?: SocialUser; error?: string }> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update user profile
      await updateProfile(user, { displayName: name });
      
      // Create user document
      await this.createOrUpdateUser(user, { name });
      
      const socialUser: SocialUser = {
        id: user.uid,
        email: user.email || '',
        name: name,
        provider: 'google',
        providerId: user.uid
      };

      return { success: true, user: socialUser };
    } catch (error) {
      console.error('Email sign up error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create account'
      };
    }
  }

  // Sign in with Google
  async loginWithGoogle(): Promise<{ success: boolean; user?: SocialUser; error?: string }> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Create or update user document
      await this.createOrUpdateUser(user);
      
      const socialUser: SocialUser = {
        id: user.uid,
        email: user.email || '',
        name: user.displayName || '',
        profileImage: user.photoURL || undefined,
        provider: 'google',
        providerId: user.uid
      };

      return { success: true, user: socialUser };
    } catch (error) {
      console.error('Google sign in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sign in with Google'
      };
    }
  }

  // LinkedIn login (placeholder - requires additional setup)
  async loginWithLinkedIn(): Promise<{ success: boolean; user?: SocialUser; error?: string }> {
    try {
      // LinkedIn OAuth would require additional setup and custom implementation
      // For now, return a placeholder response
      return {
        success: false,
        error: 'LinkedIn login not yet implemented. Please use Google login.'
      };
    } catch (error) {
      console.error('LinkedIn login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to login with LinkedIn'
      };
    }
  }

  // Generate admin OTP
  async generateAdminOTP(): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const phoneNumber = '6264507878'; // Updated phone number
      const otpCode = '123456'; // Fixed OTP for testing
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Store OTP in Firestore
      await setDoc(doc(this.otpCollection, phoneNumber), {
        phoneNumber,
        otpCode,
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: Timestamp.now(),
        verified: false
      });

      // In production, integrate with SMS service like Twilio
      console.log(`SMS to ${phoneNumber}: Your Carelwave Media admin OTP: ${otpCode}. Valid for 10 minutes.`);
      
      return { 
        success: true, 
        message: 'OTP sent! Use code: 123456 for testing.' 
      };
    } catch (error) {
      console.error('OTP generation error:', error);
      return {
        success: false,
        message: 'Failed to generate OTP',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Verify admin OTP
  async verifyAdminOTP(enteredOTP: string): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const phoneNumber = '6264507878'; // Updated phone number
      const otpDocRef = doc(this.otpCollection, phoneNumber);
      const otpDoc = await getDoc(otpDocRef);

      if (!otpDoc.exists()) {
        return { 
          success: false, 
          message: 'OTP not found. Please generate a new OTP.' 
        };
      }

      const otpData = otpDoc.data();
      const now = new Date();
      const expiresAt = otpData.expiresAt.toDate();

      if (now > expiresAt) {
        return { 
          success: false, 
          message: 'OTP has expired. Please generate a new OTP.' 
        };
      }

      if (otpData.otpCode !== enteredOTP) {
        return { 
          success: false, 
          message: 'Invalid OTP. Please check and try again.' 
        };
      }

      // Mark as verified
      await updateDoc(otpDocRef, {
        verified: true,
        verifiedAt: Timestamp.now()
      });

      return { 
        success: true, 
        message: 'Admin verified successfully' 
      };
    } catch (error) {
      console.error('OTP verification error:', error);
      return {
        success: false,
        message: 'Verification failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Send password reset email
  async sendPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: 'Password reset email sent! Check your inbox.'
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        message: 'Failed to send password reset email'
      };
    }
  }

  // Logout
  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      await signOut(auth);
      return {
        success: true,
        message: 'Successfully logged out'
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Failed to logout'
      };
    }
  }

  // Check if user is admin
  async isAdmin(userId: string): Promise<boolean> {
    try {
      const userDoc = await this.getUserDocument(userId);
      return userDoc?.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<FirebaseUser>): Promise<boolean> {
    try {
      const userDocRef = doc(this.usersCollection, userId);
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }
}

export const firebaseAuthService = new FirebaseAuthService(); 