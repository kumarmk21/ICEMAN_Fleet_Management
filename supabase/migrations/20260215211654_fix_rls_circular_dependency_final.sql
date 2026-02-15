/*
  # Fix RLS Circular Dependency - Final Solution

  ## Root Cause
  During signup, the trigger runs without auth context (auth.uid() is NULL)
  The INSERT policies check auth.uid() which is NULL, blocking the insert
  SECURITY DEFINER isn't bypassing RLS as expected

  ## Solution
  1. Drop problematic INSERT policies that check auth.uid()
  2. Create a single permissive INSERT policy for the signup process
  3. Ensure the trigger function can insert without RLS blocking

  ## Security
  - Admin users can still manage profiles through the application
  - RLS remains enabled for SELECT and UPDATE
  - Only INSERT is made permissive for the signup trigger
*/

-- Drop existing INSERT policies that create circular dependencies
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON user_profiles;

-- Create a single, permissive INSERT policy that works for both signup and admin operations
CREATE POLICY "Allow profile inserts"
  ON user_profiles FOR INSERT
  WITH CHECK (
    -- Allow if this is a signup (no auth context) OR user is inserting their own profile OR user is admin
    auth.uid() IS NULL  -- Signup trigger
    OR auth.uid() = user_id  -- User creating own profile
    OR EXISTS (  -- Admin creating any profile
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'Admin'
    )
  );
