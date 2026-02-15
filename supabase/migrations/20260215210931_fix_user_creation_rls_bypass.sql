/*
  # Fix User Creation - Bypass RLS Properly

  ## Problem
  RLS policies may still be blocking the signup trigger even with SECURITY DEFINER

  ## Solution
  1. Update the INSERT policy to explicitly allow the trigger function
  2. Simplify the handle_new_user function
  3. Use security definer set to bypass RLS completely

  ## Security
  - RLS remains enabled
  - Function uses security definer with proper permissions
*/

-- Drop existing policy and create a simpler one
DROP POLICY IF EXISTS "Allow profile creation during signup" ON user_profiles;

-- Create policy that allows authenticated users to insert their own profile
CREATE POLICY "Allow authenticated user profile creation"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy for admins to insert any profile
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

-- Update function with better error handling and set search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- Get default role
  SELECT role_id INTO default_role_id
  FROM public.roles
  WHERE role_name = 'Read-Only Management'
  LIMIT 1;

  -- Check if role exists
  IF default_role_id IS NULL THEN
    RAISE EXCEPTION 'Default role not found';
  END IF;

  -- Insert user profile
  INSERT INTO public.user_profiles (
    user_id,
    role_id,
    full_name,
    mobile_number,
    email
  ) VALUES (
    NEW.id,
    default_role_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'mobile_number',
    NEW.email
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();
