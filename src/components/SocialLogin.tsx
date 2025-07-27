import React, { useState } from 'react';
import { User, Building2, Linkedin, Mail, Shield, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../services/auth';

interface SocialLoginProps {
  onLoginSuccess?: (user: { role?: string; phone?: string }) => void;
  onClose?: () => void;
  showAdminLogin?: boolean;
}

export default function SocialLogin({ onLoginSuccess, onClose, showAdminLogin = false }: SocialLoginProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [adminOtpSent, setAdminOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [adminVerified, setAdminVerified] = useState(false);

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
          onLoginSuccess({ role: 'admin', phone: '62624507878' });
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
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-auto shadow-2xl">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {showAdminLogin ? 'Admin Login' : 'Sign In to Continue'}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {showAdminLogin 
            ? 'Verify your identity to access admin features'
            : 'Connect with your professional profile to submit reviews'
          }
        </p>
      </div>

      <div className="space-y-4">
        {!showAdminLogin && (
          <>
            {/* LinkedIn Login */}
            <button
              onClick={handleLinkedInLogin}
              disabled={loading === 'linkedin'}
              className="w-full flex items-center justify-center px-4 py-3 border-2 border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'linkedin' ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-3"></div>
              ) : (
                <Linkedin className="w-5 h-5 mr-3" />
              )}
              Continue with LinkedIn
            </button>

            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading === 'google'}
              className="w-full flex items-center justify-center px-4 py-3 border-2 border-red-500 text-red-500 font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'google' ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-500 border-t-transparent mr-3"></div>
              ) : (
                <Mail className="w-5 h-5 mr-3" />
              )}
              Continue with Google
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Professional profiles only</span>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
                <div className="text-sm">
                  <p className="text-blue-800 dark:text-blue-200 font-medium mb-1">
                    Why we need your professional profile:
                  </p>
                  <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Verify your company and position</li>
                    <li>• Ensure authentic reviews</li>
                    <li>• Display credible testimonials</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
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
                Send OTP to +91 62624507878
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
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="mt-6 w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  );
} 