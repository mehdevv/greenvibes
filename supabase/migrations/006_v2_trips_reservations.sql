-- GreenVibes v2 — simplified trips + reservations (cahier des charges)

CREATE TABLE IF NOT EXISTS public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  photo_url text,
  meeting_point text NOT NULL DEFAULT '',
  includes text[] NOT NULL DEFAULT '{}',
  price numeric(12, 2) NOT NULL DEFAULT 0,
  duration text NOT NULL DEFAULT '',
  capacity integer NOT NULL DEFAULT 12 CHECK (capacity > 0),
  spots_taken integer NOT NULL DEFAULT 0 CHECK (spots_taken >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (spots_taken <= capacity)
);

CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE RESTRICT,
  booking_ref text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,
  location text NOT NULL,
  status text NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'waitlisted', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reservations_trip_id_idx ON public.reservations(trip_id);
CREATE INDEX IF NOT EXISTS reservations_created_at_idx ON public.reservations(created_at DESC);
CREATE INDEX IF NOT EXISTS trips_active_idx ON public.trips(active) WHERE active = true;

DROP TRIGGER IF EXISTS trips_updated_at ON public.trips;
CREATE TRIGGER trips_updated_at BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.generate_reservation_ref()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  ref text;
  exists_ref boolean;
BEGIN
  LOOP
    ref := 'GV-' || to_char(now(), 'YYYYMMDD') || '-' ||
      upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));
    SELECT EXISTS(SELECT 1 FROM public.reservations WHERE booking_ref = ref) INTO exists_ref;
    EXIT WHEN NOT exists_ref;
  END LOOP;
  RETURN ref;
END;
$$;

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

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trips_public_read ON public.trips;
DROP POLICY IF EXISTS trips_admin_write ON public.trips;
DROP POLICY IF EXISTS reservations_admin_all ON public.reservations;
DROP POLICY IF EXISTS reservations_public_insert ON public.reservations;

CREATE POLICY trips_public_read ON public.trips
  FOR SELECT TO anon, authenticated USING (active = true OR public.is_admin());

CREATE POLICY trips_admin_write ON public.trips
  FOR ALL TO authenticated USING (public.can_write_admin()) WITH CHECK (public.can_write_admin());

CREATE POLICY reservations_admin_all ON public.reservations
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.can_write_admin());

CREATE POLICY reservations_public_insert ON public.reservations
  FOR INSERT TO anon, authenticated WITH CHECK (false);

-- Realtime (safe if already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'trips'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
  END IF;
END $$;
