/*
  # Add Admin SELECT Policy

  ## Purpose
  Allow admins to read all user profiles, not just their own

  ## Changes
  - Add SELECT policy for admin role to read all profiles

  ## Security
  - Only users with Admin role can read all profiles
  - Regular users can only read their own profile
*/

-- Add policy for admins to read all profiles
CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'Admin'
    )
  );
