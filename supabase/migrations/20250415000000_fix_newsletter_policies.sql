-- Fix newsletter policies to allow public access
-- This migration adds the missing policies for anonymous users to subscribe

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Admin can manage newsletters" ON newsletters;

-- Create new policies that allow public access
CREATE POLICY "Allow public to subscribe" ON newsletters
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public to read newsletters" ON newsletters
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public to update newsletters" ON newsletters
  FOR UPDATE TO anon, authenticated
  USING (true);

-- Allow admin to manage all newsletter operations
CREATE POLICY "Admin can manage all newsletters" ON newsletters
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS newsletters_email_idx ON newsletters(email);
CREATE INDEX IF NOT EXISTS newsletters_status_idx ON newsletters(status);
CREATE INDEX IF NOT EXISTS newsletters_subscription_date_idx ON newsletters(subscription_date); 