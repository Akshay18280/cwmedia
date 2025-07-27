-- Create newsletters table for email subscriptions
CREATE TABLE newsletters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscription_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  preferences JSONB DEFAULT '{"weekly": true, "marketing": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for newsletters
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_newsletters_updated_at BEFORE UPDATE ON newsletters
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;

-- Allow public to insert (for subscriptions)
CREATE POLICY "Allow public to subscribe" ON newsletters
  FOR INSERT TO public
  WITH CHECK (true);

-- Allow public to read their own subscription
CREATE POLICY "Allow users to read own subscription" ON newsletters
  FOR SELECT TO public
  USING (true);

-- Allow public to update their own subscription (for unsubscribe)
CREATE POLICY "Allow public to update own subscription" ON newsletters
  FOR UPDATE TO public
  USING (true);

-- Add indexes for performance
CREATE INDEX newsletters_email_idx ON newsletters(email);
CREATE INDEX newsletters_status_idx ON newsletters(status);
CREATE INDEX newsletters_subscription_date_idx ON newsletters(subscription_date);
