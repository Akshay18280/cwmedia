/**
 * @fileoverview SMS Service for OTP verification
 * Handles sending OTP messages via multiple providers with fallbacks
 * @version 2.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 * @updated 2025-01-15
 */

import { doc, setDoc, getDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface OTPRecord {
  phoneNumber: string;
  otp: string;
  expiresAt: Timestamp;
  attempts: number;
  createdAt: Timestamp;
  provider: string;
  status: 'pending' | 'verified' | 'expired';
}

interface SMSProvider {
  name: string;
  sendSMS: (phoneNumber: string, message: string) => Promise<boolean>;
  isAvailable: () => boolean;
}

class SMSService {
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly MAX_ATTEMPTS = 3;
  private readonly otpCollection = 'otp_verifications';

  // SMS Provider configurations
  private providers: SMSProvider[] = [
    {
      name: 'Twilio',
      sendSMS: this.sendViaTwilio.bind(this),
      isAvailable: () => !!process.env.TWILIO_ACCOUNT_SID
    },
    {
      name: 'Firebase SMS',
      sendSMS: this.sendViaFirebase.bind(this),
      isAvailable: () => true // Always available as fallback
    },
    {
      name: 'Mock SMS (Development)',
      sendSMS: this.sendViaMock.bind(this),
      isAvailable: () => process.env.NODE_ENV === 'development'
    }
  ];

  // Generate 6-digit OTP
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Format phone number
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Add country code if missing
    if (digits.length === 10) {
      return '+1' + digits; // Default to US
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return '+' + digits;
    } else if (digits.length > 10 && !digits.startsWith('+')) {
      return '+' + digits;
    }
    
    return digits.startsWith('+') ? digits : '+' + digits;
  }

  // Send OTP via Twilio
  private async sendViaTwilio(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        console.warn('Twilio credentials not configured');
        return false;
      }

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: phoneNumber,
          Body: message
        })
      });

      if (response.ok) {
        console.log('✅ SMS sent via Twilio');
        return true;
      } else {
        const error = await response.text();
        console.error('❌ Twilio SMS failed:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Twilio SMS error:', error);
      return false;
    }
  }

  // Send OTP via Firebase Cloud Functions
  private async sendViaFirebase(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber,
          message,
          provider: 'firebase'
        })
      });

      if (response.ok) {
        console.log('✅ SMS sent via Firebase');
        return true;
      } else {
        console.error('❌ Firebase SMS failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Firebase SMS error:', error);
      return false;
    }
  }

  // Mock SMS for development
  private async sendViaMock(phoneNumber: string, message: string): Promise<boolean> {
    console.log('📱 MOCK SMS to', phoneNumber);
    console.log('📝 Message:', message);
    
    // Show OTP in console for development
    const otpMatch = message.match(/(\d{6})/);
    if (otpMatch) {
      console.log('🔢 DEVELOPMENT OTP:', otpMatch[1]);
      
      // Show in browser notification for easy access
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Development OTP', {
          body: `Your OTP is: ${otpMatch[1]}`,
          icon: '/favicon.ico'
        });
      }
      
      // Store in localStorage for easy retrieval
      localStorage.setItem('dev_otp', otpMatch[1]);
      localStorage.setItem('dev_otp_phone', phoneNumber);
    }
    
    return true;
  }

  // Send OTP with provider fallback
  async sendOTP(phoneNumber: string, isAdmin: boolean = false): Promise<{
    success: boolean;
    message: string;
    otpId?: string;
  }> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      console.log('📱 Sending OTP to:', formattedPhone);

      // Check if phone number already has a pending OTP
      const existingOTPDoc = await getDoc(doc(db, this.otpCollection, formattedPhone));
      if (existingOTPDoc.exists()) {
        const existingOTP = existingOTPDoc.data() as OTPRecord;
        if (existingOTP.expiresAt.toDate() > new Date()) {
          return {
            success: false,
            message: 'OTP already sent. Please wait before requesting a new one.'
          };
        }
      }

      // Generate new OTP
      const otp = this.generateOTP();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

      // Create message
      const message = isAdmin 
        ? `🚀 Your Carelwave Media admin access code is: ${otp}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes. Never share this code!`
        : `🌊 Your Carelwave Media verification code is: ${otp}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes.`;

      // Try providers in order until one succeeds
      let smsSuccess = false;
      let usedProvider = '';

      for (const provider of this.providers) {
        if (provider.isAvailable()) {
          console.log(`📡 Trying provider: ${provider.name}`);
          smsSuccess = await provider.sendSMS(formattedPhone, message);
          
          if (smsSuccess) {
            usedProvider = provider.name;
            break;
          }
        }
      }

      if (!smsSuccess) {
        return {
          success: false,
          message: 'Failed to send SMS. Please try again later.'
        };
      }

      // Store OTP record in Firestore
      const otpRecord: OTPRecord = {
        phoneNumber: formattedPhone,
        otp: otp,
        expiresAt: Timestamp.fromDate(expiresAt),
        attempts: 0,
        createdAt: Timestamp.now(),
        provider: usedProvider,
        status: 'pending'
      };

      await setDoc(doc(db, this.otpCollection, formattedPhone), otpRecord);

      console.log(`✅ OTP sent successfully via ${usedProvider}`);
      
      return {
        success: true,
        message: `Verification code sent to ${formattedPhone} via ${usedProvider}`,
        otpId: formattedPhone
      };

    } catch (error) {
      console.error('❌ Send OTP error:', error);
      return {
        success: false,
        message: 'Failed to send verification code. Please try again.'
      };
    }
  }

  // Verify OTP
  async verifyOTP(phoneNumber: string, enteredOTP: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      console.log('🔍 Verifying OTP for:', formattedPhone);

      const otpDoc = await getDoc(doc(db, this.otpCollection, formattedPhone));
      
      if (!otpDoc.exists()) {
        return {
          success: false,
          message: 'No verification request found. Please request a new OTP.'
        };
      }

      const otpRecord = otpDoc.data() as OTPRecord;

      // Check if OTP is expired
      if (otpRecord.expiresAt.toDate() < new Date()) {
        await deleteDoc(doc(db, this.otpCollection, formattedPhone));
        return {
          success: false,
          message: 'Verification code has expired. Please request a new one.'
        };
      }

      // Check attempts
      if (otpRecord.attempts >= this.MAX_ATTEMPTS) {
        await deleteDoc(doc(db, this.otpCollection, formattedPhone));
        return {
          success: false,
          message: 'Too many attempts. Please request a new verification code.'
        };
      }

      // Verify OTP
      if (otpRecord.otp === enteredOTP.trim()) {
        // OTP is correct
        await deleteDoc(doc(db, this.otpCollection, formattedPhone));
        console.log('✅ OTP verified successfully');
        
        return {
          success: true,
          message: 'Phone number verified successfully!'
        };
      } else {
        // Increment attempts
        await setDoc(doc(db, this.otpCollection, formattedPhone), {
          ...otpRecord,
          attempts: otpRecord.attempts + 1
        });

        return {
          success: false,
          message: `Invalid verification code. ${this.MAX_ATTEMPTS - otpRecord.attempts - 1} attempts remaining.`
        };
      }

    } catch (error) {
      console.error('❌ Verify OTP error:', error);
      return {
        success: false,
        message: 'Verification failed. Please try again.'
      };
    }
  }

  // Admin-specific OTP verification
  async verifyAdminOTP(enteredOTP: string, phoneNumber: string): Promise<{
    success: boolean;
    message: string;
  }> {
    // For development, check localStorage first
    if (process.env.NODE_ENV === 'development') {
      const devOTP = localStorage.getItem('dev_otp');
      const devPhone = localStorage.getItem('dev_otp_phone');
      
      if (devOTP === enteredOTP && devPhone === phoneNumber) {
        localStorage.removeItem('dev_otp');
        localStorage.removeItem('dev_otp_phone');
        return {
          success: true,
          message: 'Admin verification successful (development mode)'
        };
      }
    }

    // Use regular verification for production
    return this.verifyOTP(phoneNumber, enteredOTP);
  }

  // Cleanup expired OTPs (call this periodically)
  async cleanupExpiredOTPs(): Promise<void> {
    try {
      console.log('🧹 Cleaning up expired OTPs...');
      // This would typically be done via a Cloud Function
      // For now, we rely on individual verification checks
    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
  }

  // Request notification permission for development
  async requestNotificationPermission(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }
}

export const smsService = new SMSService(); 