/*
  # Create health_reports and profiles tables

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `phone` (text, nullable)
      - `full_name` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `health_reports`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `age` (integer)
      - `bmi` (numeric)
      - `blood_pressure` (text)
      - `cholesterol` (text)
      - `smoking` (boolean)
      - `activity_level` (text)
      - `diabetes` (boolean, default false)
      - `hypertension` (boolean, default false)
      - `heart_disease` (boolean, default false)
      - `kidney_disease` (boolean, default false)
      - `location` (text)
      - `diet_type` (text)
      - `water_intake` (numeric)
      - `sleep_duration` (numeric)
      - `alcohol_consumption` (text)
      - `work_type` (text)
      - `risk_score` (integer)
      - `risk_level` (text)
      - `llm_advice` (text)
      - `created_at` (timestamptz)

  2. Indexes
    - Composite index on `health_reports(user_id, created_at DESC)` for the
      most common query pattern (paginated reports by user, newest first)
    - Index on `health_reports(user_id)` for single-user lookups

  3. Security
    - RLS enabled on both tables
    - Profiles: users can read/update only their own row
    - Health reports: users can read/insert only their own reports,
      no update or delete allowed (reports are immutable)

  4. Trigger
    - Auto-create profile row when a new user signs up
*/

-- ── Profiles ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  phone text,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Health Reports ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS health_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  age integer NOT NULL,
  bmi numeric NOT NULL,
  blood_pressure text DEFAULT '120/80',
  cholesterol text DEFAULT 'normal',
  smoking boolean DEFAULT false,
  activity_level text DEFAULT 'moderate',
  diabetes boolean DEFAULT false,
  hypertension boolean DEFAULT false,
  heart_disease boolean DEFAULT false,
  kidney_disease boolean DEFAULT false,
  location text,
  diet_type text,
  water_intake numeric,
  sleep_duration numeric,
  alcohol_consumption text,
  work_type text,
  risk_score integer NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'Low',
  llm_advice text,
  created_at timestamptz DEFAULT now()
);

-- Performance index: covers the paginated query pattern
CREATE INDEX IF NOT EXISTS idx_health_reports_user_created
  ON health_reports (user_id, created_at DESC);

-- Separate index for single-user lookups
CREATE INDEX IF NOT EXISTS idx_health_reports_user_id
  ON health_reports (user_id);

ALTER TABLE health_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reports"
  ON health_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports"
  ON health_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Reports are immutable: no update or delete policies
