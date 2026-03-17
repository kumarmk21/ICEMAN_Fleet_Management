/*
  # Create Initial Admin User
  
  Creates an admin user account:
  - Email: admin@iceman.com
  - Password: Admin@123
  - Role: Admin
  - Full Name: System Administrator
*/

DO $$
DECLARE
  v_user_id uuid;
  v_admin_role_id uuid;
  v_existing_user_id uuid;
BEGIN
  SELECT role_id INTO v_admin_role_id 
  FROM roles 
  WHERE role_name = 'Admin' 
  LIMIT 1;

  SELECT id INTO v_existing_user_id 
  FROM auth.users 
  WHERE email = 'admin@iceman.com';

  IF v_existing_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'admin@iceman.com',
      crypt('Admin@123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'full_name', 'System Administrator',
        'role_id', v_admin_role_id::text
      ),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    INSERT INTO auth.identities (
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', 'admin@iceman.com',
        'email_verified', true,
        'provider', 'email'
      ),
      'email',
      now(),
      now(),
      now()
    );

    RAISE NOTICE 'Admin user created successfully!';
    RAISE NOTICE 'Email: admin@iceman.com';
    RAISE NOTICE 'Password: Admin@123';
  ELSE
    RAISE NOTICE 'Admin user already exists';
  END IF;
END $$;