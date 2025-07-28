import React, { useState } from 'react';
import { Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { unifiedAuthService } from '../services/firebase/unified-auth.service';

export default function PhoneAuthDebug() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    setLoading(true);
    setDebugLogs([]);
    addLog('🔄 Starting phone OTP process...');

    try {
      addLog(`📱 Attempting to send OTP to: ${phoneNumber}`);
      
      const result = await unifiedAuthService.sendPhoneOTP(phoneNumber);
      
      addLog(`📊 OTP Send Result: ${JSON.stringify(result)}`);
      
      if (result.success) {
        setOtpSent(true);
        addLog('✅ OTP sent successfully');
        toast.success(result.message);
      } else {
        addLog(`❌ OTP send failed: ${result.message}`);
        toast.error(result.message);
      }
    } catch (error: any) {
      addLog(`💥 Exception during OTP send: ${error.message}`);
      addLog(`🔍 Error details: ${JSON.stringify(error)}`);
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode.trim()) {
      toast.error('Please enter the OTP code');
      return;
    }

    setLoading(true);
    addLog('🔄 Starting OTP verification...');

    try {
      addLog(`🔢 Attempting to verify OTP: ${otpCode}`);
      
      const result = await unifiedAuthService.verifyPhoneOTP(otpCode);
      
      addLog(`📊 OTP Verify Result: ${JSON.stringify(result)}`);
      
      if (result.success) {
        addLog('✅ OTP verified successfully');
        addLog(`👤 User details: ${JSON.stringify(result.user)}`);
        toast.success(result.message);
      } else {
        addLog(`❌ OTP verification failed: ${result.message}`);
        toast.error(result.message);
      }
    } catch (error: any) {
      addLog(`💥 Exception during OTP verification: ${error.message}`);
      addLog(`🔍 Error details: ${JSON.stringify(error)}`);
      toast.error('Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setDebugLogs([]);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        <Phone className="w-5 h-5 mr-2" />
        Phone Authentication Debug
      </h2>

      {/* Phone Number Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Phone Number (without +91)
        </label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="6264507878"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          disabled={loading || otpSent}
        />
      </div>

      {/* Send OTP Button */}
      <button
        onClick={handleSendOTP}
        disabled={loading || otpSent}
        className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Sending...' : 'Send OTP'}
      </button>

      {/* OTP Input */}
      {otpSent && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enter OTP Code
          </label>
          <input
            type="text"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder="123456"
            maxLength={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={loading}
          />
        </div>
      )}

      {/* Verify OTP Button */}
      {otpSent && (
        <button
          onClick={handleVerifyOTP}
          disabled={loading}
          className="w-full mb-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>
      )}

      {/* Reset Button */}
      <button
        onClick={() => {
          setOtpSent(false);
          setOtpCode('');
          setPhoneNumber('');
          clearLogs();
        }}
        className="w-full mb-6 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
      >
        Reset
      </button>

      {/* Debug Logs */}
      <div className="bg-gray-100 dark:bg-gray-900 rounded-md p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Debug Logs</h3>
          <button
            onClick={clearLogs}
            className="text-xs px-2 py-1 bg-red-600 text-white rounded"
          >
            Clear
          </button>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {debugLogs.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No logs yet...</p>
          ) : (
            debugLogs.map((log, index) => (
              <div key={index} className="text-xs font-mono text-gray-700 dark:text-gray-300 mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          <AlertCircle className="w-4 h-4 inline mr-1" />
          Testing Instructions
        </h4>
        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <li>• For admin: Use phone number 6264507878</li>
          <li>• For regular user: Use any other 10-digit number</li>
          <li>• Check browser console for detailed Firebase errors</li>
          <li>• Check Network tab for Firestore API calls</li>
        </ul>
      </div>
    </div>
  );
} 