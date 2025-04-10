import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface LoginForm {
  phone: string;
}

export default function AdminLogin() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState('');

  const onSubmit = async (data: LoginForm) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: data.phone,
      });

      if (error) {
        throw error;
      }

      setIsVerifying(true);
      toast.success('OTP sent to your phone');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to send OTP. Please try again.');
    }
  };

  const verifyOTP = async () => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: register('phone').value,
        token: otp,
        type: 'sms'
      });

      if (error) {
        throw error;
      }

      toast.success('Successfully logged in!');
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error('Invalid OTP. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Admin Login
          </h2>
        </div>
        {!isVerifying ? (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
            <div>
              <label htmlFor="phone" className="sr-only">Phone number</label>
              <input
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^\+[1-9]\d{1,14}$/,
                    message: 'Please enter a valid phone number with country code',
                  },
                })}
                type="tel"
                placeholder="+1234567890"
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.phone && (
                <p className="mt-2 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Send OTP
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 space-y-6">
            <div>
              <label htmlFor="otp" className="sr-only">OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <button
                onClick={verifyOTP}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Verify OTP
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}