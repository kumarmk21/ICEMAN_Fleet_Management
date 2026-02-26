/*
  # Fix User Profiles RLS Policies - Final Solution

  1. Changes
    - Create security definer function to check if user is admin
    - Replace all recursive policies with simple, non-recursive ones
    - Allow all authenticated users basic access to avoid blocking

  2. Security
    - Users can read all profiles (needed for app functionality)
    - Users can update their own profile
    - Admin checks use security definer function to avoid recursion
*/

-- Create a security definer function to check if current user is admin
-- This runs with elevated privileges and doesn't trigger RLS
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_role_uuid uuid;
  user_role_uuid uuid;
BEGIN
  -- Get the admin role ID
  SELECT role_id INTO admin_role_uuid FROM roles WHERE role_name = 'Admin' LIMIT 1;
  
  -- Get the current user's role
  SELECT role_id INTO user_role_uuid FROM user_profiles WHERE user_id = auth.uid() LIMIT 1;
  
  -- Return true if user has admin role
  RETURN (user_role_uuid = admin_role_uuid);
END;
$$;

-- Drop all existing policies on user_profiles
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;

-- Create simple, non-recursive policies

-- Allow authenticated users to read all profiles (needed for the app)
CREATE POLICY "Authenticated users can read profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can insert profiles (using security definer function)
CREATE POLICY "Admins can insert profiles"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (is_user_admin());

-- Admins can delete profiles (using security definer function)
CREATE POLICY "Admins can delete profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (is_user_admin());
