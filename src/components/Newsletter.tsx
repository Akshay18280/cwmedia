import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface NewsletterForm {
  email: string;
  preferences: {
    weekly: boolean;
    marketing: boolean;
  };
}

export default function Newsletter() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<NewsletterForm>();

  const onSubmit = async (data: NewsletterForm) => {
    try {
      const { error } = await supabase
        .from('newsletters')
        .insert([
          {
            email: data.email,
            preferences: data.preferences,
            status: 'active'
          }
        ]);

      if (error) {
        throw error;
      }

      toast.success('Successfully subscribed to newsletter!');
      reset();
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error('Failed to subscribe. Please try again.');
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-gray-800 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Subscribe to Our Newsletter
          </h2>
          <p className="mt-4 text-lg leading-6 text-gray-500 dark:text-gray-400">
            Get the latest tech insights and development tips delivered to your inbox.
          </p>
        </div>
        <div className="mt-12 max-w-lg mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('preferences.weekly')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="weekly" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                  Weekly tech updates and tutorials
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('preferences.marketing')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="marketing" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                  Receive occasional product updates and announcements
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Subscribe
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}