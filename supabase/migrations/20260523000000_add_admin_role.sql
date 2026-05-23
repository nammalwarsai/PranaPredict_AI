-- Add admin and suspension columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;

-- Create security-definer helper function to safely bypass RLS checks recursively when assessing admin role
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create read policy for profiles to support admins
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

-- Re-create update policy for profiles to allow admins to manage suspension status and details
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

-- Re-create read policy for health_reports to support admins
DROP POLICY IF EXISTS "Users can read own reports" ON public.health_reports;
CREATE POLICY "Users can read own reports"
  ON public.health_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Allow admins to delete profiles (which cascades to health reports)
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));
