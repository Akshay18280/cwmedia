import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Phone, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { unifiedAuthService } from '../services/firebase/unified-auth.service';

export default function Verify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verified, setVerified] = useState(false);

  // Get phone number from URL params or localStorage
  useEffect(() => {
    const phoneFromUrl = searchParams.get('phone');
    const phoneFromStorage = localStorage.getItem('pendingPhoneAuth');
    const phone = phoneFromUrl || phoneFromStorage || '';
    
    if (!phone) {
      toast.error('No phone verification session found');
      navigate('/');
      return;
    }
    
    setPhoneNumber(phone);
  }, [searchParams, navigate]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const result = await unifiedAuthService.verifyPhoneOTP(otpCode);
      
      if (result.success && result.user) {
        setVerified(true);
        
        if (result.user.role === 'admin') {
          toast.success('Admin access verified! Redirecting to dashboard...');
          setTimeout(() => navigate('/admin/dashboard'), 2000);
        } else {
          toast.success('Phone verified successfully! Welcome!');
          setTimeout(() => navigate('/'), 2000);
        }
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
      const result = await unifiedAuthService.sendPhoneOTP(phoneNumber.replace('+91', ''));
      
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

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      const number = cleaned.slice(2);
      return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
    } else if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
  };

  if (verified) {
    return (
      <div className="min-h-screen bg-high-contrast flex items-center justify-center p-4">
        <div className="bg-medium-contrast rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          
          <h1 className="text-subtitle font-bold text-high-contrast mb-4">
            🎉 Verification Successful!
          </h1>
          
          <p className="text-medium-contrast mb-6">
            Your phone number has been verified successfully. Redirecting you now...
          </p>

          <div className="animate-pulse">
            <div className="w-8 h-8 bg-blue-600 rounded-full mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-high-contrast flex items-center justify-center p-4">
      <div className="bg-medium-contrast rounded-2xl p-8 max-w-md w-full shadow-2xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          
          <h1 className="text-subtitle font-bold text-high-contrast mb-2">
            📱 Verify Your Phone
          </h1>
          
          <p className="text-medium-contrast">
            Enter the 6-digit code sent to
          </p>
          <p className="text-blue-600 dark:text-blue-400 font-medium">
            {formatPhoneNumber(phoneNumber)}
          </p>
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </button>

        {/* OTP Input */}
        <div className="space-y-6">
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
              className="w-full px-4 py-3 text-center text-2xl font-mono border border-medium-contrast rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              maxLength={6}
              disabled={loading}
              autoComplete="one-time-code"
              autoFocus
            />
          </div>

          <button
            onClick={handleVerifyOTP}
            disabled={loading || otpCode.length !== 6}
            className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
            ) : (
              <CheckCircle className="w-5 h-5 mr-3" />
            )}
            {loading ? 'Verifying...' : 'Verify Phone'}
          </button>

          <div className="text-center">
            <p className="text-body-sm text-medium-contrast mb-3">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResendOTP}
              disabled={countdown > 0 || loading}
              className="text-body-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-body-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Having trouble?</p>
              <p>Make sure your phone has network coverage and can receive SMS messages.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 