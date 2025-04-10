import { supabase } from '../lib/supabase'; // adjust path if needed

const verifyOTP = async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
  
    if (error) {
      console.error('OTP Verification Error:', error.message);
    } else {
      console.log('User logged in:', data);
    }
  };
  