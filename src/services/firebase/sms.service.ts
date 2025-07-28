// SMS Service using Twilio for real OTP functionality
import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// Twilio configuration (replace with your actual credentials)
const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID || 'your-twilio-account-sid';
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN || 'your-twilio-auth-token';
const TWILIO_PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER || '+1234567890';

class SMSService {
  private isTestMode: boolean = false;
  private otpCollection = 'admin_verification';

  constructor() {
    // Enable test mode if Twilio credentials are not set
    if (!TWILIO_ACCOUNT_SID || 
        !TWILIO_AUTH_TOKEN || 
        TWILIO_ACCOUNT_SID === 'your-twilio-account-sid' ||
        TWILIO_AUTH_TOKEN === 'your-twilio-auth-token') {
      this.isTestMode = true;
      console.warn('⚠️ SMS Service in TEST MODE - Set Twilio credentials for production');
    }
  }

  // Generate random 6-digit OTP
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Format phone number for international format
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

  // Send real SMS using Twilio
  private async sendTwilioSMS(to: string, message: string): Promise<boolean> {
    try {
      // Twilio REST API endpoint
      const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
      
      // Prepare form data
      const formData = new URLSearchParams();
      formData.append('From', TWILIO_PHONE_NUMBER);
      formData.append('To', to);
      formData.append('Body', message);

      // Basic Auth header
      const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Twilio SMS error:', error);
        return false;
      }

      const result = await response.json();
      console.log('SMS sent successfully:', result.sid);
      return true;
    } catch (error) {
      console.error('Error sending SMS via Twilio:', error);
      return false;
    }
  }

  // Generate and store admin OTP
  async generateAdminOTP(phoneNumber: string = '6264507878'): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      console.log('🔄 Generating admin OTP for phone:', phoneNumber);
      
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      console.log('📝 Storing OTP in Firestore...');
      
      // Store OTP in Firestore
      await setDoc(doc(db, this.otpCollection, phoneNumber), {
        phoneNumber: formattedPhone,
        otpCode,
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: Timestamp.now(),
        verified: false,
        attempts: 0
      });

      console.log('✅ OTP stored successfully in Firestore');

      // Try to send SMS
      const smsContent = `Your Carelwave Media admin OTP: ${otpCode}. Valid for 10 minutes.`;
      
      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
        console.log('📱 TEST MODE - SMS to', formattedPhone + ':', smsContent);
        return {
          success: true,
          message: `OTP sent! Check console for test code. Phone: ${formattedPhone}`
        };
      }

      console.log('📤 Sending real SMS via Twilio...');
      const smsSent = await this.sendTwilioSMS(formattedPhone, smsContent);
      
      if (smsSent) {
        console.log('✅ SMS sent successfully via Twilio');
        return {
          success: true,
          message: 'OTP sent successfully to your phone!'
        };
      } else {
        console.log('📱 FALLBACK - SMS to', formattedPhone + ':', smsContent);
        return {
          success: true,
          message: 'OTP generated successfully (check console for test mode)'
        };
      }
    } catch (error: any) {
      console.error('❌ Error generating admin OTP:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      return {
        success: false,
        message: 'Failed to generate OTP',
        error: error.message
      };
    }
  }

  // Verify admin OTP
  async verifyAdminOTP(enteredOTP: string, phoneNumber: string = '6264507878'): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      const otpDocRef = doc(db, this.otpCollection, phoneNumber);
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

      // Check expiration
      if (now > expiresAt) {
        return {
          success: false,
          message: 'OTP has expired. Please generate a new OTP.'
        };
      }

      // Increment attempts
      const attempts = (otpData.attempts || 0) + 1;
      await updateDoc(otpDocRef, { attempts });

      // Check max attempts (prevent brute force)
      if (attempts > 5) {
        return {
          success: false,
          message: 'Too many failed attempts. Please generate a new OTP.'
        };
      }

      // Verify OTP
      if (otpData.otpCode !== enteredOTP) {
        return {
          success: false,
          message: `Invalid OTP. ${6 - attempts} attempts remaining.`
        };
      }

      // Mark as verified
      await updateDoc(otpDocRef, {
        verified: true,
        verifiedAt: Timestamp.now()
      });

      return {
        success: true,
        message: 'Admin verified successfully!'
      };
    } catch (error: any) {
      console.error('OTP verification error:', error);
      return {
        success: false,
        message: 'Verification failed',
        error: error.message
      };
    }
  }

  // Check if OTP is still valid
  async isOTPValid(phoneNumber: string = '6264507878'): Promise<boolean> {
    try {
      const otpDoc = await getDoc(doc(db, this.otpCollection, phoneNumber));
      
      if (!otpDoc.exists()) {
        return false;
      }

      const otpData = otpDoc.data();
      const now = new Date();
      const expiresAt = otpData.expiresAt.toDate();

      return now <= expiresAt && !otpData.verified;
    } catch (error) {
      console.error('Error checking OTP validity:', error);
      return false;
    }
  }

  // Get remaining OTP time
  async getRemainingTime(phoneNumber: string = '6264507878'): Promise<number> {
    try {
      const otpDoc = await getDoc(doc(db, this.otpCollection, phoneNumber));
      
      if (!otpDoc.exists()) {
        return 0;
      }

      const otpData = otpDoc.data();
      const now = new Date();
      const expiresAt = otpData.expiresAt.toDate();
      
      const remainingMs = expiresAt.getTime() - now.getTime();
      return Math.max(0, Math.floor(remainingMs / 1000)); // Return seconds
    } catch (error) {
      console.error('Error getting remaining time:', error);
      return 0;
    }
  }

  // Cleanup expired OTPs
  async cleanupExpiredOTPs(): Promise<void> {
    try {
      // In a real implementation, you'd query for expired OTPs and delete them
      // For now, we'll just log this action
      console.log('Cleaning up expired OTPs...');
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
    }
  }

  // Get service status
  getStatus(): { available: boolean; mode: string; message: string } {
    if (this.isTestMode) {
      return {
        available: false,
        mode: 'test',
        message: 'Running in test mode - set Twilio credentials for production'
      };
    }

    return {
      available: true,
      mode: 'production',
      message: 'SMS service ready with Twilio'
    };
  }

  // Check if service is available
  isAvailable(): boolean {
    return !this.isTestMode;
  }

  // Send custom SMS (for other use cases)
  async sendCustomSMS(to: string, message: string): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      const formattedPhone = this.formatPhoneNumber(to);

      if (this.isTestMode) {
        console.log(`📱 TEST MODE - SMS to ${formattedPhone}: ${message}`);
        return {
          success: true,
          message: 'SMS sent (test mode)'
        };
      }

      const sent = await this.sendTwilioSMS(formattedPhone, message);
      
      if (sent) {
        return {
          success: true,
          message: 'SMS sent successfully'
        };
      } else {
        return {
          success: false,
          message: 'Failed to send SMS'
        };
      }
    } catch (error: any) {
      console.error('Custom SMS error:', error);
      return {
        success: false,
        message: 'Failed to send SMS',
        error: error.message
      };
    }
  }
}

export const smsService = new SMSService(); 