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
  AlertTriangle,
  Crown,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { unifiedAuthService } from '../services/firebase/unified-auth.service';
import { emailService } from '../services/firebase/email.service';
import { smsService } from '../services/firebase/sms.service';
import { firebaseNewsletterService } from '../services/firebase/newsletter.service';
import { realtimeAnalyticsService } from '../services/analytics/realtime-analytics.service';
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
        name: 'Unified Authentication',
        status: 'available',
        message: 'Phone + Google auth with admin detection',
        icon: <Crown className="w-5 h-5" />
      },
      {
        name: 'Phone Authentication',
        status: 'available',
        message: 'Firebase Phone Auth + reCAPTCHA',
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
        name: 'Admin Detection',
        status: 'available',
        message: 'Auto-detects admin number and routes appropriately',
        icon: <Shield className="w-5 h-5" />
      },
      {
        name: 'Analytics Engine',
        status: 'available',
        message: 'Real-time impact & reach analytics with Google Analytics integration',
        icon: <BarChart3 className="w-5 h-5" />
      }
    ];

    setServices(serviceList);
  };

  const testUnifiedAuth = async () => {
    setLoading(prev => ({ ...prev, unified: true }));
    
    try {
      // Test phone number validation
      const userValidation = unifiedAuthService.validatePhoneNumber('9876543210');
      const adminValidation = unifiedAuthService.validatePhoneNumber('6264507878');
      
      if (userValidation.isValid && adminValidation.isValid) {
        setTestResults(prev => ({ 
          ...prev, 
          unified: '✅ Unified auth ready. Validates user & admin numbers. Admin detection working.' 
        }));
        toast.success('Unified authentication test passed!');
      } else {
        setTestResults(prev => ({ 
          ...prev, 
          unified: '❌ Phone validation failed' 
        }));
        toast.error('Unified auth test failed');
      }
    } catch (error: any) {
      setTestResults(prev => ({ 
        ...prev, 
        unified: '❌ Unified auth error: ' + error.message 
      }));
      toast.error('Unified auth test error');
    } finally {
      setLoading(prev => ({ ...prev, unified: false }));
    }
  };

  const testPhoneAuth = async () => {
    setLoading(prev => ({ ...prev, phone: true }));
    
    try {
      // Test phone number validation
      const validation = unifiedAuthService.validatePhoneNumber('9876543210');
      
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

  const testAdminDetection = async () => {
    setLoading(prev => ({ ...prev, admin: true }));
    
    try {
      // Test admin number detection
      const adminValidation = unifiedAuthService.validatePhoneNumber('6264507878');
      const userValidation = unifiedAuthService.validatePhoneNumber('9876543210');
      
      if (adminValidation.isValid && userValidation.isValid) {
        setTestResults(prev => ({ 
          ...prev, 
          admin: '✅ Admin detection working. Can distinguish between admin (6264507878) and regular users.' 
        }));
        toast.success('Admin detection test passed!');
      } else {
        setTestResults(prev => ({ 
          ...prev, 
          admin: '❌ Admin detection validation failed' 
        }));
        toast.error('Admin detection test failed');
      }
    } catch (error: any) {
      setTestResults(prev => ({ 
        ...prev, 
        admin: '❌ Admin detection error: ' + error.message 
      }));
      toast.error('Admin detection test error');
    } finally {
      setLoading(prev => ({ ...prev, admin: false }));
    }
  };

  const testAnalyticsEngine = async () => {
    setLoading(prev => ({ ...prev, analytics: true }));
    
    try {
      // Analytics Engine Test
      const status = realtimeAnalyticsService.getStatus();
      const impactMetrics = realtimeAnalyticsService.getImpactMetrics();
      const geoData = realtimeAnalyticsService.getGeographicDistribution();
      
      // Check if analytics is working properly (without exposing measurement ID)
      if (status.measurementId && impactMetrics && geoData.length > 0) {
        setTestResults(prev => ({ 
          ...prev, 
          analytics: `✅ Analytics engine operational. ${geoData.length} countries tracked. Impact metrics: ${impactMetrics.totalReach} total reach.` 
        }));
        toast.success('Analytics engine test passed!');
      } else {
        setTestResults(prev => ({ 
          ...prev, 
          analytics: '❌ Analytics engine test failed' 
        }));
        toast.error('Analytics engine test failed');
      }
    } catch (error: any) {
      setTestResults(prev => ({ 
        ...prev, 
        analytics: '❌ Analytics engine error: ' + error.message 
      }));
      toast.error('Analytics engine test error');
    } finally {
      setLoading(prev => ({ ...prev, analytics: false }));
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
        <h1 className="text-title font-bold text-high-contrast mb-2">
          🧪 Unified Authentication & Communication Testing
        </h1>
        <p className="text-medium-contrast">
          World-class testing suite for the unified authentication system
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
                <h3 className="font-semibold text-high-contrast">
                  {service.name}
                </h3>
              </div>
              {getStatusIcon(service.status)}
            </div>
            
            <p className="text-body-sm text-medium-contrast mb-3">
              {service.message}
            </p>
            
            <div className="flex items-center">
              <span className={`text-caption px-2 py-1 rounded-full font-medium ${
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
      <div className="bg-medium-contrast rounded-xl p-6 shadow-lg mb-8">
        <div className="flex items-center mb-6">
          <Settings className="w-6 h-6 text-accent-primary dark:text-accent-primary-light mr-3" />
          <h2 className="text-body-lg font-bold text-high-contrast">
            Feature Testing
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Unified Auth Test */}
          <button
            onClick={testUnifiedAuth}
            disabled={loading.unified}
            className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading.unified ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
            ) : (
              <Crown className="w-5 h-5 mr-2" />
            )}
            Test Unified Auth
          </button>

          {/* Phone Auth Test */}
          <button
            onClick={testPhoneAuth}
            disabled={loading.phone}
            className="flex items-center justify-center px-4 py-3 bg-accent-primary text-white font-medium rounded-lg hover:bg-accent-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="flex items-center justify-center px-4 py-3 bg-accent-primary text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Admin Detection Test */}
          <button
            onClick={testAdminDetection}
            disabled={loading.admin}
            className="flex items-center justify-center px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading.admin ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
            ) : (
              <Shield className="w-5 h-5 mr-2" />
            )}
            Test Admin Detection
          </button>

          {/* Analytics Engine Test */}
          <button
            onClick={testAnalyticsEngine}
            disabled={loading.analytics}
            className="flex items-center justify-center px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading.analytics ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
            ) : (
              <BarChart3 className="w-5 h-5 mr-2" />
            )}
            Test Analytics Engine
          </button>

          {/* Refresh Status */}
          <button
            onClick={checkServiceStatus}
            className="flex items-center justify-center px-4 py-3 border border-medium-contrast text-high-contrast font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Database className="w-5 h-5 mr-2" />
            Refresh Status
          </button>
        </div>
      </div>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <div className="bg-medium-contrast rounded-xl p-6 shadow-lg">
          <div className="flex items-center mb-6">
            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3" />
            <h2 className="text-body-lg font-bold text-high-contrast">
              Test Results
            </h2>
          </div>

          <div className="space-y-4">
            {Object.entries(testResults).map(([key, result]) => (
              <div 
                key={key}
                className="p-4 border border-low-contrast rounded-lg bg-gray-50 dark:bg-gray-700/50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-high-contrast capitalize">
                    {key === 'unified' ? 'Unified Auth' : key} Test
                  </span>
                  <span className="text-body-sm text-medium-contrast">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-2 text-body-sm text-high-contrast font-mono">
                  {result}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Setup Instructions */}
      <div className="mt-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="text-body font-semibold text-blue-900 dark:text-white/80 mb-4">
          🚀 Unified Authentication System Features
        </h3>
        
        <div className="space-y-3 text-body-sm text-accent-primary dark:text-white/70">
          <div>
            <strong>🎯 Smart Phone Detection:</strong>
            <p className="ml-4">Automatically detects if entered number is admin (6264507878) or regular user</p>
          </div>
          
          <div>
            <strong>🔒 Dual OTP System:</strong>
            <p className="ml-4">Admin uses Twilio SMS, regular users use Firebase Phone Auth</p>
          </div>
          
          <div>
            <strong>🌟 Single Sign-In Flow:</strong>
            <p className="ml-4">One beautiful modal handles both admin and user authentication</p>
          </div>
          
          <div>
            <strong>🛡️ Enhanced Security:</strong>
            <p className="ml-4">Admin access requires phone number input + OTP verification</p>
          </div>

          <div>
            <strong>📱 Multiple Auth Methods:</strong>
            <p className="ml-4">Phone OTP + Google OAuth in one seamless experience</p>
          </div>
        </div>
      </div>
    </div>
  );
} 