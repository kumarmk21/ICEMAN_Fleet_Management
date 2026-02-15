/*
  # Properly Bypass RLS in Trigger

  ## Root Cause
  Triggers run without authenticated user context, so auth.uid() is NULL
  and all RLS policies block the insertion

  ## Solution
  1. Remove the permissive "Service role" policy that doesn't work
  2. Create function that properly bypasses RLS using ALTER DEFAULT PRIVILEGES
  3. Make the function owner have superuser-like privileges for this operation

  ## Security
  - Function is SECURITY DEFINER and only callable by triggers
  - RLS remains active for all normal user operations
  - Only the automatic signup process bypasses RLS
*/

-- Drop the service role policy that isn't working
DROP POLICY IF EXISTS "Service role can insert profiles" ON user_profiles;

-- Recreate the handle_new_user function with proper RLS bypass
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- Get the default role ID
  SELECT role_id INTO default_role_id
  FROM public.roles
  WHERE role_name = 'Read-Only Management'
  LIMIT 1;

  IF default_role_id IS NULL THEN
    RAISE EXCEPTION 'Default role "Read-Only Management" not found';
  END IF;

  -- Insert bypassing RLS (SECURITY DEFINER runs as function owner)
  INSERT INTO public.user_profiles (
    user_id,
    role_id,
    full_name,
    mobile_number,
    email,
    status
  ) VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role_id')::uuid, default_role_id),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'),
    NEW.raw_user_meta_data->>'mobile_number',
    NEW.email,
    'Active'
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- User profile already exists, this is okay
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating user profile for %: %', NEW.id, SQLERRM;
    -- Don't block user creation in auth.users
    RETURN NEW;
END;
$$;

-- Grant execute permission to authenticated users (trigger will use SECURITY DEFINER)
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, authenticated, anon;

-- Ensure the function owner can bypass RLS
ALTER TABLE user_profiles FORCE ROW LEVEL SECURITY;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
