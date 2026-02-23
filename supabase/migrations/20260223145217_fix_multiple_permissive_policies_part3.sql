/*
  # Fix Multiple Permissive Policies - Part 3

  ## Security Fix - CRITICAL
  
  Fix the user_profiles table which has overlapping policies for both
  SELECT and UPDATE operations.
  
  This migration fixes:
  - user_profiles SELECT policies (2 overlapping policies)
  - user_profiles UPDATE policies (2 overlapping policies)
*/

-- Fix user_profiles table - SELECT policies
DROP POLICY IF EXISTS "Admins read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users read own profile" ON public.user_profiles;

CREATE POLICY "Users can read profiles"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role_id = (SELECT role_id FROM public.roles WHERE role_name = 'admin')
    )
  );

-- Fix user_profiles table - UPDATE policies
DROP POLICY IF EXISTS "Admins update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.user_profiles;

CREATE POLICY "Users can update profiles"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role_id = (SELECT role_id FROM public.roles WHERE role_name = 'admin')
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role_id = (SELECT role_id FROM public.roles WHERE role_name = 'admin')
    )
  );
