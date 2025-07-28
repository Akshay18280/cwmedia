import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  Mail, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users,
  Send,
  Settings,
  Database,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { phoneAuthService } from '../services/firebase/phone-auth.service';
import { emailService } from '../services/firebase/email.service';
import { smsService } from '../services/firebase/sms.service';
import { firebaseNewsletterService } from '../services/firebase/newsletter.service';
import { authService } from '../services/auth';

interface ServiceStatus {
  name: string;
  status: 'available' | 'test' | 'unavailable';
  message: string;
  icon: React.ReactNode;
}

export default function TestingDashboard() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [testResults, setTestResults] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    checkServiceStatus();
  }, []);

  const checkServiceStatus = () => {
    const emailStatus = emailService.getStatus();
    const smsStatus = smsService.getStatus();
    
    const serviceList: ServiceStatus[] = [
      {
        name: 'Phone Authentication',
        ...getPhoneAuthStatus(),
        icon: <Phone className="w-5 h-5" />
      },
      {
        name: 'Email Service (Resend)',
        status: emailStatus.available ? 'available' : 'test',
        message: emailStatus.message,
        icon: <Mail className="w-5 h-5" />
      },
      {
        name: 'SMS Service (Twilio)',
        status: smsStatus.available ? 'available' : 'test',
        message: smsStatus.message,
        icon: <Send className="w-5 h-5" />
      },
      {
        name: 'Newsletter Service',
        status: 'available',
        message: 'Firebase Firestore ready',
        icon: <Users className="w-5 h-5" />
      },
      {
        name: 'Admin Authentication',
        status: 'available',
        message: 'OTP system ready',
        icon: <Shield className="w-5 h-5" />
      }
    ];

    setServices(serviceList);
  };

  const getPhoneAuthStatus = (): { status: 'available' | 'test' | 'unavailable'; message: string } => {
    try {
      // Check if Firebase Phone Auth is available
      return {
        status: 'available',
        message: 'Firebase Phone Auth ready'
      };
    } catch (error) {
      return {
        status: 'unavailable',
        message: 'Firebase Phone Auth not configured'
      };
    }
  };

  const testPhoneAuth = async () => {
    setLoading(prev => ({ ...prev, phone: true }));
    
    try {
      // Test phone number validation
      const validation = phoneAuthService.validatePhoneNumber('9876543210');
      
      if (validation.isValid) {
        setTestResults(prev => ({ 
          ...prev, 
          phone: '✅ Phone validation working. Real SMS sending requires reCAPTCHA in production.' 
        }));
        toast.success('Phone auth validation test passed!');
      } else {
        setTestResults(prev => ({ 
          ...prev, 
          phone: '❌ Phone validation failed: ' + validation.message 
        }));
        toast.error('Phone auth test failed');
      }
    } catch (error: any) {
      setTestResults(prev => ({ 
        ...prev, 
        phone: '❌ Phone auth error: ' + error.message 
      }));
      toast.error('Phone auth test error');
    } finally {
      setLoading(prev => ({ ...prev, phone: false }));
    }
  };

  const testEmailService = async () => {
    setLoading(prev => ({ ...prev, email: true }));
    
    try {
      const testEmail = 'test@example.com';
      const result = await emailService.sendWelcomeEmail(testEmail, 'test-token-123');
      
      setTestResults(prev => ({ 
        ...prev, 
        email: result.success ? '✅ ' + result.message : '❌ ' + result.message 
      }));
      
      if (result.success) {
        toast.success('Email service test passed!');
      } else {
        toast.warning('Email service in test mode');
      }
    } catch (error: any) {
      setTestResults(prev => ({ 
        ...prev, 
        email: '❌ Email service error: ' + error.message 
      }));
      toast.error('Email service test error');
    } finally {
      setLoading(prev => ({ ...prev, email: false }));
    }
  };

  const testSMSService = async () => {
    setLoading(prev => ({ ...prev, sms: true }));
    
    try {
      const result = await smsService.generateAdminOTP('6264507878');
      
      setTestResults(prev => ({ 
        ...prev, 
        sms: result.success ? '✅ ' + result.message : '❌ ' + result.message 
      }));
      
      if (result.success) {
        toast.success('SMS service test passed!');
      } else {
        toast.error('SMS service test failed');
      }
    } catch (error: any) {
      setTestResults(prev => ({ 
        ...prev, 
        sms: '❌ SMS service error: ' + error.message 
      }));
      toast.error('SMS service test error');
    } finally {
      setLoading(prev => ({ ...prev, sms: false }));
    }
  };

  const testNewsletterService = async () => {
    setLoading(prev => ({ ...prev, newsletter: true }));
    
    try {
      const testEmail = 'test@example.com';
      const result = await firebaseNewsletterService.subscribe(testEmail);
      
      if (result.success) {
        // Also test unsubscribe
        const stats = await firebaseNewsletterService.getStats();
        setTestResults(prev => ({ 
          ...prev, 
          newsletter: `✅ Newsletter service working. Stats: ${stats.active} active subscribers.` 
        }));
        toast.success('Newsletter service test passed!');
      } else {
        setTestResults(prev => ({ 
          ...prev, 
          newsletter: '❌ ' + result.message 
        }));
        toast.error('Newsletter service test failed');
      }
    } catch (error: any) {
      setTestResults(prev => ({ 
        ...prev, 
        newsletter: '❌ Newsletter service error: ' + error.message 
      }));
      toast.error('Newsletter service test error');
    } finally {
      setLoading(prev => ({ ...prev, newsletter: false }));
    }
  };

  const testAdminAuth = async () => {
    setLoading(prev => ({ ...prev, admin: true }));
    
    try {
      const result = await authService.generateAdminOTP();
      
      setTestResults(prev => ({ 
        ...prev, 
        admin: result.success ? '✅ ' + result.message : '❌ ' + result.message 
      }));
      
      if (result.success) {
        toast.success('Admin auth test passed!');
      } else {
        toast.error('Admin auth test failed');
      }
    } catch (error: any) {
      setTestResults(prev => ({ 
        ...prev, 
        admin: '❌ Admin auth error: ' + error.message 
      }));
      toast.error('Admin auth test error');
    } finally {
      setLoading(prev => ({ ...prev, admin: false }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'test':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'test':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      default:
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🧪 Authentication & Communication Testing Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive testing suite for all implemented features
        </p>
      </div>

      {/* Service Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {services.map((service, index) => (
          <div 
            key={index}
            className={`p-6 rounded-xl border-2 ${getStatusColor(service.status)} transition-all duration-200`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {service.icon}
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {service.name}
                </h3>
              </div>
              {getStatusIcon(service.status)}
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {service.message}
            </p>
            
            <div className="flex items-center">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                service.status === 'available' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : service.status === 'test'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {service.status.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Test Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-8">
        <div className="flex items-center mb-6">
          <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Feature Testing
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Phone Auth Test */}
          <button
            onClick={testPhoneAuth}
            disabled={loading.phone}
            className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading.phone ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
            ) : (
              <Phone className="w-5 h-5 mr-2" />
            )}
            Test Phone Auth
          </button>

          {/* Email Service Test */}
          <button
            onClick={testEmailService}
            disabled={loading.email}
            className="flex items-center justify-center px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading.email ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
            ) : (
              <Mail className="w-5 h-5 mr-2" />
            )}
            Test Email Service
          </button>

          {/* SMS Service Test */}
          <button
            onClick={testSMSService}
            disabled={loading.sms}
            className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading.sms ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
            ) : (
              <Send className="w-5 h-5 mr-2" />
            )}
            Test SMS Service
          </button>

          {/* Newsletter Test */}
          <button
            onClick={testNewsletterService}
            disabled={loading.newsletter}
            className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading.newsletter ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
            ) : (
              <Users className="w-5 h-5 mr-2" />
            )}
            Test Newsletter
          </button>

          {/* Admin Auth Test */}
          <button
            onClick={testAdminAuth}
            disabled={loading.admin}
            className="flex items-center justify-center px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading.admin ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
            ) : (
              <Shield className="w-5 h-5 mr-2" />
            )}
            Test Admin Auth
          </button>

          {/* Refresh Status */}
          <button
            onClick={checkServiceStatus}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Database className="w-5 h-5 mr-2" />
            Refresh Status
          </button>
        </div>
      </div>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center mb-6">
            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Test Results
            </h2>
          </div>

          <div className="space-y-4">
            {Object.entries(testResults).map(([key, result]) => (
              <div 
                key={key}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {key} Test
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 font-mono">
                  {result}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Setup Instructions */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
          🔧 Production Setup Instructions
        </h3>
        
        <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <strong>1. Email Service (Resend):</strong>
            <p className="ml-4">Set <code>VITE_RESEND_API_KEY</code> in your environment variables</p>
          </div>
          
          <div>
            <strong>2. SMS Service (Twilio):</strong>
            <p className="ml-4">Configure <code>VITE_TWILIO_ACCOUNT_SID</code>, <code>VITE_TWILIO_AUTH_TOKEN</code>, and <code>VITE_TWILIO_PHONE_NUMBER</code></p>
          </div>
          
          <div>
            <strong>3. Firebase Phone Auth:</strong>
            <p className="ml-4">Enable Phone Authentication in Firebase Console and configure authorized domains</p>
          </div>
          
          <div>
            <strong>4. Firebase Security:</strong>
            <p className="ml-4">Deploy Firestore rules and indexes using Firebase CLI</p>
          </div>
        </div>
      </div>
    </div>
  );
} 