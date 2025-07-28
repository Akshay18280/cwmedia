import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Phone, Mail, Shield, CheckCircle, ArrowLeft, User, Chrome } from 'lucide-react';
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
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();

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
      const result = await firebaseAuthService.loginWithGoogle();
      
      if (result.success && result.user) {
        toast.success('Successfully signed in with Google!');
        const from = location.state?.from?.pathname || '/';
        navigate(from);
      } else {
        toast.error(result.error || 'Failed to sign in with Google');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      toast.error('An unexpected error occurred');
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
      toast.error('Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  const resetToMethodSelection = () => {
    setStep('method');
    setPhoneNumber('');
    setOtpCode('');
    setCountdown(0);
    setVerifiedUser(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-flow rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-lg">C</span>
            </div>
            <span className="text-xl font-bold text-gradient-flow">Carelwave Media</span>
          </Link>
          
          <h2 className="text-3xl font-extrabold text-high-contrast">
            Welcome Back
          </h2>
          <p className="mt-2 text-body text-medium-contrast">
            Sign in to your account to continue
          </p>
        </div>

        {/* Method Selection */}
        {step === 'method' && (
          <div className="space-y-6">
            <div className="space-y-4">
              {/* Google Sign In */}
                             <ModernButton
                 variant="glass"
                 intent="secondary"
                size="lg"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full justify-center"
              >
                <Chrome className="w-5 h-5 mr-3" />
                Continue with Google
              </ModernButton>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-medium-contrast" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900 text-medium-contrast">
                    or
                  </span>
                </div>
              </div>

              {/* Phone Number Sign In */}
              <ModernButton
                variant="default"
                intent="primary"
                size="lg"
                onClick={() => setStep('phone')}
                className="w-full justify-center"
              >
                <Phone className="w-5 h-5 mr-3" />
                Continue with Phone
              </ModernButton>
            </div>

            {/* Admin Login Link */}
            <div className="text-center">
              <Link
                to="/admin/login"
                className="text-body-sm text-medium-contrast hover:text-high-contrast transition-colors"
              >
                Are you an admin? <span className="font-medium text-blue-600 hover:text-blue-500">Sign in here</span>
              </Link>
            </div>
          </div>
        )}

        {/* Phone Number Step */}
        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <button
                type="button"
                onClick={resetToMethodSelection}
                className="p-2 text-medium-contrast hover:text-high-contrast transition-colors rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-semibold text-high-contrast">Enter Phone Number</h3>
            </div>

            <div>
              <label htmlFor="phone" className="sr-only">
                Phone number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  className="relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-body dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  placeholder="Enter your phone number (+1234567890)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>

            <ModernButton
              type="submit"
              variant="default"
              intent="primary"
              size="lg"
              disabled={loading}
              className="w-full justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <Phone className="w-5 h-5 mr-2" />
                  Send Verification Code
                </>
              )}
            </ModernButton>

            <p className="text-xs text-medium-contrast text-center">
              We'll send you a verification code to confirm your phone number
            </p>
          </form>
        )}

        {/* OTP Verification Step */}
        {step === 'otp' && (
          <form onSubmit={handleOTPSubmit} className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="p-2 text-medium-contrast hover:text-high-contrast transition-colors rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-semibold text-high-contrast">Enter Verification Code</h3>
            </div>

            <div className="text-center mb-6">
              <p className="text-body text-medium-contrast">
                We sent a code to <span className="font-medium text-high-contrast">{phoneNumber}</span>
              </p>
            </div>

            <div>
              <label htmlFor="otp" className="sr-only">
                Verification code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                maxLength={6}
                className="block w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white tracking-widest"
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>

            <ModernButton
              type="submit"
              variant="default"
              intent="primary"
              size="lg"
              disabled={loading || otpCode.length !== 6}
              className="w-full justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Verify Code
                </>
              )}
            </ModernButton>

            {/* Resend Code */}
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-body-sm text-medium-contrast">
                  Resend code in {countdown} seconds
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-body-sm text-blue-600 hover:text-blue-500 transition-colors font-medium"
                >
                  Resend verification code
                </button>
              )}
            </div>
          </form>
        )}

        {/* Success Step */}
        {step === 'success' && verifiedUser && (
          <div className="text-center space-y-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-high-contrast mb-2">
                Welcome, {verifiedUser.displayName || 'User'}!
              </h3>
              <p className="text-body text-medium-contrast">
                Your phone number has been verified successfully.
              </p>
            </div>

            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mx-auto"></div>
            <p className="text-body-sm text-medium-contrast">
              Redirecting you now...
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-low-contrast">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 