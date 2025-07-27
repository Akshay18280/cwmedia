-- Enhanced authentication and review system

-- Update users table to support social authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'email';
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  reviewer_name TEXT NOT NULL,
  reviewer_position TEXT NOT NULL,
  reviewer_company TEXT NOT NULL,
  reviewer_image TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin verification table for OTP
CREATE TABLE IF NOT EXISTS admin_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create social auth sessions table
CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Users can read approved reviews
CREATE POLICY "Anyone can read approved reviews" ON reviews
  FOR SELECT TO anon, authenticated
  USING (status = 'approved');

-- Authenticated users can submit their own reviews
CREATE POLICY "Users can submit own reviews" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own reviews regardless of status
CREATE POLICY "Users can read own reviews" ON reviews
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admin can manage all reviews
CREATE POLICY "Admin can manage all reviews" ON reviews
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS for admin verification
ALTER TABLE admin_verification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage verifications" ON admin_verification
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Allow public to create verification requests (for OTP generation)
CREATE POLICY "Allow OTP generation" ON admin_verification
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- RLS for auth sessions
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sessions" ON auth_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS users_provider_idx ON users(provider);
CREATE INDEX IF NOT EXISTS users_provider_id_idx ON users(provider_id);
CREATE INDEX IF NOT EXISTS reviews_status_idx ON reviews(status);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON reviews(user_id);
CREATE INDEX IF NOT EXISTS reviews_submitted_at_idx ON reviews(submitted_at);
CREATE INDEX IF NOT EXISTS admin_verification_phone_idx ON admin_verification(phone_number);
CREATE INDEX IF NOT EXISTS admin_verification_expires_idx ON admin_verification(expires_at);
CREATE INDEX IF NOT EXISTS auth_sessions_token_idx ON auth_sessions(session_token);
CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions(user_id);

-- Create trigger for reviews updated_at
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean expired OTP codes
CREATE OR REPLACE FUNCTION clean_expired_otp()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_verification 
  WHERE expires_at < NOW() AND verified = false;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean expired sessions
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM auth_sessions 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql; 