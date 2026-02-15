/*
  # Allow Trigger to Read Roles

  ## Issue
  The trigger function needs to read from the roles table to get the default role
  But the roles table has RLS that requires authentication
  The trigger runs without authentication context

  ## Solution
  Add a permissive policy to allow reading roles for signup operations
  Or remove FORCE RLS from roles table as well

  ## Security
  - Reading roles is safe as it only contains role definitions
  - No user data is exposed
  - INSERT and UPDATE on roles still requires admin
*/

-- Option 1: Remove FORCE RLS from roles (if it exists)
ALTER TABLE roles NO FORCE ROW LEVEL SECURITY;

-- Option 2: Add a permissive SELECT policy for system operations
DROP POLICY IF EXISTS "System can read roles" ON roles;
CREATE POLICY "System can read roles"
  ON roles FOR SELECT
  USING (true);

-- The above policy combined with the existing "Anyone authenticated can read roles"
-- creates an OR condition, allowing both authenticated users AND system operations
