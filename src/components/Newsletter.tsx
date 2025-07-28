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
      <div className="bg-gradient-accent text-white py-16">
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
            className="inline-flex items-center px-6 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-accent-primary transition-colors"
          >
            Subscribe Another Email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-accent text-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Mail className="w-16 h-16 mx-auto mb-6 text-white/70" />
          <h2 className="text-3xl font-bold mb-4">
            Subscribe to Our Newsletter
          </h2>
          <p className="text-xl mb-8 text-white/80 max-w-2xl mx-auto">
            Get the latest articles, tutorials, and insights delivered directly to your inbox. 
            Join thousands of developers staying ahead of the curve.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent disabled:opacity-50"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-3 bg-white text-accent-primary font-semibold rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-accent-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-accent-primary border-t-transparent mr-2"></div>
                  Subscribing...
                </div>
              ) : (
                'Subscribe Now'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <div className="flex items-center justify-center space-x-4 text-sm text-white/70">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.weekly}
                  onChange={(e) => setPreferences(prev => ({ ...prev, weekly: e.target.checked }))}
                  className="rounded border-white text-accent-primary focus:ring-accent-primary focus:ring-offset-0 mr-3"
                />
                Weekly updates
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.important}
                  onChange={(e) => setPreferences(prev => ({ ...prev, important: e.target.checked }))}
                  className="rounded border-white text-accent-primary focus:ring-accent-primary focus:ring-offset-0 mr-3"
                />
                Important news only
              </label>
            </div>
            <p className="mt-3 text-xs text-white/60">
              Unsubscribe anytime. We respect your privacy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}