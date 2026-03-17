/*
  # Fix handle_new_user Trigger Function

  1. Updates the handle_new_user function to remove reference to non-existent 'phone' column
  2. Uses only columns that exist in user_profiles table: user_id, role_id, full_name, email, mobile_number
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_role_id uuid;
BEGIN
  SELECT role_id INTO default_role_id
  FROM roles
  WHERE role_name = 'Read-Only Management'
  LIMIT 1;

  INSERT INTO public.user_profiles (
    user_id,
    role_id,
    full_name,
    mobile_number,
    email
  )
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'role_id')::uuid,
      default_role_id
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'mobile_number',
    NEW.email
  );

  RETURN NEW;
END;
$$;