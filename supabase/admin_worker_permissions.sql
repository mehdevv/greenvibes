-- Worker accounts with granular permissions (run in Supabase SQL Editor)
-- Grants per-resource CRUD on trips and reservations.

ALTER TABLE public.admin_profiles
  ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.admin_profiles DROP CONSTRAINT IF EXISTS admin_profiles_role_check;
ALTER TABLE public.admin_profiles
  ADD CONSTRAINT admin_profiles_role_check
  CHECK (role IN ('super_admin', 'manager', 'commercial', 'reader', 'worker'));

CREATE OR REPLACE FUNCTION public.admin_has_permission(p_resource text, p_action text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_perms jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  SELECT role, COALESCE(permissions, '{}'::jsonb)
  INTO v_role, v_perms
  FROM public.admin_profiles
  WHERE id = auth.uid();

  IF v_role IS NULL THEN
    RETURN false;
  END IF;

  IF v_role = 'super_admin' THEN
    RETURN true;
  END IF;

  IF v_perms ? p_resource AND v_perms->p_resource ? p_action THEN
    RETURN COALESCE((v_perms->p_resource->>p_action)::boolean, false);
  END IF;

  IF v_role = 'reader' THEN
    RETURN p_action = 'read';
  END IF;

  IF v_role = 'manager' THEN
    IF p_action = 'read' THEN RETURN true; END IF;
    IF p_action = 'delete' THEN RETURN false; END IF;
    RETURN true;
  END IF;

  IF v_role = 'commercial' THEN
    IF p_action = 'read' THEN RETURN true; END IF;
    IF p_resource = 'trips' THEN RETURN false; END IF;
    IF p_action = 'delete' THEN RETURN false; END IF;
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_write_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.admin_has_permission('trips', 'create')
    OR public.admin_has_permission('trips', 'update')
    OR public.admin_has_permission('trips', 'delete')
    OR public.admin_has_permission('reservations', 'create')
    OR public.admin_has_permission('reservations', 'update')
    OR public.admin_has_permission('reservations', 'delete');
$$;

-- Trips: split write policy
DROP POLICY IF EXISTS trips_admin_write ON public.trips;
DROP POLICY IF EXISTS trips_admin_insert ON public.trips;
DROP POLICY IF EXISTS trips_admin_update ON public.trips;
DROP POLICY IF EXISTS trips_admin_delete ON public.trips;

CREATE POLICY trips_admin_insert ON public.trips
  FOR INSERT TO authenticated
  WITH CHECK (public.admin_has_permission('trips', 'create'));

CREATE POLICY trips_admin_update ON public.trips
  FOR UPDATE TO authenticated
  USING (public.admin_has_permission('trips', 'update'))
  WITH CHECK (public.admin_has_permission('trips', 'update'));

CREATE POLICY trips_admin_delete ON public.trips
  FOR DELETE TO authenticated
  USING (public.admin_has_permission('trips', 'delete'));

-- Reservations: split admin policy
DROP POLICY IF EXISTS reservations_admin_all ON public.reservations;
DROP POLICY IF EXISTS reservations_admin_insert ON public.reservations;
DROP POLICY IF EXISTS reservations_admin_update ON public.reservations;
DROP POLICY IF EXISTS reservations_admin_delete ON public.reservations;

CREATE POLICY reservations_admin_select ON public.reservations
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY reservations_admin_insert ON public.reservations
  FOR INSERT TO authenticated
  WITH CHECK (public.admin_has_permission('reservations', 'create'));

CREATE POLICY reservations_admin_update ON public.reservations
  FOR UPDATE TO authenticated
  USING (public.admin_has_permission('reservations', 'update'))
  WITH CHECK (public.admin_has_permission('reservations', 'update'));

CREATE POLICY reservations_admin_delete ON public.reservations
  FOR DELETE TO authenticated
  USING (public.admin_has_permission('reservations', 'delete'));

-- Super admin can update any team member profile
DROP POLICY IF EXISTS admin_profiles_update_super ON public.admin_profiles;
CREATE POLICY admin_profiles_update_super ON public.admin_profiles
  FOR UPDATE TO authenticated
  USING (public.get_admin_role() = 'super_admin')
  WITH CHECK (public.get_admin_role() = 'super_admin');

-- Block authenticated staff without reservation create from using the public RPC
CREATE OR REPLACE FUNCTION public.create_reservation(
  p_trip_id uuid,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_location text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip public.trips%ROWTYPE;
  v_ref text;
  v_reservation_id uuid;
  v_status text;
  v_remaining integer;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.admin_has_permission('reservations', 'create') THEN
    RAISE EXCEPTION 'Permission refusée pour créer une réservation';
  END IF;

  IF trim(p_first_name) = '' OR trim(p_last_name) = '' OR trim(p_phone) = '' OR trim(p_location) = '' THEN
    RAISE EXCEPTION 'Tous les champs sont requis';
  END IF;

  SELECT * INTO v_trip FROM public.trips WHERE id = p_trip_id FOR UPDATE;
  IF NOT FOUND OR NOT v_trip.active THEN
    RAISE EXCEPTION 'Voyage introuvable';
  END IF;

  v_remaining := v_trip.capacity - v_trip.spots_taken;

  IF v_remaining <= 0 THEN
    v_status := 'waitlisted';
  ELSE
    v_status := 'confirmed';
    UPDATE public.trips
    SET spots_taken = spots_taken + 1,
        updated_at = now()
    WHERE id = p_trip_id;
  END IF;

  v_ref := public.generate_reservation_ref();

  INSERT INTO public.reservations (
    trip_id, booking_ref, first_name, last_name, phone, location, status
  ) VALUES (
    p_trip_id, v_ref, trim(p_first_name), trim(p_last_name), trim(p_phone), trim(p_location), v_status
  ) RETURNING id INTO v_reservation_id;

  RETURN jsonb_build_object(
    'reservation_id', v_reservation_id,
    'booking_ref', v_ref,
    'status', v_status,
    'spots_remaining', GREATEST(0, v_remaining - CASE WHEN v_status = 'confirmed' THEN 1 ELSE 0 END)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_reservation TO anon, authenticated;
