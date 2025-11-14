-- Step 1: Create a function to get the current user's role.
-- This function breaks the recursive loop in RLS policies.
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop the old, recursive policies.
-- We need to drop them before creating the new ones.
-- The names are exactly as we defined them in 03_admin_update_policy.sql.
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Step 3: Recreate the policies using the new function.
-- This avoids the recursive call.

-- Policy to allow 'admin' role to update any profile
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING ( get_my_role() = 'admin' );

-- Policy to allow 'admin' role to select all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING ( get_my_role() = 'admin' );

-- Re-apply the policy for users to see their own profile, which might have been implicitly dropped or needs to be ordered.
-- It's good practice to be explicit.
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING ( auth.uid() = id );
