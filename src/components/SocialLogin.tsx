import React, { useState, useEffect } from 'react';
import { Linkedin, Mail, Phone, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../services/auth';
import PhoneAuthModal from './PhoneAuthModal';

interface SocialLoginProps {
  onLoginSuccess?: (user: any) => void;
  onClose: () => void;
  showAdminLogin?: boolean;
}

export default function SocialLogin({ onLoginSuccess, onClose, showAdminLogin = false }: SocialLoginProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [adminOtpSent, setAdminOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [adminVerified, setAdminVerified] = useState(false);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);

  const handleLinkedInLogin = async () => {
    setLoading('linkedin');
    try {
      const result = await authService.loginWithLinkedIn();
      if (result.success) {
        toast.success('Redirecting to LinkedIn...');
      } else {
        toast.error(result.error || 'LinkedIn login failed');
      }
    } catch (error) {
      console.error('LinkedIn login error:', error);
      toast.error('LinkedIn login failed');
    } finally {
      setLoading(null);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading('google');
    try {
      const result = await authService.loginWithGoogle();
      if (result.success) {
        toast.success('Redirecting to Google...');
      } else {
        toast.error(result.error || 'Google login failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Google login failed');
    } finally {
      setLoading(null);
    }
  };

  const handlePhoneLogin = () => {
    setShowPhoneAuth(true);
  };

  const handlePhoneAuthSuccess = (user: any) => {
    toast.success('Phone verification successful!');
    setShowPhoneAuth(false);
    if (onLoginSuccess) {
      onLoginSuccess(user);
    }
  };

  const handleAdminOTP = async () => {
    setLoading('admin-otp');
    try {
      const result = await authService.generateAdminOTP();
      if (result.success) {
        setAdminOtpSent(true);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Admin OTP error:', error);
      toast.error('Failed to send OTP');
    } finally {
      setLoading(null);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading('verify-otp');
    try {
      const result = await authService.verifyAdminOTP(otpCode);
      if (result.success) {
        setAdminVerified(true);
        toast.success(result.message);
        if (onLoginSuccess) {
          onLoginSuccess({ role: 'admin', phone: '6264507878' });
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error('OTP verification failed');
    } finally {
      setLoading(null);
    }
  };

  if (adminVerified) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Admin Verified!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You now have admin access to manage reviews and content.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {showAdminLogin ? 'Admin Login' : 'Welcome Back!'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {showAdminLogin ? 'Secure admin access' : 'Choose your preferred login method'}
          </p>
        </div>

        {!showAdminLogin && (
          <div className="space-y-4 mb-6">
            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading === 'google'}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'google' ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent mr-3"></div>
              ) : (
                <Mail className="w-5 h-5 mr-3 text-red-500" />
              )}
              <span className="text-gray-700 dark:text-gray-300">
                {loading === 'google' ? 'Connecting...' : 'Continue with Google'}
              </span>
            </button>

            {/* Phone Login */}
            <button
              onClick={handlePhoneLogin}
              disabled={loading === 'phone'}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'phone' ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent mr-3"></div>
              ) : (
                <Phone className="w-5 h-5 mr-3 text-green-500" />
              )}
              <span className="text-gray-700 dark:text-gray-300">
                {loading === 'phone' ? 'Connecting...' : 'Continue with Phone'}
              </span>
            </button>

            {/* LinkedIn Login */}
            <button
              onClick={handleLinkedInLogin}
              disabled={loading === 'linkedin'}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'linkedin' ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
              ) : (
                <Linkedin className="w-5 h-5 mr-3" />
              )}
              {loading === 'linkedin' ? 'Connecting...' : 'Continue with LinkedIn'}
            </button>
          </div>
        )}

        {showAdminLogin && (
          <div className="space-y-4">
            {!adminOtpSent ? (
              <button
                onClick={handleAdminOTP}
                disabled={loading === 'admin-otp'}
                className="w-full flex items-center justify-center px-4 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'admin-otp' ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                ) : (
                  <Shield className="w-5 h-5 mr-3" />
                )}
                Send OTP to +91 6264507878
              </button>
            ) : (
              <div className="space-y-4">
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
                    className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    maxLength={6}
                  />
                </div>
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading === 'verify-otp' || otpCode.length !== 6}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === 'verify-otp' ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                  ) : (
                    <CheckCircle className="w-5 h-5 mr-3" />
                  )}
                  Verify OTP
                </button>
                <button
                  onClick={() => {
                    setAdminOtpSent(false);
                    setOtpCode('');
                  }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Resend OTP
                </button>
              </div>
            )}
          </div>
        )}

        {!showAdminLogin && (
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Phone Auth Modal */}
      <PhoneAuthModal
        isOpen={showPhoneAuth}
        onClose={() => setShowPhoneAuth(false)}
        onSuccess={handlePhoneAuthSuccess}
        title="Phone Verification"
        subtitle="Secure login with your mobile number"
      />
    </>
  );
} 