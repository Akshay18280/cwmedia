import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Mail, ArrowLeft, Home } from 'lucide-react';
import { toast } from 'sonner';
import { firebaseNewsletterService } from '../services/firebase/newsletter.service';

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'not-found'>('loading');
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('not-found');
      setMessage('Invalid unsubscribe link. The token is missing.');
      return;
    }

    handleUnsubscribe();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;

    setLoading(true);

    try {
      const result = await firebaseNewsletterService.unsubscribe(token);
      
      if (result.success) {
        setStatus('success');
        setMessage(result.message);
        toast.success('Successfully unsubscribed!');
      } else {
        setStatus('error');
        setMessage(result.message);
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      setStatus('error');
      setMessage('An unexpected error occurred. Please try again later.');
      toast.error('Failed to unsubscribe');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />;
      case 'error':
      case 'not-found':
        return <AlertCircle className="w-16 h-16 text-red-600 dark:text-red-400" />;
      default:
        return <Mail className="w-16 h-16 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900';
      case 'error':
      case 'not-found':
        return 'bg-red-100 dark:bg-red-900';
      default:
        return 'bg-blue-100 dark:bg-blue-900';
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Processing Unsubscribe...';
      case 'success':
        return 'Successfully Unsubscribed';
      case 'error':
        return 'Unsubscribe Failed';
      case 'not-found':
        return 'Invalid Link';
      default:
        return 'Newsletter Unsubscribe';
    }
  };

  if (loading && status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Processing Unsubscribe...
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we process your unsubscribe request.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        {/* Status Icon */}
        <div className={`w-16 h-16 ${getStatusColor()} rounded-full flex items-center justify-center mx-auto mb-6`}>
          {getStatusIcon()}
        </div>
        
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {getTitle()}
        </h1>
        
        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Additional content based on status */}
        {status === 'success' && (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-green-800 dark:text-green-200 text-sm">
                You have been successfully unsubscribed from our newsletter. You will no longer receive email updates from us.
              </p>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Changed your mind? You can always subscribe again from our website.
            </p>
          </div>
        )}

        {(status === 'error' || status === 'not-found') && (
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">
                {status === 'not-found' 
                  ? 'This unsubscribe link appears to be invalid or expired.'
                  : 'There was an issue processing your unsubscribe request.'
                }
              </p>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              If you continue to experience issues, please contact us directly at{' '}
              <a 
                href="mailto:support@carelwavemedia.com" 
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                support@carelwavemedia.com
              </a>
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col space-y-3 mt-8">
          <Link
            to="/"
            className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
          
          {status === 'success' && (
            <Link
              to="/blog"
              className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Browse Our Blog
            </Link>
          )}
          
          {(status === 'error' || status === 'not-found') && (
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>

        {/* Newsletter subscription link for success case */}
        {status === 'success' && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Want to stay updated with our latest content?
            </p>
            <Link
              to="/#newsletter"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Subscribe Again →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 