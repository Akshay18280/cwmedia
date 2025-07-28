import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Phone, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { phoneAuthService } from '../services/firebase/phone-auth.service';

export default function Verify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  useEffect(() => {
    // Get phone number from URL params or localStorage
    const urlPhone = searchParams.get('phone');
    const storedPhone = localStorage.getItem('pendingPhoneAuth');
    
    if (urlPhone) {
      setPhoneNumber(urlPhone);
    } else if (storedPhone) {
      setPhoneNumber(storedPhone);
    } else {
      // No phone number found, redirect to login
      navigate('/login');
      return;
    }

    // Start countdown timer
    setCountdown(60);
  }, [searchParams, navigate]);

  // Countdown timer effect
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
      const result = await phoneAuthService.verifyOTP(otpCode);
      
      if (result.success && result.user) {
        setVerificationSuccess(true);
        toast.success(result.message);
        
        // Store user info and redirect
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        
        // Redirect after showing success state
        setTimeout(() => {
          const redirectTo = searchParams.get('redirect') || '/';
          navigate(redirectTo);
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

  const handleResendOTP = async () => {
    if (countdown > 0 || !phoneNumber) return;

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

  const formatPhoneNumber = (phone: string) => {
    if (phone.startsWith('+91')) {
      const number = phone.replace('+91', '');
      return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
    }
    return phone;
  };

  if (verificationSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Verification Successful! 🎉
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your phone number has been verified successfully. Redirecting you to your account...
          </p>
          
          <div className="animate-pulse flex justify-center">
            <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Phone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Verify Your Phone
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400">
            We've sent a 6-digit code to
          </p>
          <p className="text-gray-900 dark:text-white font-medium">
            {formatPhoneNumber(phoneNumber)}
          </p>
        </div>

        {/* OTP Input */}
        <div className="space-y-6">
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
              autoComplete="one-time-code"
            />
          </div>

          <button
            onClick={handleVerifyOTP}
            disabled={loading || otpCode.length !== 6}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
            ) : (
              <CheckCircle className="w-5 h-5 mr-3" />
            )}
            {loading ? 'Verifying...' : 'Verify Phone'}
          </button>

          {/* Resend OTP */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResendOTP}
              disabled={countdown > 0 || loading}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
            </button>
          </div>

          {/* Back to login */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center justify-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors mx-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Login
            </button>
          </div>
        </div>

        {/* reCAPTCHA container */}
        <div id="recaptcha-container" className="hidden"></div>
      </div>
    </div>
  );
} 