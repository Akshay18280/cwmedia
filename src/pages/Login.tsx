import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Phone, Mail, Shield, CheckCircle, ArrowLeft, User, Chrome, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { unifiedAuthService } from '../services/firebase/unified-auth.service';
import { firebaseAuthService } from '../services/firebase/auth.service';
import { useAuth } from '../contexts/AuthContext';
import { ModernButton } from '../components/ModernDesignSystem';

type AuthStep = 'method' | 'phone' | 'otp' | 'success';

export default function Login() {
  const [step, setStep] = useState<AuthStep>('method');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verifiedUser, setVerifiedUser] = useState<any>(null);
  const [rememberMe, setRememberMe] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, signInWithGoogle } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      const from = location.state?.from?.pathname || '/';
      navigate(from);
    }
  }, [currentUser, navigate, location]);

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

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      const result = await unifiedAuthService.sendPhoneOTP(phoneNumber);
      
      if (result.success) {
        toast.success(result.message);
        setStep('otp');
        setCountdown(60);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Phone verification error:', error);
      toast.error('Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      toast.error('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      const result = await unifiedAuthService.verifyPhoneOTP(otpCode);
      
      if (result.success && result.user) {
        setVerifiedUser(result.user);
        setStep('success');
        toast.success('Phone verified successfully!');
        
        // Redirect after a short delay
        setTimeout(() => {
          const from = location.state?.from?.pathname || '/';
          navigate(from);
        }, 1500);
      } else {
        toast.error(result.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error('Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const success = await signInWithGoogle(rememberMe);

      if (success) {
        toast.success('Signed in successfully!');
        const from = location.state?.from?.pathname || '/';
        navigate(from);
      }
      // Error toasts are now shown inside signInWithGoogle
    } catch (error) {
      console.error('Google sign in error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    try {
      const result = await unifiedAuthService.sendPhoneOTP(phoneNumber);
      
      if (result.success) {
        toast.success('Verification code resent!');
        setCountdown(60);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error('Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const renderMethodSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome Back
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Choose your preferred sign-in method
        </p>
      </div>

      {/* Google Sign In */}
      <ModernButton
        variant="glass"
        intent="secondary"
        size="lg"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        <Chrome className="w-5 h-5 mr-3" />
        Continue with Google
      </ModernButton>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
            Or continue with phone
          </span>
        </div>
      </div>

      {/* Phone Number Form */}
      <form onSubmit={handlePhoneSubmit} className="space-y-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              disabled={loading}
            />
          </div>
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Remember me
            </label>
          </div>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3 mr-1" />
            <span>{rememberMe ? '30 days' : '24 hours'}</span>
          </div>
        </div>

        <ModernButton
          type="submit"
          variant="default"
          intent="primary"
          size="lg"
          className="w-full"
          disabled={loading || !phoneNumber.trim()}
          loading={loading}
        >
          Send Verification Code
        </ModernButton>
      </form>

      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{' '}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
        >
          Sign up with Google
        </button>
      </div>
    </div>
  );

  const renderOTPVerification = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Verify Your Phone
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          We sent a verification code to
        </p>
        <p className="font-medium text-gray-900 dark:text-white">
          {phoneNumber}
        </p>
      </div>

      <form onSubmit={handleOTPSubmit} className="space-y-4">
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Verification Code
          </label>
          <input
            id="otp"
            type="text"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center text-2xl font-mono tracking-widest"
            maxLength={6}
            autoComplete="one-time-code"
            disabled={loading}
          />
        </div>

        <ModernButton
          type="submit"
          variant="default"
          intent="primary"
          size="lg"
          className="w-full"
          disabled={loading || otpCode.length !== 6}
          loading={loading}
        >
          Verify Code
        </ModernButton>
      </form>

      <div className="text-center">
        {countdown > 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Resend code in {countdown} seconds
          </p>
        ) : (
          <button
            onClick={handleResendOTP}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50"
          >
            Resend verification code
          </button>
        )}
      </div>

      <button
        onClick={() => setStep('method')}
        className="flex items-center justify-center w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to sign-in options
      </button>
    </div>
  );

  const renderSuccess = () => (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
      </div>
      
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome!
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          You've been successfully signed in
        </p>
        {verifiedUser && (
          <p className="font-medium text-gray-900 dark:text-white mt-2">
            Hello, {verifiedUser.name}!
          </p>
        )}
      </div>

      <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <span>Redirecting...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          {step === 'method' && renderMethodSelection()}
          {step === 'otp' && renderOTPVerification()}
          {step === 'success' && renderSuccess()}
        </div>
        
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 