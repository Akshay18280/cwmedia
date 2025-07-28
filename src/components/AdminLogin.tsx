import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Shield, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { firebaseAuthService } from '../services/firebase/auth.service';
import { ipAuthService } from '../services/firebase/ip-auth.service';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ipAuthChecking, setIpAuthChecking] = useState(true);
  const [ipAuthResult, setIpAuthResult] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkIPAuthentication();
  }, []);

  const checkIPAuthentication = async () => {
    try {
      setIpAuthChecking(true);
      
      // First check if already IP authenticated
      const existingIPAuth = ipAuthService.isIPAuthenticated();
      if (existingIPAuth) {
        toast.success('Welcome back! Auto-authenticated via IP address.');
        navigate('/admin/dashboard');
        return;
      }

      // Check if current IP is authorized
      const ipResult = await ipAuthService.authenticateByIP();
      
      if (ipResult.success) {
        toast.success(ipResult.message);
        navigate('/admin/dashboard');
      } else {
        setIpAuthResult(ipResult.message);
        // IP auth failed, show regular login form
      }
    } catch (error) {
      console.error('IP authentication check failed:', error);
      setIpAuthResult('IP authentication unavailable');
    } finally {
      setIpAuthChecking(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const result = await firebaseAuthService.signInWithEmail(email, password);
      
      if (result.success && result.user) {
        toast.success('Login successful!');
        navigate('/admin/dashboard');
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }

    try {
      const result = await firebaseAuthService.sendPasswordReset(email);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('Failed to send password reset email');
    }
  };

  // Show loading spinner while checking IP authentication
  if (ipAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-high-contrast font-medium">Checking authentication...</p>
          <p className="text-medium-contrast text-body-sm mt-2">Verifying IP-based access</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-high-contrast">
            Admin Login
          </h2>
          <p className="mt-2 text-body-sm text-medium-contrast">
            Sign in to access the admin dashboard
          </p>
          
          {/* IP Authentication Status */}
          {ipAuthResult && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center justify-center space-x-2">
                <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <p className="text-body-sm text-amber-800 dark:text-amber-200">
                  {ipAuthResult}
                </p>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Please use email/password authentication
              </p>
            </div>
          )}
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-body-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="relative block w-full pl-10 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-body-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 h-5 w-5 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-body-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Forgot your password?
            </button>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-body-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Sign in</span>
                </div>
              )}
            </button>
          </div>

          {/* IP Authentication Info */}
          <div className="text-center">
            <p className="text-xs text-medium-contrast">
              Authorized IP addresses are automatically authenticated
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}