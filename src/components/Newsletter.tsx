import React, { useState } from 'react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { firebaseNewsletterService } from '../services/firebase/newsletter.service';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [preferences, setPreferences] = useState({
    weekly: true,
    marketing: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (!firebaseNewsletterService.validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      console.log('🔄 Attempting newsletter subscription for:', email);
      const result = await firebaseNewsletterService.subscribe(email, preferences);
      
      console.log('📧 Newsletter subscription result:', result);
      
      if (result.success) {
        setSuccess(true);
        setEmail('');
        toast.success(result.message);
      } else {
        console.error('❌ Newsletter subscription failed:', result);
        toast.error(result.message);
        
        // Additional debugging in production
        if (result.error) {
          console.error('🐛 Detailed error:', result.error);
        }
      }
    } catch (error) {
      console.error('💥 Newsletter subscription exception:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // Check if it's a Firebase-specific error
      if (error && typeof error === 'object' && 'code' in error) {
        console.error('🔥 Firebase error code:', (error as any).code);
        console.error('🔥 Firebase error message:', (error as any).message);
      }
      
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-6 text-green-300" />
          <h2 className="text-3xl font-bold mb-4">
            Thank you for subscribing!
          </h2>
          <p className="text-xl opacity-90 mb-8">
            You'll receive our latest articles and updates right in your inbox.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="inline-flex items-center px-6 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-purple-600 transition-colors"
          >
            Subscribe Another Email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <Mail className="w-16 h-16 mx-auto mb-6 text-blue-200" />
          <h2 className="text-3xl font-bold mb-4">
            Stay Updated with Our Newsletter
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Get the latest insights on technology, engineering best practices, and industry trends delivered straight to your inbox.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-2"></div>
                  Subscribing...
                </div>
              ) : (
                'Subscribe'
              )}
            </button>
          </div>

          {/* Preferences */}
          <div className="space-y-3 text-sm">
            <p className="font-medium">Email Preferences:</p>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.weekly}
                onChange={(e) => setPreferences(prev => ({ ...prev, weekly: e.target.checked }))}
                className="rounded border-white text-blue-600 focus:ring-blue-600 focus:ring-offset-0 mr-3"
              />
              <span className="opacity-90">Weekly newsletter with latest articles</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.marketing}
                onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                className="rounded border-white text-blue-600 focus:ring-blue-600 focus:ring-offset-0 mr-3"
              />
              <span className="opacity-90">Occasional updates about new features and announcements</span>
            </label>
          </div>

          <div className="mt-6 text-xs opacity-75 text-center">
            <p>
              We respect your privacy. Unsubscribe at any time. 
              <br />
              By subscribing, you agree to our privacy policy.
            </p>
          </div>
        </form>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-semibold mb-2">Weekly Insights</h3>
            <p className="text-sm opacity-90">
              Curated content every week with the most important tech developments
            </p>
          </div>
          <div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="font-semibold mb-2">No Spam</h3>
            <p className="text-sm opacity-90">
              Only valuable content. We hate spam as much as you do.
            </p>
          </div>
          <div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-semibold mb-2">Easy Unsubscribe</h3>
            <p className="text-sm opacity-90">
              Change your preferences or unsubscribe with one click
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}