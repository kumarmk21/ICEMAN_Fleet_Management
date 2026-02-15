/*
  # Fix All RLS Policies to Prevent Recursion
  
  ## Solution
  1. Create SECURITY DEFINER function for role checks
  2. Drop ALL existing user_profiles policies
  3. Create new simplified policies
*/

-- Create a SECURITY DEFINER function to check user roles without RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(user_id_param uuid, role_names text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT r.role_name INTO user_role
  FROM user_profiles up
  JOIN roles r ON up.role_id = r.role_id
  WHERE up.user_id = user_id_param;
  
  RETURN user_role = ANY(role_names);
END;
$$;

-- Drop ALL existing policies on user_profiles
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'user_profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON user_profiles', pol.policyname);
  END LOOP;
END $$;

-- Create new simplified policies

CREATE POLICY "Users read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), ARRAY['Admin']));

CREATE POLICY "Admins insert profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), ARRAY['Admin']));

CREATE POLICY "Users update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), ARRAY['Admin']))
  WITH CHECK (public.has_role(auth.uid(), ARRAY['Admin']));

CREATE POLICY "Admins delete profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), ARRAY['Admin']));