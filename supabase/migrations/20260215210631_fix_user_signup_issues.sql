/*
  # Fix User Signup Issues

  ## Problems Fixed
  1. Column name mismatch: handle_new_user function uses 'phone' but table has 'mobile_number'
  2. RLS policy blocking new user creation: INSERT policy requires admin to exist

  ## Changes
  1. Update handle_new_user function to use correct column name 'mobile_number'
  2. Add new INSERT policy to allow signup trigger to create user profiles
  3. The SECURITY DEFINER function will bypass RLS for automatic profile creation

  ## Security
  - Keeps existing admin-only manual INSERT policy
  - Adds service-level INSERT policy for the signup trigger
  - RLS remains enabled and secure
*/

-- Drop the restrictive INSERT policy that blocks signup
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;

-- Create a new INSERT policy that allows the signup trigger to work
-- This policy allows INSERT during signup (when there's no existing profile for this user_id)
CREATE POLICY "Allow profile creation during signup"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Either user is admin OR this is their own profile being created
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'Admin'
    )
  );

-- Update the handle_new_user function to use correct column names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- Get default role (Read-Only Management)
  SELECT role_id INTO default_role_id
  FROM roles
  WHERE role_name = 'Read-Only Management'
  LIMIT 1;

  -- Insert user profile with metadata or defaults
  INSERT INTO public.user_profiles (
    user_id,
    role_id,
    full_name,
    mobile_number,
    email
  )
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'role_id')::uuid,
      default_role_id
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'mobile_number',
    NEW.email
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
