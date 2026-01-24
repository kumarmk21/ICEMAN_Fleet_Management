/*
  # Fix RLS Circular Dependency on user_profiles
  
  ## Problem
  The "Admins can read all profiles" policy has a circular dependency - it tries to read 
  from user_profiles to check if the user is admin, but RLS blocks that read.
  
  ## Solution
  1. Drop the problematic admin policy
  2. Keep only the simple "Users can read own profile" policy for SELECT
  3. Users can read their own profile without circular dependency
  4. Admins will still be able to read their own profile and will need separate 
     logic for reading other profiles if needed
  
  ## Changes
  - Drop "Admins can read all profiles" policy
  - Keep "Users can read own profile" policy
*/

-- Drop the problematic policy with circular dependency
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;

-- The "Users can read own profile" policy remains and will work correctly
-- CREATE POLICY "Users can read own profile"
--   ON user_profiles FOR SELECT
--   TO authenticated
--   USING (auth.uid() = user_id);

-- Similarly, drop and recreate the admin update policy to avoid circular dependency
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

-- For updates, users can only update their own profile
-- Admins will use the same rule for now
CREATE POLICY "Users can update profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Drop the old "Users can update own profile" policy if it exists (to avoid duplicates)
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
