-- Allow authenticated users to read their own admin profile (fixes profile load after login)
CREATE POLICY admin_profiles_select_self ON public.admin_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());
