-- Ensure admin writers can read all destinations (admin UI + FK checks on offers.destination_id)
CREATE POLICY destinations_writer_read ON public.destinations
  FOR SELECT TO authenticated
  USING (public.can_write_admin());

-- Split FOR ALL write policy so SELECT is not duplicated/conflicting
DROP POLICY IF EXISTS destinations_admin_write ON public.destinations;

CREATE POLICY destinations_admin_insert ON public.destinations
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_admin());

CREATE POLICY destinations_admin_update ON public.destinations
  FOR UPDATE TO authenticated
  USING (public.can_write_admin())
  WITH CHECK (public.can_write_admin());

CREATE POLICY destinations_admin_delete ON public.destinations
  FOR DELETE TO authenticated
  USING (public.can_write_admin());
