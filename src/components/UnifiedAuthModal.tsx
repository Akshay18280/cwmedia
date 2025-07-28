import React, { useState, useEffect } from 'react';
import { X, Phone, Mail, Shield, CheckCircle, ArrowLeft, Crown, User } from 'lucide-react';
import { toast } from 'sonner';
import { unifiedAuthService } from '../services/firebase/unified-auth.service';
import type { AuthUser } from '../services/firebase/unified-auth.service';

interface UnifiedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
}

type AuthStep = 'phone' | 'otp' | 'success';

export default function UnifiedAuthModal({ isOpen, onClose, onSuccess }: UnifiedAuthModalProps) {
  const [step, setStep] = useState<AuthStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [userType, setUserType] = useState<'admin' | 'user'>('user');
  const [verifiedUser, setVerifiedUser] = useState<AuthUser | null>(null);

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
      unifiedAuthService.cleanup();
    };
  }, []);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('phone');
      setPhoneNumber('');
      setOtpCode('');
      setCountdown(0);
      setUserType('user');
      setVerifiedUser(null);
    }
  }, [isOpen]);

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{5})(\d{1,5})/, '$1 $2').trim();
    }
    return cleaned.slice(0, 10).replace(/(\d{5})(\d{5})/, '$1 $2');
  };

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    const validation = unifiedAuthService.validatePhoneNumber(phoneNumber);
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }

    setLoading(true);

    try {
      const result = await unifiedAuthService.sendPhoneOTP(phoneNumber);
      
      if (result.success) {
        setStep('otp');
        setCountdown(60);
        setUserType(result.userType);
        
        if (result.userType === 'admin') {
          toast.success('Admin OTP sent to your registered number!');
        } else {
          toast.success('OTP sent successfully! Please check your phone.');
        }
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
      const result = await unifiedAuthService.verifyPhoneOTP(otpCode);
      
      if (result.success && result.user) {
        setStep('success');
        setVerifiedUser(result.user);
        
        if (result.user.role === 'admin') {
          toast.success('Admin access granted successfully! 👑');
        } else {
          toast.success('Phone verified successfully! 🎉');
        }
        
        // Delay before calling onSuccess to show success state
        setTimeout(() => {
          onSuccess(result.user!);
          onClose();
        }, 2000);
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

  const handleGoogleSignIn = async () => {
    setLoading(true);

    try {
      const result = await unifiedAuthService.signInWithGoogle();
      
      if (result.success && result.user) {
        setStep('success');
        setVerifiedUser(result.user);
        toast.success('Google sign-in successful! 🎉');
        
        setTimeout(() => {
          onSuccess(result.user!);
          onClose();
        }, 1500);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setLoading(true);
    setCountdown(60);

    try {
      const result = await unifiedAuthService.sendPhoneOTP(phoneNumber);
      
      if (result.success) {
        toast.success('OTP sent again!');
        setOtpCode('');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-medium-contrast rounded-2xl max-w-md w-full shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="text-center p-8 pb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            step === 'success' 
              ? verifiedUser?.role === 'admin' 
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                : 'bg-green-100 dark:bg-green-900'
              : step === 'otp' 
                ? userType === 'admin'
                  ? 'bg-gradient-to-br from-orange-400 to-red-500'
                  : 'bg-accent-primary/10 dark:bg-accent-primary/20'
                : 'bg-low-contrast'
          }`}>
            {step === 'success' ? (
              verifiedUser?.role === 'admin' ? (
                <Crown className="w-8 h-8 text-white" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              )
            ) : step === 'otp' ? (
              userType === 'admin' ? (
                <Shield className="w-8 h-8 text-white" />
              ) : (
                <Phone className="w-8 h-8 text-accent-primary dark:text-accent-primary-light" />
              )
            ) : (
              <Phone className="w-8 h-8 text-medium-contrast" />
            )}
          </div>
          
          <h2 className="text-subtitle font-bold text-high-contrast mb-2">
            {step === 'success' 
              ? verifiedUser?.role === 'admin' 
                ? '👑 Admin Access Granted!'
                : '🎉 Welcome!'
              : step === 'otp' 
                ? userType === 'admin' 
                  ? '🛡️ Admin Verification'
                  : '📱 Enter OTP'
                : '🚀 Sign In to Continue'
            }
          </h2>
          
          <p className="text-medium-contrast">
            {step === 'success' 
              ? verifiedUser?.role === 'admin'
                ? 'You now have full admin access to manage the platform.'
                : 'Your phone number has been verified successfully!'
              : step === 'otp' 
                ? userType === 'admin'
                  ? `Admin OTP sent to your registered number`
                  : `We've sent a 6-digit code to +91 ${formatPhoneNumber(phoneNumber)}`
                : 'Enter your phone number to get started'
            }
          </p>
        </div>

        {/* Phone Number Step */}
        {step === 'phone' && (
          <div className="px-8 pb-8 space-y-6">
            <div>
              <label htmlFor="phone" className="block text-body-sm font-medium text-high-contrast mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-body-sm">+91</span>
                </div>
                <input
                  type="tel"
                  id="phone"
                  value={formatPhoneNumber(phoneNumber)}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  className="w-full pl-12 pr-4 py-3 border border-medium-contrast rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  maxLength={11}
                  disabled={loading}
                />
              </div>
              <p className="text-caption text-low-contrast mt-1">
                Enter your 10-digit mobile number
              </p>
            </div>

            <button
              onClick={handleSendOTP}
              disabled={loading || phoneNumber.length < 10}
              className="w-full flex items-center justify-center px-4 py-3 bg-gradient-accent text-white font-medium rounded-lg hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
              ) : (
                <Phone className="w-5 h-5 mr-3" />
              )}
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-medium-contrast"></div>
              </div>
              <div className="relative flex justify-center text-body-sm">
                <span className="px-2 bg-medium-contrast text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-medium-contrast rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent mr-3"></div>
              ) : (
                <Mail className="w-5 h-5 mr-3 text-red-500" />
              )}
              <span className="text-high-contrast">
                {loading ? 'Connecting...' : 'Continue with Google'}
              </span>
            </button>
          </div>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <div className="px-8 pb-8 space-y-6">
            <button
              onClick={() => setStep('phone')}
              className="flex items-center text-accent-primary dark:text-accent-primary-light hover:text-accent-primary dark:hover:accent-primary-light transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Change number
            </button>

            {userType === 'admin' && (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <Crown className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-2" />
                  <p className="text-orange-800 dark:text-orange-200 text-body-sm font-medium">
                    Admin Access Detected
                  </p>
                </div>
                <p className="text-orange-700 dark:text-orange-300 text-caption mt-1">
                  You're signing in as an administrator. Please enter the OTP sent to your registered number.
                </p>
              </div>
            )}

            <div>
              <label htmlFor="otp" className="block text-body-sm font-medium text-high-contrast mb-2">
                Enter 6-digit OTP
              </label>
              <input
                type="text"
                id="otp"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 text-center text-2xl font-mono border border-medium-contrast rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                maxLength={6}
                disabled={loading}
                autoComplete="one-time-code"
              />
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={loading || otpCode.length !== 6}
              className={`w-full flex items-center justify-center px-4 py-3 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 ${
                userType === 'admin' 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
              }`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
              ) : userType === 'admin' ? (
                <Shield className="w-5 h-5 mr-3" />
              ) : (
                <CheckCircle className="w-5 h-5 mr-3" />
              )}
              {loading ? 'Verifying...' : userType === 'admin' ? 'Verify Admin Access' : 'Verify Phone'}
            </button>

            <div className="text-center">
              <button
                onClick={handleResendOTP}
                disabled={countdown > 0 || loading}
                className="text-body-sm text-accent-primary dark:text-accent-primary-light hover:text-accent-primary dark:hover:accent-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
              </button>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && verifiedUser && (
          <div className="px-8 pb-8 text-center">
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                verifiedUser.role === 'admin' 
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800'
                  : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              }`}>
                <div className="flex items-center justify-center mb-2">
                  {verifiedUser.role === 'admin' ? (
                    <Crown className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-2" />
                  ) : (
                    <User className="w-6 h-6 text-green-600 dark:text-green-400 mr-2" />
                  )}
                  <span className={`font-medium ${
                    verifiedUser.role === 'admin' 
                      ? 'text-yellow-800 dark:text-yellow-200'
                      : 'text-green-800 dark:text-green-200'
                  }`}>
                    {verifiedUser.role === 'admin' ? 'Administrator' : 'Verified User'}
                  </span>
                </div>
                <p className={`text-body-sm ${
                  verifiedUser.role === 'admin' 
                    ? 'text-yellow-700 dark:text-yellow-300'
                    : 'text-green-700 dark:text-green-300'
                }`}>
                  Welcome, {verifiedUser.name}!
                </p>
              </div>
              
              <div className="animate-pulse">
                <div className="w-8 h-8 bg-accent-primary rounded-full mx-auto"></div>
              </div>
              
              <p className="text-medium-contrast text-body-sm">
                Redirecting you to {verifiedUser.role === 'admin' ? 'admin dashboard' : 'your account'}...
              </p>
            </div>
          </div>
        )}

        {/* Close button */}
        {step !== 'success' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* reCAPTCHA container */}
        <div id="recaptcha-container" className="hidden"></div>
      </div>
    </div>
  );
} 