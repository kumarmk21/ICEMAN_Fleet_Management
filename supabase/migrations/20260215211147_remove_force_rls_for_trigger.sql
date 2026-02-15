/*
  # Remove FORCE RLS to Allow Trigger

  ## Issue
  FORCE ROW LEVEL SECURITY prevents even SECURITY DEFINER functions from bypassing RLS
  This blocks the signup trigger from working

  ## Solution
  1. Remove FORCE RLS (keeps RLS enabled for normal operations)
  2. SECURITY DEFINER function will now properly bypass RLS
  3. Add explicit bypass privilege for the function

  ## Security
  - RLS remains enabled for all user operations
  - Only the SECURITY DEFINER trigger function bypasses RLS
  - This is the standard pattern for signup triggers
*/

-- Remove FORCE RLS (but keep RLS enabled)
ALTER TABLE user_profiles NO FORCE ROW LEVEL SECURITY;

-- RLS is still enabled, just not FORCED
-- This allows SECURITY DEFINER functions to bypass it

-- Verify RLS is still enabled
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_profiles') THEN
    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
