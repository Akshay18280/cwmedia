import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Mail, Check, X, Bell, Shield, Sparkles } from 'lucide-react';
import { newsletterService } from '../services/newsletter';

interface NewsletterForm {
  email: string;
  preferences: {
    weekly: boolean;
    marketing: boolean;
  };
}

export default function Newsletter() {
  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<NewsletterForm>({
    defaultValues: {
      preferences: {
        weekly: true,
        marketing: false
      }
    }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  
  const watchedEmail = watch('email');
  const isValidEmail = newsletterService.validateEmail(watchedEmail || '');

  const onSubmit = async (data: NewsletterForm) => {
    if (!isValidEmail) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await newsletterService.subscribe(data.email, data.preferences);
      
      if (result.success) {
        toast.success(result.message);
        setSubscribed(true);
        reset();
        
        // Reset subscribed state after 5 seconds
        setTimeout(() => setSubscribed(false), 5000);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (subscribed) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            🎉 Welcome to the Carelwave Community!
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            Your subscription is confirmed. Get ready for amazing technical insights!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setSubscribed(false)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Bell className="w-5 h-5 mr-2" />
              Subscribe Another Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 dark:from-gray-800 dark:via-blue-900 dark:to-gray-800 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900 rounded-full text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Join 10,000+ Engineers
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Never Miss a Technical Breakthrough
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Get exclusive insights on scalable systems, cloud architecture, and cutting-edge development practices delivered straight to your inbox.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Input */}
            <div className="relative">
              <div className="flex">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    {...register('email', {
                      required: 'Email is required',
                      validate: (value) => newsletterService.validateEmail(value) || 'Please enter a valid email address'
                    })}
                    className={`w-full pl-12 pr-4 py-4 text-lg border-2 rounded-l-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.email 
                        ? 'border-red-500 focus:border-red-500' 
                        : isValidEmail && watchedEmail 
                          ? 'border-green-500 focus:border-green-500' 
                          : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                    }`}
                  />
                  {watchedEmail && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      {isValidEmail ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !isValidEmail}
                  className={`px-8 py-4 font-semibold rounded-r-xl transition-all duration-200 ${
                    isSubmitting || !isValidEmail
                      ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transform hover:scale-105 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                  ) : (
                    'Subscribe'
                  )}
                </button>
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Preferences */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-600" />
                Subscription Preferences
              </h3>
              <div className="space-y-4">
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    {...register('preferences.weekly')}
                    className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Weekly Technical Insights
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Deep dives into Golang, AWS, microservices, and system design
                    </div>
                  </div>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    {...register('preferences.marketing')}
                    className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Product Updates & Announcements
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      New features, courses, and special content releases
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-1" />
                  No spam, ever
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  Unsubscribe anytime
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 mr-1" />
                  10K+ subscribers
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}