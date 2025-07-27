-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  avatar_url text,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  excerpt text NOT NULL,
  author_id uuid REFERENCES users(id),
  published_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  cover_image text,
  reading_time integer DEFAULT 0,
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  featured boolean DEFAULT false
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  author_id uuid REFERENCES users(id),
  post_id uuid REFERENCES posts(id),
  created_at timestamptz DEFAULT now()
);

-- Create newsletters table
CREATE TABLE IF NOT EXISTS newsletters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  subscription_date timestamptz DEFAULT now(),
  status text DEFAULT 'active',
  preferences jsonb DEFAULT '{"weekly": true, "marketing": false}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;

-- Create policies only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own data') THEN
    CREATE POLICY "Users can read own data"
      ON users
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can manage all posts') THEN
    CREATE POLICY "Admin can manage all posts"
      ON posts
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read published posts') THEN
    CREATE POLICY "Anyone can read published posts"
      ON posts
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create comments') THEN
    CREATE POLICY "Users can create comments"
      ON comments
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = author_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read comments') THEN
    CREATE POLICY "Users can read comments"
      ON comments
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can manage newsletters') THEN
    CREATE POLICY "Admin can manage newsletters"
      ON newsletters
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role = 'admin'
        )
      );
  END IF;

  -- Add PUBLIC policies for newsletter subscriptions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public to subscribe') THEN
    CREATE POLICY "Allow public to subscribe"
      ON newsletters
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public to read newsletters') THEN
    CREATE POLICY "Allow public to read newsletters"
      ON newsletters
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public to update newsletters') THEN
    CREATE POLICY "Allow public to update newsletters"
      ON newsletters
      FOR UPDATE
      TO anon, authenticated
      USING (true);
  END IF;
END $$;
