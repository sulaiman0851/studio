-- Policy to allow 'admin' role to update any profile
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- Policy to allow 'admin' role to select all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- Policy to allow 'admin' role to insert profiles (if needed, though auth.users trigger handles this)
-- CREATE POLICY "Admins can insert profiles"
--   ON public.profiles FOR INSERT
--   WITH CHECK ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- Policy to allow 'admin' role to delete profiles (if needed)
-- CREATE POLICY "Admins can delete profiles"
--   ON public.profiles FOR DELETE
--   USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );
