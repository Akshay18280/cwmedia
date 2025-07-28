import React, { useState, useEffect } from 'react';
import { Phone, Shield, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { phoneAuthService } from '../services/firebase/phone-auth.service';

interface PhoneAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  title?: string;
  subtitle?: string;
}

export default function PhoneAuthModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  title = "Phone Verification",
  subtitle = "Secure login with your phone number"
}: PhoneAuthModalProps) {
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      phoneAuthService.cleanup();
    };
  }, []);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('phone');
      setPhoneNumber('');
      setOtpCode('');
      setCountdown(0);
    }
  }, [isOpen]);

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    const validation = phoneAuthService.validatePhoneNumber(phoneNumber);
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }

    setLoading(true);

    try {
      const result = await phoneAuthService.sendOTP(phoneNumber, 'recaptcha-container');
      
      if (result.success) {
        setStep('otp');
        setCountdown(60); // 60 seconds countdown
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const result = await phoneAuthService.verifyOTP(otpCode);
      
      if (result.success && result.user) {
        setStep('success');
        toast.success(result.message);
        
        // Delay before calling onSuccess to show success state
        setTimeout(() => {
          onSuccess(result.user);
          onClose();
        }, 1500);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast.error('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setLoading(true);
    setCountdown(60);

    try {
      const result = await phoneAuthService.resendOTP(phoneNumber, 'recaptcha-container');
      
      if (result.success) {
        toast.success('OTP sent again!');
        setOtpCode(''); // Clear previous OTP
      } else {
        toast.error(result.message);
        setCountdown(0);
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error('Failed to resend OTP');
      setCountdown(0);
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    
    // Format as Indian number: +91 XXXXX XXXXX
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{5})(\d{1,5})/, '$1 $2').trim();
    }
    
    return cleaned.slice(0, 10).replace(/(\d{5})(\d{5})/, '$1 $2');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            step === 'success' 
              ? 'bg-green-100 dark:bg-green-900' 
              : 'bg-blue-100 dark:bg-blue-900'
          }`}>
            {step === 'success' ? (
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            ) : step === 'otp' ? (
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            ) : (
              <Phone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {step === 'success' ? 'Verification Successful!' : 
             step === 'otp' ? 'Enter OTP' : title}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400">
            {step === 'success' ? 'Your phone number has been verified successfully.' :
             step === 'otp' ? `We've sent a 6-digit code to ${phoneNumber}` :
             subtitle}
          </p>
        </div>

        {/* Phone Number Step */}
        {step === 'phone' && (
          <div className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">+91</span>
                </div>
                <input
                  type="tel"
                  id="phone"
                  value={formatPhoneNumber(phoneNumber)}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  maxLength={11} // 5 + 1 space + 5
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter your 10-digit mobile number
              </p>
            </div>

            <button
              onClick={handleSendOTP}
              disabled={loading || phoneNumber.length < 10}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
              ) : (
                <Phone className="w-5 h-5 mr-3" />
              )}
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </div>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <div className="space-y-6">
            <button
              onClick={() => setStep('phone')}
              className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Change number
            </button>

            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter 6-digit OTP
              </label>
              <input
                type="text"
                id="otp"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                maxLength={6}
                disabled={loading}
              />
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={loading || otpCode.length !== 6}
              className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
              ) : (
                <Shield className="w-5 h-5 mr-3" />
              )}
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="text-center">
              <button
                onClick={handleResendOTP}
                disabled={countdown > 0 || loading}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
              </button>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="text-center">
            <div className="animate-pulse">
              <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Redirecting you to your account...
            </p>
          </div>
        )}

        {/* Close button */}
        {step !== 'success' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        )}

        {/* reCAPTCHA container */}
        <div id="recaptcha-container" className="hidden"></div>
      </div>
    </div>
  );
} 