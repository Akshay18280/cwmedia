import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Mail } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRetrying: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Error Boundary Caught Error:', error);
    console.error('📍 Error Info:', errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log error to analytics/monitoring service
    this.logErrorToService(error, errorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In production, you'd send this to your error tracking service
      const errorData = {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        errorInfo: {
          componentStack: errorInfo.componentStack
        },
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href
      };

      console.error('🔧 Error Data for Monitoring:', errorData);
      
      // Example: Send to monitoring service
      // await fetch('/api/errors', { 
      //   method: 'POST', 
      //   body: JSON.stringify(errorData) 
      // });
    } catch (loggingError) {
      console.error('❌ Failed to log error:', loggingError);
    }
  };

  private handleRetry = () => {
    this.setState({ isRetrying: true });
    
    this.retryTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false
      });
    }, 1000);
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportError = () => {
    const subject = encodeURIComponent('Application Error Report');
    const body = encodeURIComponent(`Error Details:\n\nError: ${this.state.error?.message}\nStack: ${this.state.error?.stack}\nComponent Stack: ${this.state.errorInfo?.componentStack}\n\nPlease describe what you were doing when this error occurred:\n\n`);
    
    window.open(`mailto:contact@carelwave.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900/20 dark:to-orange-900/20 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            
            {/* Error Card */}
            <div className="bg-medium-contrast rounded-3xl p-8 shadow-2xl border border-red-200 dark:border-red-800 text-center">
              
              {/* Error Icon */}
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>

              {/* Error Title */}
              <h1 className="text-title font-bold text-high-contrast mb-4">
                Oops! Something went wrong
              </h1>

              {/* Error Description */}
              <p className="text-medium-contrast mb-6 leading-relaxed">
                We encountered an unexpected error. Don't worry - our development team has been notified 
                and we're working to fix this issue.
              </p>

              {/* Error Details (Development Mode) */}
              {import.meta.env.DEV && this.state.error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 text-left">
                  <div className="flex items-center mb-3">
                    <Bug className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                    <h3 className="text-body font-semibold text-red-800 dark:text-red-200">
                      Development Error Details
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-body-sm font-medium text-red-700 dark:text-red-300 mb-1">Error:</p>
                      <code className="text-caption bg-red-100 dark:bg-red-900/40 p-2 rounded block text-red-800 dark:text-red-200 overflow-x-auto">
                        {this.state.error.name}: {this.state.error.message}
                      </code>
                    </div>
                    
                    {this.state.error.stack && (
                      <div>
                        <p className="text-body-sm font-medium text-red-700 dark:text-red-300 mb-1">Stack Trace:</p>
                        <code className="text-caption bg-red-100 dark:bg-red-900/40 p-2 rounded block text-red-800 dark:text-red-200 overflow-x-auto max-h-32 overflow-y-auto">
                          {this.state.error.stack}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={this.handleRetry}
                  disabled={this.state.isRetrying}
                  className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                >
                  {this.state.isRetrying ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5 mr-3" />
                      Try Again
                    </>
                  )}
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center px-6 py-3 border border-medium-contrast text-high-contrast font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  <Home className="w-5 h-5 mr-3" />
                  Go Home
                </button>

                <button
                  onClick={this.handleReportError}
                  className="flex items-center justify-center px-6 py-3 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                >
                  <Mail className="w-5 h-5 mr-3" />
                  Report Issue
                </button>
              </div>

              {/* Additional Help */}
              <div className="mt-8 pt-6 border-t border-low-contrast">
                <p className="text-body-sm text-low-contrast">
                  If this problem persists, please contact us at{' '}
                  <a 
                    href="mailto:contact@carelwavemedia.com" 
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    contact@carelwavemedia.com
                  </a>
                </p>
              </div>
            </div>

            {/* Professional Footer */}
            <div className="text-center mt-6">
              <p className="text-body-sm text-low-contrast">
                🛡️ Error boundary protecting your experience • Carelwave Media
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 