-- PranaPredict AI - Database Schema
-- Run this SQL in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Health Reports table
CREATE TABLE IF NOT EXISTS health_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  age INT NOT NULL,
  bmi FLOAT NOT NULL,
  blood_pressure TEXT,
  cholesterol TEXT,
  smoking BOOLEAN DEFAULT FALSE,
  activity_level TEXT,
  risk_score FLOAT NOT NULL,
  risk_level TEXT NOT NULL,
  llm_advice TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_reports ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 5. RLS Policies for health_reports
CREATE POLICY "Users can view own reports"
  ON health_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports"
  ON health_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger to call function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Index for faster queries
CREATE INDEX IF NOT EXISTS idx_health_reports_user_id ON health_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_health_reports_created_at ON health_reports(created_at DESC);
