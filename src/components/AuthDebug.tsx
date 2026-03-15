import React, { useState } from 'react';
import { 
  Chrome, 
  Phone, 
  AlertCircle, 
  CheckCircle, 
  Settings, 
  Key,
  Globe,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { unifiedAuthService } from '../services/firebase/unified-auth.service';
import { auth } from '../lib/firebase';
import { appConfig } from '@/config/appConfig';

export default function AuthDebug() {
  const [loading, setLoading] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setDebugLogs(prev => [...prev, logMessage]);
    console.log(logMessage);
  };

  const clearLogs = () => {
    setDebugLogs([]);
  };

  // Test Firebase Configuration
  const testFirebaseConfig = () => {
    addLog('🔍 Testing Firebase Configuration...');
    
    const config = {
      apiKey: appConfig.firebase.apiKey,
      authDomain: appConfig.firebase.authDomain,
      projectId: appConfig.firebase.projectId,
      storageBucket: appConfig.firebase.storageBucket,
      messagingSenderId: appConfig.firebase.messagingSenderId,
      appId: appConfig.firebase.appId,
    };

    addLog(`🔧 API Key: ${config.apiKey ? '✅ Set' : '❌ Missing'}`);
    addLog(`🔧 Auth Domain: ${config.authDomain ? '✅ Set' : '❌ Missing'}`);
    addLog(`🔧 Project ID: ${config.projectId ? '✅ Set' : '❌ Missing'}`);
    addLog(`🔧 Storage Bucket: ${config.storageBucket ? '✅ Set' : '❌ Missing'}`);
    addLog(`🔧 Messaging Sender ID: ${config.messagingSenderId ? '✅ Set' : '❌ Missing'}`);
    addLog(`🔧 App ID: ${config.appId ? '✅ Set' : '❌ Missing'}`);
    
    if (auth) {
      addLog(`✅ Firebase Auth initialized successfully`);
      addLog(`🔧 Current User: ${auth.currentUser ? auth.currentUser.email || 'Authenticated' : 'Not signed in'}`);
    } else {
      addLog(`❌ Firebase Auth failed to initialize`);
    }

    // Check current domain
    addLog(`🌍 Current Domain: ${window.location.origin}`);
    addLog(`🌍 Auth Domain: ${config.authDomain}`);
  };

  // Test Google Sign In
  const testGoogleSignIn = async () => {
    setLoading(true);
    addLog('🔄 Testing Google Sign In...');
    
    try {
      addLog('📱 Attempting Google authentication...');
      
      const result = await unifiedAuthService.signInWithGoogle();
      
      addLog(`📊 Google Sign In Result: ${JSON.stringify(result, null, 2)}`);
      
      if (result.success) {
        addLog('✅ Google Sign In successful!');
        addLog(`👤 User: ${result.user?.name} (${result.user?.email})`);
        toast.success(result.message);
      } else {
        addLog(`❌ Google Sign In failed: ${result.message}`);
        if (result.error) {
          addLog(`🔍 Error details: ${result.error}`);
        }
        toast.error(result.message);
      }
    } catch (error: any) {
      addLog(`💥 Exception during Google Sign In: ${error.message}`);
      addLog(`🔍 Error code: ${error.code}`);
      addLog(`🔍 Error details: ${JSON.stringify(error, null, 2)}`);
      toast.error('Google Sign In failed');
    } finally {
      setLoading(false);
    }
  };

  // Test Phone OTP
  const testPhoneOTP = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    setLoading(true);
    addLog('🔄 Testing Phone OTP...');

    try {
      addLog(`📱 Sending OTP to: ${phoneNumber}`);
      
      const result = await unifiedAuthService.sendPhoneOTP(phoneNumber);
      
      addLog(`📊 Phone OTP Result: ${JSON.stringify(result, null, 2)}`);
      
      if (result.success) {
        setOtpSent(true);
        addLog('✅ Phone OTP sent successfully!');
        toast.success(result.message);
      } else {
        addLog(`❌ Phone OTP failed: ${result.message}`);
        toast.error(result.message);
      }
    } catch (error: any) {
      addLog(`💥 Exception during Phone OTP: ${error.message}`);
      addLog(`🔍 Error details: ${JSON.stringify(error, null, 2)}`);
      toast.error('Phone OTP failed');
    } finally {
      setLoading(false);
    }
  };

  // Verify Phone OTP
  const verifyPhoneOTP = async () => {
    if (!otpCode.trim()) {
      toast.error('Please enter OTP code');
      return;
    }

    setLoading(true);
    addLog('🔄 Verifying Phone OTP...');

    try {
      const result = await unifiedAuthService.verifyPhoneOTP(otpCode);
      
      addLog(`📊 OTP Verification Result: ${JSON.stringify(result, null, 2)}`);
      
      if (result.success) {
        addLog('✅ Phone OTP verified successfully!');
        toast.success(result.message);
      } else {
        addLog(`❌ Phone OTP verification failed: ${result.message}`);
        toast.error(result.message);
      }
    } catch (error: any) {
      addLog(`💥 Exception during OTP verification: ${error.message}`);
      addLog(`🔍 Error details: ${JSON.stringify(error, null, 2)}`);
      toast.error('OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-medium-contrast rounded-lg shadow-lg">
      <h1 className="text-subtitle font-bold text-high-contrast mb-6 flex items-center">
        <Shield className="w-6 h-6 mr-2" />
        Authentication Debug Center
      </h1>

      {/* Firebase Configuration Test */}
      <div className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
        <h2 className="text-body font-semibold text-high-contrast mb-3 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Firebase Configuration
        </h2>
        <button
          onClick={testFirebaseConfig}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Key className="w-4 h-4 inline mr-2" />
          Test Configuration
        </button>
      </div>

      {/* Google Sign In Test */}
      <div className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
        <h2 className="text-body font-semibold text-high-contrast mb-3 flex items-center">
          <Chrome className="w-5 h-5 mr-2" />
          Google Sign In Test
        </h2>
        <button
          onClick={testGoogleSignIn}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Google Sign In'}
        </button>
      </div>

      {/* Phone Authentication Test */}
      <div className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
        <h2 className="text-body font-semibold text-high-contrast mb-3 flex items-center">
          <Phone className="w-5 h-5 mr-2" />
          Phone Authentication Test
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Phone (6264507878 for admin)"
            className="flex-1 px-3 py-2 border border-medium-contrast rounded-md dark:bg-gray-700 dark:text-white"
            disabled={loading || otpSent}
          />
          <button
            onClick={testPhoneOTP}
            disabled={loading || otpSent}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Send OTP
          </button>
        </div>

        {otpSent && (
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="flex-1 px-3 py-2 border border-medium-contrast rounded-md dark:bg-gray-700 dark:text-white"
              disabled={loading}
            />
            <button
              onClick={verifyPhoneOTP}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              Verify OTP
            </button>
          </div>
        )}
      </div>

      {/* Debug Logs */}
      <div className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-body font-semibold text-high-contrast">Debug Logs</h2>
          <button
            onClick={clearLogs}
            className="px-3 py-1 bg-red-600 text-white text-body-sm rounded-md hover:bg-red-700"
          >
            Clear Logs
          </button>
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-900 rounded-md p-4 max-h-80 overflow-y-auto">
          {debugLogs.length === 0 ? (
            <p className="text-body-sm text-low-contrast">No logs yet. Run a test to see debug information.</p>
          ) : (
            debugLogs.map((log, index) => (
              <div key={index} className="text-caption font-mono text-high-contrast mb-1 break-all">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="text-body font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Common Issues & Solutions
        </h3>
        
        <div className="text-body-sm text-blue-700 dark:text-blue-300 space-y-2">
          <div>
            <strong>🔧 Firebase Environment Variables Missing:</strong>
            <p>Check that all VITE_FIREBASE_* variables are set in your hosting platform (Vercel/Netlify).</p>
          </div>
          
          <div>
            <strong>🌍 Google Sign In Domain Issues:</strong>
            <p>Add your domain to Firebase Console → Authentication → Settings → Authorized domains.</p>
          </div>
          
          <div>
            <strong>🔑 Google Cloud Console Setup:</strong>
            <p>Ensure OAuth 2.0 Client ID is configured with correct authorized origins.</p>
          </div>
          
          <div>
            <strong>📱 Phone Auth reCAPTCHA Issues:</strong>
            <p>Ensure phone authentication is enabled and reCAPTCHA is configured properly.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 