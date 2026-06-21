-- Supabase Schema Setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users table (extends auth.users)
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT CHECK (role IN ('founder', 'builder', 'none')) DEFAULT 'none',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users are viewable by everyone."
  ON users FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own record."
  ON users FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update their own record."
  ON users FOR UPDATE
  USING ( auth.uid() = id );

-- Create Profiles table
CREATE TABLE profiles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  photo_url TEXT,
  bio TEXT,
  college TEXT,
  location TEXT,
  linkedin_url TEXT
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone."
  ON profiles FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update their own profile."
  ON profiles FOR UPDATE
  USING ( auth.uid() = user_id );

-- Create Founders table
CREATE TABLE founders (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  designation TEXT NOT NULL,
  startup_name TEXT NOT NULL,
  startup_description TEXT,
  startup_stage TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  industry TEXT,
  looking_for TEXT[]
);

ALTER TABLE founders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founder profiles are viewable by everyone."
  ON founders FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own founder profile."
  ON founders FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update their own founder profile."
  ON founders FOR UPDATE
  USING ( auth.uid() = user_id );

-- Create Builders table
CREATE TABLE builders (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  skills TEXT[],
  github_url TEXT,
  leetcode_url TEXT,
  portfolio_url TEXT,
  resume_url TEXT,
  current_projects TEXT,
  availability TEXT
);

ALTER TABLE builders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Builder profiles are viewable by everyone."
  ON builders FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own builder profile."
  ON builders FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update their own builder profile."
  ON builders FOR UPDATE
  USING ( auth.uid() = user_id );

-- Create Connections table
CREATE TABLE connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending' NOT NULL,
  intro_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(sender_id, receiver_id)
);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Connections are viewable by participants."
  ON connections FOR SELECT
  USING ( auth.uid() = sender_id OR auth.uid() = receiver_id );

CREATE POLICY "Users can insert connections where they are sender."
  ON connections FOR INSERT
  WITH CHECK ( auth.uid() = sender_id );

CREATE POLICY "Users can update connections where they are receiver."
  ON connections FOR UPDATE
  USING ( auth.uid() = receiver_id );

-- Create Messages table
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  connection_id UUID REFERENCES connections(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message_text TEXT NOT NULL,
  read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages are viewable by participants."
  ON messages FOR SELECT
  USING ( auth.uid() = sender_id OR auth.uid() = receiver_id );

CREATE POLICY "Users can insert messages where they are sender."
  ON messages FOR INSERT
  WITH CHECK ( auth.uid() = sender_id );

CREATE POLICY "Users can update their own messages."
  ON messages FOR UPDATE
  USING ( auth.uid() = sender_id );


-- Create Meetings table
CREATE TABLE meetings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  connection_id UUID REFERENCES connections(id) ON DELETE CASCADE NOT NULL,
  founder_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  builder_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  meet_date TEXT NOT NULL,
  meet_time TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Meetings are viewable by participants."
  ON meetings FOR SELECT
  USING ( auth.uid() = founder_id OR auth.uid() = builder_id );

CREATE POLICY "Users can insert meetings where they are founder."
  ON meetings FOR INSERT
  WITH CHECK ( auth.uid() = founder_id );

CREATE POLICY "Users can update meetings where they are involved."
  ON meetings FOR UPDATE
  USING ( auth.uid() = founder_id OR auth.uid() = builder_id );

-- Subscriptions for Realtime
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table connections;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table meetings;

-- Storage setup for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible."
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

CREATE POLICY "Users can upload their own avatar."
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

CREATE POLICY "Users can update their own avatar."
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

CREATE POLICY "Users can delete their own avatar."
ON storage.objects FOR DELETE
USING ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Insert user to profiles on signup automatically (optional, depends on auth flow. Here we handle it manually in frontend)
