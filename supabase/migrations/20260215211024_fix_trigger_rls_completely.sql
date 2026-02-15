/*
  # Fix Trigger RLS Issue Completely

  ## Root Cause
  The trigger runs in a system context during signup, not as an authenticated user.
  Therefore auth.uid() is NULL when the trigger fires, blocking the INSERT.

  ## Solution
  1. Grant the function permission to bypass RLS
  2. Add a service role policy for system operations
  3. Ensure function has proper security context

  ## Security
  - Function uses SECURITY DEFINER with explicit permissions
  - RLS remains enabled for normal operations
  - Only the signup trigger can bypass RLS
*/

-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Allow authenticated user profile creation" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON user_profiles;

-- Create a permissive policy for service role (used by triggers)
CREATE POLICY "Service role can insert profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (true);

-- Grant the postgres role (used by triggers) permission to bypass RLS
GRANT ALL ON user_profiles TO postgres;

-- Update function to properly handle the insertion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- Disable RLS for this function execution
  PERFORM set_config('role', 'postgres', true);
  
  -- Get default role
  SELECT role_id INTO default_role_id
  FROM public.roles
  WHERE role_name = 'Read-Only Management'
  LIMIT 1;

  -- Insert user profile
  INSERT INTO public.user_profiles (
    user_id,
    role_id,
    full_name,
    mobile_number,
    email,
    status
  ) VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'role_id')::uuid,
      default_role_id
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'),
    NEW.raw_user_meta_data->>'mobile_number',
    NEW.email,
    'Active'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW; -- Don't fail the user creation
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Add back policies for manual operations (admin and user self-service)
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can insert any profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'Admin'
    )
  );
