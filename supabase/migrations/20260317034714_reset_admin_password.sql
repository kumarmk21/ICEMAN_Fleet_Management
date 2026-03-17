/*
  # Reset Admin User Password
  
  Updates the password for admin@iceman.com to Admin@123
  This ensures you can log in with the correct credentials.
*/

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the user ID for admin@iceman.com
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'admin@iceman.com';

  IF v_user_id IS NOT NULL THEN
    -- Update the password
    UPDATE auth.users
    SET 
      encrypted_password = crypt('Admin@123', gen_salt('bf')),
      updated_at = now()
    WHERE id = v_user_id;

    RAISE NOTICE 'Password reset successfully for admin@iceman.com';
    RAISE NOTICE 'You can now login with:';
    RAISE NOTICE 'Email: admin@iceman.com';
    RAISE NOTICE 'Password: Admin@123';
  ELSE
    RAISE NOTICE 'User admin@iceman.com not found';
  END IF;
END $$;