/*
  # Update handle_new_user function

  1. Changes
    - Update handle_new_user function to use metadata for role_id and phone
    - Add email sync to user_profiles on user creation
  
  2. Behavior
    - Uses role_id from metadata if provided, otherwise defaults to Read-Only Management
    - Uses phone from metadata if provided
    - Syncs email to user_profiles
*/

-- Update function to handle metadata properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- Get default role (Read-Only Management)
  SELECT role_id INTO default_role_id
  FROM roles
  WHERE role_name = 'Read-Only Management'
  LIMIT 1;

  -- Insert user profile with metadata or defaults
  INSERT INTO public.user_profiles (
    user_id,
    role_id,
    full_name,
    phone,
    email
  )
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'role_id')::uuid,
      default_role_id
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.email
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
