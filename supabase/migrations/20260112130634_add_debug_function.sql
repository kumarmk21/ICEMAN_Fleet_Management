/*
  # Add Debug Function
  
  Creates a function to help debug authentication and RLS issues
  by returning the current auth.uid() and user profile information.
*/

-- Create a function to check current auth state
CREATE OR REPLACE FUNCTION debug_auth_state()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'auth_uid', auth.uid(),
    'auth_role', current_user,
    'profile_exists', EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid()),
    'profile_data', (
      SELECT jsonb_build_object(
        'user_id', user_id,
        'email', email,
        'full_name', full_name,
        'role_id', role_id,
        'status', status
      )
      FROM user_profiles
      WHERE user_id = auth.uid()
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION debug_auth_state() TO authenticated;
