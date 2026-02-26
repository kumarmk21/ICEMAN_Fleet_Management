/*
  # Grant Admin Users Full Update Permission

  1. Changes
    - Add policy to allow admins to update any user profile
    - This enables admins with role_name = 'Admin' to manage all users

  2. Security
    - Only users with Admin role can update other users' profiles
    - Existing policy for users to update their own profile remains intact
*/

CREATE POLICY "Admins can update any profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (is_user_admin())
  WITH CHECK (is_user_admin());
