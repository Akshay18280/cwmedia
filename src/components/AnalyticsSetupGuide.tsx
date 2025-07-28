import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Eye, 
  EyeOff,
  Cloud,
  Database,
  Key,
  Settings,
  RefreshCw,
  Zap,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { hybridAnalyticsService } from '../services/analytics/hybrid-analytics.service';

const AnalyticsSetupGuide: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showServiceKey, setShowServiceKey] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkServiceStatus();
  }, []);

  const checkServiceStatus = () => {
    const status = hybridAnalyticsService.getStatus();
    setServiceStatus(status);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await hybridAnalyticsService.forceRefresh();
      checkServiceStatus();
      toast.success('Analytics data refreshed successfully!');
    } catch (error) {
      toast.error('Failed to refresh analytics data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const setupSteps = [
    {
      title: 'Google Cloud Console Setup',
      description: 'Create a project and enable APIs',
      icon: <Cloud className="w-6 h-6" />,
      status: 'pending',
      instructions: [
        'Go to Google Cloud Console (console.cloud.google.com)',
        'Create a new project or select an existing one',
        'Navigate to "APIs & Services" > "Library"',
        'Search for "Google Analytics Data API" and enable it'
      ],
      links: [
        { text: 'Google Cloud Console', url: 'https://console.cloud.google.com' },
        { text: 'Analytics Data API', url: 'https://console.cloud.google.com/marketplace/product/google/analyticsdata.googleapis.com' }
      ]
    },
    {
      title: 'Service Account Creation',
      description: 'Create credentials for API access',
      icon: <Key className="w-6 h-6" />,
      status: 'pending',
      instructions: [
        'Go to "APIs & Services" > "Credentials"',
        'Click "Create Credentials" > "Service Account"',
        'Name it "analytics-reader" and add description',
        'Skip optional steps and click "Done"',
        'Click on the created service account',
        'Go to "Keys" tab and click "Add Key" > "Create new key"',
        'Choose JSON format and download the key file'
      ],
      links: [
        { text: 'Service Account Guide', url: 'https://cloud.google.com/iam/docs/creating-managing-service-accounts' }
      ]
    },
    {
      title: 'Google Analytics Configuration',
      description: 'Grant access to your Analytics property',
      icon: <Database className="w-6 h-6" />,
      status: 'pending',
      instructions: [
        'Go to Google Analytics (analytics.google.com)',
        'Select your property',
        'Go to "Admin" > "Property Access Management"',
        'Click "+" to add users',
        'Add the service account email (from the JSON file)',
        'Assign "Viewer" permissions',
        'Click "Add"'
      ],
      links: [
        { text: 'Google Analytics', url: 'https://analytics.google.com' },
        { text: 'Property ID Guide', url: 'https://support.google.com/analytics/answer/1032385' }
      ]
    },
    {
      title: 'Environment Variables',
      description: 'Configure your application',
      icon: <Settings className="w-6 h-6" />,
      status: serviceStatus?.isGoogleAnalyticsConfigured ? 'completed' : 'pending',
      instructions: [
        'Create or edit your .env file in the project root',
        'Add the Google Analytics Property ID',
        'Add the entire service account JSON as a string',
        'Restart your development server'
      ]
    }
  ];

  const envVariables = [
    {
      name: 'VITE_GOOGLE_ANALYTICS_PROPERTY_ID',
      value: '11543981244',
      description: 'Your Google Analytics 4 Property ID'
    },
    {
      name: 'VITE_GOOGLE_ANALYTICS_SERVICE_KEY',
      value: '{"type":"service_account","project_id":"your-project",...}',
      description: 'Complete service account JSON key (as string)',
      sensitive: true
    }
  ];

  return (
    <div className="bg-medium-contrast rounded-2xl p-8 shadow-xl border border-low-contrast">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-subtitle font-bold text-high-contrast">
                Analytics Setup Guide
              </h2>
              <p className="text-medium-contrast">
                Configure real Google Analytics data for your dashboard
              </p>
            </div>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Current Status */}
        <div className={`p-4 rounded-xl border ${
          serviceStatus?.isGoogleAnalyticsConfigured 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-center space-x-3">
            {serviceStatus?.isGoogleAnalyticsConfigured ? (
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            )}
            <div>
              <h3 className={`font-semibold ${
                serviceStatus?.isGoogleAnalyticsConfigured 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-yellow-800 dark:text-yellow-200'
              }`}>
                {serviceStatus?.isGoogleAnalyticsConfigured 
                  ? '✅ Real Google Analytics Connected!' 
                  : '⚠️ Using Simulation Data'}
              </h3>
              <p className={`text-body-sm ${
                serviceStatus?.isGoogleAnalyticsConfigured 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-yellow-700 dark:text-yellow-300'
              }`}>
                {serviceStatus?.isGoogleAnalyticsConfigured 
                  ? 'Your dashboard is showing real visitor data from Google Analytics'
                  : 'Configure Google Analytics to show real visitor data instead of simulation'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Why Real Data Matters */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <h3 className="text-body font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
          <Zap className="w-5 h-5 mr-2" />
          Why Use Real Data?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-body-sm">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-blue-700 dark:text-blue-300">
              <strong>Authentic metrics:</strong> Real visitor counts and engagement data
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-blue-700 dark:text-blue-300">
              <strong>Geographic accuracy:</strong> Actual visitor locations and countries
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-blue-700 dark:text-blue-300">
              <strong>Professional credibility:</strong> Impress visitors with genuine data
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-blue-700 dark:text-blue-300">
              <strong>Growth tracking:</strong> Monitor real website growth over time
            </span>
          </div>
        </div>
      </div>

      {/* Setup Steps */}
      <div className="mb-8">
        <h3 className="text-body font-semibold text-high-contrast mb-6">
          Setup Steps
        </h3>
        
        <div className="space-y-6">
          {setupSteps.map((step, index) => (
            <div key={index} className="border border-low-contrast rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-xl ${
                  step.status === 'completed' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-low-contrast text-medium-contrast'
                }`}>
                  {step.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-body font-semibold text-high-contrast">
                      {index + 1}. {step.title}
                    </h4>
                    {step.status === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  
                  <p className="text-medium-contrast mb-4">
                    {step.description}
                  </p>
                  
                  <div className="mb-4">
                    <h5 className="font-medium text-high-contrast mb-2">Instructions:</h5>
                    <ul className="space-y-1">
                      {step.instructions.map((instruction, i) => (
                        <li key={i} className="text-body-sm text-medium-contrast flex items-start">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                          {instruction}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {step.links && (
                    <div className="flex flex-wrap gap-2">
                      {step.links.map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-body-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          {link.text}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Environment Variables */}
      <div className="mb-8">
        <h3 className="text-body font-semibold text-high-contrast mb-4">
          Environment Variables
        </h3>
        <p className="text-medium-contrast mb-6">
          Add these variables to your <code className="bg-low-contrast px-2 py-1 rounded">.env</code> file:
        </p>
        
        <div className="space-y-4">
          {envVariables.map((envVar, index) => (
            <div key={index} className="border border-low-contrast rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <code className="text-body-sm font-mono bg-low-contrast px-2 py-1 rounded">
                    {envVar.name}
                  </code>
                  {envVar.sensitive && (
                    <button
                      onClick={() => setShowServiceKey(!showServiceKey)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showServiceKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => copyToClipboard(`${envVar.name}=${envVar.value}`)}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mb-2">
                <code className="text-caption bg-gray-50 dark:bg-gray-800 p-2 rounded block overflow-x-auto">
                  {envVar.name}={envVar.sensitive && !showServiceKey ? '••••••••••••••••••••' : envVar.value}
                </code>
              </div>
              
              <p className="text-body-sm text-medium-contrast">
                {envVar.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Sample .env File */}
      <div className="bg-high-contrast rounded-xl p-6 border border-low-contrast">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-body font-semibold text-high-contrast">
            Sample .env File
          </h3>
          <button
            onClick={() => copyToClipboard(`# Google Analytics Configuration
VITE_GOOGLE_ANALYTICS_PROPERTY_ID=11543981244
VITE_GOOGLE_ANALYTICS_SERVICE_KEY={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n","client_email":"analytics-reader@your-project.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/analytics-reader%40your-project.iam.gserviceaccount.com"}`)}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        
        <pre className="text-body-sm text-high-contrast overflow-x-auto">
{`# Google Analytics Configuration
VITE_GOOGLE_ANALYTICS_PROPERTY_ID=11543981244
VITE_GOOGLE_ANALYTICS_SERVICE_KEY={"type":"service_account",...}`}
        </pre>
        
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-body-sm text-yellow-800 dark:text-yellow-200">
            <strong>Important:</strong> Make sure to add <code>.env</code> to your <code>.gitignore</code> file to keep your credentials secure!
          </p>
        </div>
      </div>

      {/* Current Service Status */}
      {serviceStatus && (
        <div className="mt-8 p-4 bg-high-contrast rounded-xl">
          <h3 className="text-body font-semibold text-high-contrast mb-3">
            Current Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-body-sm">
            <div>
              <span className="font-medium text-high-contrast">Analytics Configured:</span>
              <span className={`ml-2 ${serviceStatus.isGoogleAnalyticsConfigured ? 'text-green-600' : 'text-red-600'}`}>
                {serviceStatus.isGoogleAnalyticsConfigured ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div>
              <span className="font-medium text-high-contrast">Data Source:</span>
              <span className="ml-2 text-blue-600">
                {serviceStatus.dataSource === 'real' ? '🔴 Real Data' : '🎭 Simulation'}
              </span>
            </div>
            <div>
              <span className="font-medium text-high-contrast">Cache Status:</span>
              <span className="ml-2 text-gray-600">
                {serviceStatus.hasRealData ? '✅ Cached' : '❌ Empty'}
              </span>
            </div>
            <div>
              <span className="font-medium text-high-contrast">Last Update:</span>
              <span className="ml-2 text-gray-600">
                {serviceStatus.lastRealDataFetch ? new Date(serviceStatus.lastRealDataFetch).toLocaleTimeString() : 'Never'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsSetupGuide; 