import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Mail, Shield, Check, X, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { newsletterService } from '../services/newsletter';

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [loading, setLoading] = useState(false);
  const [, setUnsubscribed] = useState(false);
  const [step, setStep] = useState<'confirm' | 'processing' | 'success' | 'error'>('confirm');

  const token = searchParams.get('token');

  useEffect(() => {
    // If we have both email and token from URL, show confirmation
    if (email && token) {
      setStep('confirm');
    }
  }, [email, token]);

  const handleUnsubscribe = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    if (!newsletterService.validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setStep('processing');

    try {
      const result = await newsletterService.unsubscribe(email, token || undefined);
      
      if (result.success) {
        setStep('success');
        setUnsubscribed(true);
        toast.success(result.message);
      } else {
        setStep('error');
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      setStep('error');
      toast.error('Failed to unsubscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Successfully Unsubscribed
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You have been removed from our mailing list. You will no longer receive newsletters from Carelwave Media.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              We're sorry to see you go! If you change your mind, you can always resubscribe.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/"
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
              <Link
                to="/blog"
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Browse Articles
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50 dark:from-gray-900 dark:to-red-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Unsubscribe Failed
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We couldn't process your unsubscribe request. This might be because you're already unsubscribed or the link has expired.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setStep('confirm')}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <Link
              to="/"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Processing...
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            We're removing you from our mailing list. Please wait a moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Unsubscribe from Newsletter
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            We're sorry to see you go! Confirm your email below to unsubscribe from all future newsletters.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleUnsubscribe(); }} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex">
              <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" />
              <div className="text-sm">
                <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-1">
                  What you'll miss:
                </p>
                <ul className="text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li>• Weekly technical insights on Golang and AWS</li>
                  <li>• Scalable system design deep dives</li>
                  <li>• Exclusive development tips and best practices</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !newsletterService.validateEmail(email)}
            className={`w-full py-3 px-4 font-medium rounded-lg transition-all ${
              loading || !email || !newsletterService.validateEmail(email)
                ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                : 'bg-red-600 hover:bg-red-700 text-white transform hover:scale-105 shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Processing...
              </div>
            ) : (
              'Unsubscribe'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
} 