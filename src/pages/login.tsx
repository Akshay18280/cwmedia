// src/pages/Login.tsx (or similar)
import { supabase } from '../lib/supabase';

const sendOTP = async (phone: string) => {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) {
    console.error('OTP Error:', error.message);
  } else {
    alert('OTP sent!');
  }
};
