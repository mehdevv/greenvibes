-- =============================================================================
-- GreenVibes — COMPLETE PLATFORM SQL
-- Run once in Supabase → SQL Editor (fresh project or empty public schema)
--
-- Includes:
--   • Admin auth profiles + RLS
--   • Legacy CRM (destinations, offers, sessions, bookings, blog, gallery)
--   • V2 public site (trips + reservations + realtime)
--   • Storage bucket for trip images
--   • Demo seed data
--
-- After running:
--   1. Open your app → /admin/login → create the first admin account
--   2. Confirm Realtime is on for `trips` (Database → Replication)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 001 — Initial schema
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'manager'
    CHECK (role IN ('super_admin', 'manager', 'commercial', 'reader')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  tag text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  cover_image text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  is_published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id uuid REFERENCES public.destinations(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  price_dzd numeric(12, 2) NOT NULL DEFAULT 0,
  duration_label text NOT NULL DEFAULT '',
  offer_type text NOT NULL DEFAULT 'mer'
    CHECK (offer_type IN ('mer', 'montagne', 'culture', 'aventure')),
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  cover_image text,
  is_active boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.offer_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trip_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  capacity integer NOT NULL DEFAULT 12 CHECK (capacity > 0),
  booked_count integer NOT NULL DEFAULT 0 CHECK (booked_count >= 0),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'full', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (offer_id, session_date),
  CHECK (booked_count <= capacity)
);

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  notes text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS clients_email_unique ON public.clients (lower(email));

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref text NOT NULL UNIQUE,
  session_id uuid NOT NULL REFERENCES public.trip_sessions(id) ON DELETE RESTRICT,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  participants integer NOT NULL DEFAULT 1 CHECK (participants > 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled', 'completed')),
  special_requests text,
  total_price_dzd numeric(12, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookings_session_id_idx ON public.bookings(session_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON public.bookings(status);
CREATE INDEX IF NOT EXISTS bookings_created_at_idx ON public.bookings(created_at DESC);

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  cover_image text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  storage_path text NOT NULL,
  destination_id uuid REFERENCES public.destinations(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL DEFAULT '',
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS destinations_updated_at ON public.destinations;
CREATE TRIGGER destinations_updated_at BEFORE UPDATE ON public.destinations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS offers_updated_at ON public.offers;
CREATE TRIGGER offers_updated_at BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trip_sessions_updated_at ON public.trip_sessions;
CREATE TRIGGER trip_sessions_updated_at BEFORE UPDATE ON public.trip_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS clients_updated_at ON public.clients;
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS bookings_updated_at ON public.bookings;
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.get_admin_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.admin_profiles WHERE id = auth.uid(); $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid()); $$;

CREATE OR REPLACE FUNCTION public.can_write_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE id = auth.uid()
      AND role IN ('super_admin', 'manager', 'commercial')
  );
$$;

CREATE OR REPLACE FUNCTION public.generate_booking_ref()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  ref text;
  exists_ref boolean;
BEGIN
  LOOP
    ref := 'GV-' || to_char(now(), 'YYYYMMDD') || '-' ||
      upper(substr(encode(gen_random_bytes(3), 'hex'), 1, 4));
    SELECT EXISTS(SELECT 1 FROM public.bookings WHERE booking_ref = ref) INTO exists_ref;
    EXIT WHEN NOT exists_ref;
  END LOOP;
  RETURN ref;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_booking(
  p_session_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_participants integer,
  p_special_requests text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.trip_sessions%ROWTYPE;
  v_offer public.offers%ROWTYPE;
  v_client_id uuid;
  v_booking_id uuid;
  v_booking_ref text;
  v_total numeric(12, 2);
  v_remaining integer;
BEGIN
  IF p_participants IS NULL OR p_participants < 1 THEN
    RAISE EXCEPTION 'Nombre de participants invalide';
  END IF;

  SELECT * INTO v_session FROM public.trip_sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Session introuvable'; END IF;
  IF v_session.status = 'cancelled' THEN RAISE EXCEPTION 'Cette session est annulée'; END IF;

  v_remaining := v_session.capacity - v_session.booked_count;
  IF p_participants > v_remaining THEN
    RAISE EXCEPTION 'Places insuffisantes (% restantes)', v_remaining;
  END IF;

  SELECT * INTO v_offer FROM public.offers WHERE id = v_session.offer_id;
  IF NOT FOUND OR NOT v_offer.is_active THEN RAISE EXCEPTION 'Offre non disponible'; END IF;

  v_total := v_offer.price_dzd * p_participants;

  SELECT id INTO v_client_id FROM public.clients WHERE lower(email) = lower(p_email);
  IF v_client_id IS NULL THEN
    INSERT INTO public.clients (first_name, last_name, email, phone)
    VALUES (p_first_name, p_last_name, p_email, COALESCE(p_phone, ''))
    RETURNING id INTO v_client_id;
  ELSE
    UPDATE public.clients
    SET first_name = p_first_name, last_name = p_last_name,
        phone = COALESCE(NULLIF(p_phone, ''), phone), updated_at = now()
    WHERE id = v_client_id;
  END IF;

  v_booking_ref := public.generate_booking_ref();

  INSERT INTO public.bookings (
    booking_ref, session_id, client_id, first_name, last_name, email, phone,
    participants, status, special_requests, total_price_dzd
  ) VALUES (
    v_booking_ref, p_session_id, v_client_id, p_first_name, p_last_name, p_email,
    COALESCE(p_phone, ''), p_participants, 'confirmed', p_special_requests, v_total
  ) RETURNING id INTO v_booking_id;

  UPDATE public.trip_sessions
  SET booked_count = booked_count + p_participants,
      status = CASE WHEN booked_count + p_participants >= capacity THEN 'full' ELSE 'open' END,
      updated_at = now()
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'booking_id', v_booking_id, 'booking_ref', v_booking_ref,
    'status', 'confirmed', 'total_price_dzd', v_total
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_booking TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_admin_setup_complete()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.admin_profiles LIMIT 1); $$;

GRANT EXECUTE ON FUNCTION public.is_admin_setup_complete TO anon, authenticated;

-- RLS (legacy tables)
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_profiles_select ON public.admin_profiles;
DROP POLICY IF EXISTS admin_profiles_update_self ON public.admin_profiles;
DROP POLICY IF EXISTS destinations_public_read ON public.destinations;
DROP POLICY IF EXISTS destinations_admin_write ON public.destinations;
DROP POLICY IF EXISTS offers_public_read ON public.offers;
DROP POLICY IF EXISTS offers_admin_write ON public.offers;
DROP POLICY IF EXISTS offer_images_public_read ON public.offer_images;
DROP POLICY IF EXISTS offer_images_admin_write ON public.offer_images;
DROP POLICY IF EXISTS sessions_public_read ON public.trip_sessions;
DROP POLICY IF EXISTS sessions_admin_write ON public.trip_sessions;
DROP POLICY IF EXISTS clients_admin_all ON public.clients;
DROP POLICY IF EXISTS bookings_admin_all ON public.bookings;
DROP POLICY IF EXISTS blog_public_read ON public.blog_posts;
DROP POLICY IF EXISTS blog_admin_write ON public.blog_posts;
DROP POLICY IF EXISTS gallery_public_read ON public.gallery_items;
DROP POLICY IF EXISTS gallery_admin_write ON public.gallery_items;
DROP POLICY IF EXISTS contact_public_insert ON public.contact_messages;
DROP POLICY IF EXISTS contact_admin_all ON public.contact_messages;
DROP POLICY IF EXISTS activity_admin_read ON public.activity_log;
DROP POLICY IF EXISTS activity_admin_insert ON public.activity_log;

CREATE POLICY admin_profiles_select ON public.admin_profiles
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY admin_profiles_update_self ON public.admin_profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY destinations_public_read ON public.destinations
  FOR SELECT TO anon, authenticated USING (is_published = true OR public.is_admin());
CREATE POLICY offers_public_read ON public.offers
  FOR SELECT TO anon, authenticated USING (is_active = true OR public.is_admin());
CREATE POLICY offers_admin_write ON public.offers
  FOR ALL TO authenticated USING (public.can_write_admin()) WITH CHECK (public.can_write_admin());
CREATE POLICY offer_images_public_read ON public.offer_images
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.offers o WHERE o.id = offer_id AND (o.is_active OR public.is_admin())));
CREATE POLICY offer_images_admin_write ON public.offer_images
  FOR ALL TO authenticated USING (public.can_write_admin()) WITH CHECK (public.can_write_admin());
CREATE POLICY sessions_public_read ON public.trip_sessions
  FOR SELECT TO anon, authenticated
  USING (status != 'cancelled' AND EXISTS (
    SELECT 1 FROM public.offers o WHERE o.id = offer_id AND (o.is_active OR public.is_admin())
  ));
CREATE POLICY sessions_admin_write ON public.trip_sessions
  FOR ALL TO authenticated USING (public.can_write_admin()) WITH CHECK (public.can_write_admin());
CREATE POLICY clients_admin_all ON public.clients
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.can_write_admin());
CREATE POLICY bookings_admin_all ON public.bookings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.can_write_admin());
CREATE POLICY blog_public_read ON public.blog_posts
  FOR SELECT TO anon, authenticated
  USING (published_at IS NOT NULL AND published_at <= now() OR public.is_admin());
CREATE POLICY blog_admin_write ON public.blog_posts
  FOR ALL TO authenticated USING (public.can_write_admin()) WITH CHECK (public.can_write_admin());
CREATE POLICY gallery_public_read ON public.gallery_items
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY gallery_admin_write ON public.gallery_items
  FOR ALL TO authenticated USING (public.can_write_admin()) WITH CHECK (public.can_write_admin());
CREATE POLICY contact_public_insert ON public.contact_messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY contact_admin_all ON public.contact_messages
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.can_write_admin());
CREATE POLICY activity_admin_read ON public.activity_log
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY activity_admin_insert ON public.activity_log
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-images', 'trip-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS trip_images_public_read ON storage.objects;
DROP POLICY IF EXISTS trip_images_admin_write ON storage.objects;
CREATE POLICY trip_images_public_read ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'trip-images');
CREATE POLICY trip_images_admin_write ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'trip-images' AND public.can_write_admin())
  WITH CHECK (bucket_id = 'trip-images' AND public.can_write_admin());

-- =============================================================================
-- 002 — Admin profile self-read
-- =============================================================================

DROP POLICY IF EXISTS admin_profiles_select_self ON public.admin_profiles;
CREATE POLICY admin_profiles_select_self ON public.admin_profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

-- =============================================================================
-- 003 — Destinations writer read + split write policies
-- =============================================================================

DROP POLICY IF EXISTS destinations_writer_read ON public.destinations;
CREATE POLICY destinations_writer_read ON public.destinations
  FOR SELECT TO authenticated USING (public.can_write_admin());

DROP POLICY IF EXISTS destinations_admin_insert ON public.destinations;
DROP POLICY IF EXISTS destinations_admin_update ON public.destinations;
DROP POLICY IF EXISTS destinations_admin_delete ON public.destinations;

CREATE POLICY destinations_admin_insert ON public.destinations
  FOR INSERT TO authenticated WITH CHECK (public.can_write_admin());
CREATE POLICY destinations_admin_update ON public.destinations
  FOR UPDATE TO authenticated
  USING (public.can_write_admin()) WITH CHECK (public.can_write_admin());
CREATE POLICY destinations_admin_delete ON public.destinations
  FOR DELETE TO authenticated USING (public.can_write_admin());

-- =============================================================================
-- 004 — Public booking lookup by reference
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_booking_by_ref(p_ref text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.bookings%ROWTYPE;
  v_session public.trip_sessions%ROWTYPE;
  v_offer public.offers%ROWTYPE;
BEGIN
  IF p_ref IS NULL OR length(trim(p_ref)) = 0 THEN RETURN NULL; END IF;

  SELECT * INTO v_row FROM public.bookings WHERE booking_ref = trim(p_ref);
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT * INTO v_session FROM public.trip_sessions WHERE id = v_row.session_id;
  SELECT * INTO v_offer FROM public.offers WHERE id = v_session.offer_id;

  RETURN jsonb_build_object(
    'id', v_row.id, 'booking_ref', v_row.booking_ref, 'session_id', v_row.session_id,
    'client_id', v_row.client_id, 'first_name', v_row.first_name, 'last_name', v_row.last_name,
    'email', v_row.email, 'phone', v_row.phone, 'participants', v_row.participants,
    'status', v_row.status, 'special_requests', v_row.special_requests,
    'total_price_dzd', v_row.total_price_dzd, 'created_at', v_row.created_at,
    'trip_sessions', jsonb_build_object(
      'id', v_session.id, 'session_date', v_session.session_date,
      'offer_id', v_session.offer_id,
      'offer', jsonb_build_object('id', v_offer.id, 'title', v_offer.title, 'slug', v_offer.slug)
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_booking_by_ref(text) TO anon, authenticated;

-- =============================================================================
-- 005 — Admin booking update with seat management
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_update_booking(
  p_booking_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_participants integer,
  p_status text,
  p_special_requests text DEFAULT NULL,
  p_session_id uuid DEFAULT NULL,
  p_total_price_dzd numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_new_session_id uuid;
  v_old_active boolean;
  v_new_active boolean;
  v_session public.trip_sessions%ROWTYPE;
  v_offer public.offers%ROWTYPE;
  v_remaining integer;
  v_total numeric(12, 2);
  v_new_booked integer;
BEGIN
  IF NOT public.can_write_admin() THEN RAISE EXCEPTION 'Permission refusée'; END IF;
  IF p_participants IS NULL OR p_participants < 1 THEN RAISE EXCEPTION 'Nombre de participants invalide'; END IF;
  IF p_status NOT IN ('pending', 'confirmed', 'paid', 'cancelled', 'completed') THEN RAISE EXCEPTION 'Statut invalide'; END IF;

  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Réservation introuvable'; END IF;

  v_new_session_id := COALESCE(p_session_id, v_booking.session_id);
  v_old_active := v_booking.status <> 'cancelled';
  v_new_active := p_status <> 'cancelled';

  IF v_old_active THEN
    v_new_booked := GREATEST(0, (
      SELECT booked_count FROM public.trip_sessions WHERE id = v_booking.session_id
    ) - v_booking.participants);
    UPDATE public.trip_sessions
    SET booked_count = v_new_booked,
        status = CASE WHEN status = 'cancelled' THEN 'cancelled'
                      WHEN v_new_booked >= capacity THEN 'full' ELSE 'open' END,
        updated_at = now()
    WHERE id = v_booking.session_id;
  END IF;

  IF v_new_active THEN
    SELECT * INTO v_session FROM public.trip_sessions WHERE id = v_new_session_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Session introuvable'; END IF;
    IF v_session.status = 'cancelled' THEN RAISE EXCEPTION 'Cette session est annulée'; END IF;

    v_remaining := v_session.capacity - v_session.booked_count;
    IF p_participants > v_remaining THEN RAISE EXCEPTION 'Places insuffisantes (% restantes)', v_remaining; END IF;

    SELECT * INTO v_offer FROM public.offers WHERE id = v_session.offer_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Offre introuvable'; END IF;

    v_total := COALESCE(p_total_price_dzd, v_offer.price_dzd * p_participants);
    v_new_booked := v_session.booked_count + p_participants;

    UPDATE public.trip_sessions
    SET booked_count = v_new_booked,
        status = CASE WHEN v_new_booked >= capacity THEN 'full' ELSE 'open' END,
        updated_at = now()
    WHERE id = v_new_session_id;
  ELSE
    v_total := COALESCE(p_total_price_dzd, v_booking.total_price_dzd);
  END IF;

  IF v_booking.client_id IS NOT NULL THEN
    UPDATE public.clients
    SET first_name = p_first_name, last_name = p_last_name, email = p_email,
        phone = COALESCE(NULLIF(p_phone, ''), phone), updated_at = now()
    WHERE id = v_booking.client_id;
  END IF;

  UPDATE public.bookings
  SET first_name = p_first_name, last_name = p_last_name, email = p_email,
      phone = COALESCE(p_phone, ''), participants = p_participants, status = p_status,
      special_requests = p_special_requests, session_id = v_new_session_id,
      total_price_dzd = v_total, updated_at = now()
  WHERE id = p_booking_id;

  RETURN to_jsonb((SELECT b FROM public.bookings b WHERE b.id = p_booking_id));
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_booking TO authenticated;

-- =============================================================================
-- 006 — V2 trips + reservations (public one-page site)
-- =============================================================================

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
      upper(substr(encode(gen_random_bytes(3), 'hex'), 1, 4));
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
  IF NOT FOUND OR NOT v_trip.active THEN RAISE EXCEPTION 'Voyage introuvable'; END IF;

  v_remaining := v_trip.capacity - v_trip.spots_taken;

  IF v_remaining <= 0 THEN
    v_status := 'waitlisted';
  ELSE
    v_status := 'confirmed';
    UPDATE public.trips SET spots_taken = spots_taken + 1, updated_at = now() WHERE id = p_trip_id;
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'trips'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
  END IF;
END $$;

-- =============================================================================
-- SEED — Legacy demo data (destinations, offers, sessions, blog, gallery)
-- =============================================================================

INSERT INTO public.destinations (id, slug, title, tag, description, cover_image, latitude, longitude, is_published, sort_order) VALUES
  ('d1000000-0000-4000-8000-000000000001', 'parc-gouraya', 'Parc National de Gouraya', 'Montagne',
   'Sentiers boisés, panoramas sur la Méditerranée et faune locale au cœur du parc national.',
   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1024&q=80', 36.7667, 5.0833, true, 1),
  ('d1000000-0000-4000-8000-000000000002', 'criques-tichy', 'Criques de Tichy', 'Mer',
   'Eaux turquoise et criques secrètes accessibles en bateau ou par sentier côtier.',
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1024&q=80', 36.7500, 5.1000, true, 2),
  ('d1000000-0000-4000-8000-000000000003', 'gorges-kherrata', 'Gorges de Kherrata', 'Aventure',
   'Canyon spectaculaire, ponts naturels et randonnées pour les amateurs de sensations.',
   'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1024&q=80', 36.5000, 4.7500, true, 3),
  ('d1000000-0000-4000-8000-000000000004', 'corniche-bejaia', 'Corniche de Béjaïa', 'Coucher de soleil',
   'Promenade en bord de mer, couchers de soleil et ambiance méditerranéenne.',
   'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1024&q=80', 36.7525, 5.0553, true, 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.offers (id, destination_id, slug, title, description, price_dzd, duration_label, offer_type, features, cover_image, is_active, is_featured, sort_order) VALUES
  ('e1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001',
   'excursion-journee', 'Excursion à la journée',
   'Une journée guidée entre criques, sentiers et déjeuner local.',
   3500, 'Journée', 'montagne',
   '["Guide francophone", "Transport A/R", "Déjeuner inclus"]'::jsonb,
   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1024&q=80', true, false, 1),
  ('e1000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000002',
   'weekend-decouverte', 'Week-end découverte',
   'Deux jours entre mer et montagne avec nuit en maison d''hôtes.',
   12900, '2 jours', 'mer',
   '["Hébergement", "Deux excursions", "Petits-déjeuners"]'::jsonb,
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1024&q=80', true, true, 2),
  ('e1000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000003',
   'sejour-authentique', 'Séjour authentique',
   'Cinq jours pour explorer la Kabylie côtière en petit groupe.',
   34500, '5 jours', 'aventure',
   '["Circuit complet", "Groupe de 8 max.", "Rencontres locales"]'::jsonb,
   'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1024&q=80', true, false, 3),
  ('e1000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000002',
   'criques-tichy-demi-journee', 'Criques de Tichy — Demi-journée',
   'Découverte des criques emblématiques de Tichy en petit groupe.',
   2900, 'Demi-journée', 'mer',
   '["Guide local", "Snorkeling", "Collation"]'::jsonb,
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1024&q=80', true, false, 4),
  ('e1000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000004',
   'corniche-soiree', 'Corniche — Soirée coucher de soleil',
   'Balade guidée sur la corniche avec pause thé et photos au coucher du soleil.',
   1800, 'Soirée', 'culture',
   '["Guide", "Thé local", "Transport"]'::jsonb,
   'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1024&q=80', true, false, 5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.trip_sessions (offer_id, session_date, capacity, booked_count, status)
SELECT o.id, d::date, 12, 0, 'open'
FROM public.offers o
CROSS JOIN generate_series(current_date + 1, current_date + 60, '1 day') AS d
WHERE o.is_active = true
  AND (extract(dow from d) IN (0, 5, 6) OR random() < 0.15)
ON CONFLICT (offer_id, session_date) DO NOTHING;

INSERT INTO public.blog_posts (slug, title, excerpt, body, cover_image, published_at) VALUES
  ('decouvrir-bejaia', '5 raisons de découvrir Béjaïa cette saison',
   'Entre mer et montagne, la perle de la Petite Kabylie séduit les voyageurs.',
   'Béjaïa offre un mélange unique de paysages côtiers et de montagnes verdoyantes. Que vous soyez amateur de randonnée, de plage ou de culture locale, vous trouverez votre bonheur...',
   'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=1200&q=80', now() - interval '3 days'),
  ('gouraya-guide', 'Guide pratique : randonner au Parc de Gouraya',
   'Conseils, équipement et meilleures saisons pour explorer le parc national.',
   'Le Parc National de Gouraya est l''un des joyaux de l''Algérie. Voici tout ce qu''il faut savoir avant de partir...',
   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80', now() - interval '10 days')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.gallery_items (title, storage_path, destination_id, sort_order) VALUES
  ('Baie de Béjaïa', 'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=1200&q=80', NULL, 1),
  ('Gouraya', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80', 'd1000000-0000-4000-8000-000000000001', 2),
  ('Criques', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80', 'd1000000-0000-4000-8000-000000000002', 3),
  ('Montagnes', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80', 'd1000000-0000-4000-8000-000000000003', 4),
  ('Équipe', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80', NULL, 5);

-- =============================================================================
-- SEED — V2 demo trips (public homepage + /reservation/:tripId)
-- =============================================================================

INSERT INTO public.trips (id, title, description, photo_url, meeting_point, includes, price, duration, capacity, spots_taken, active) VALUES
  (
    'a1000000-0000-4000-8000-000000000001',
    'Criques de Tichy — Demi-journée',
    'On part ensemble découvrir les criques emblématiques de Tichy : eau claire, falaises et bonne humeur. Idéal pour une première sortie avec nous.',
    NULL,
    'Front de mer, Béjaïa — point de rendez-vous envoyé après réservation',
    ARRAY['Guide local', 'Snack sur la plage', 'Photos de groupe'],
    2900, 'Demi-journée', 12, 3, true
  ),
  (
    'a1000000-0000-4000-8000-000000000002',
    'Week-end découverte',
    'Deux jours entre mer et montagne : on dort chez l''habitant, on randonne le matin, on finit les pieds dans l''eau l''après-midi.',
    NULL,
    'Gare routière de Béjaïa',
    ARRAY['Hébergement 1 nuit', 'Petits-déjeuners', 'Transport sur place'],
    12900, '2 jours', 10, 7, true
  ),
  (
    'a1000000-0000-4000-8000-000000000003',
    'Gorges de Kherrata',
    'Sentiers, ponts naturels et panoramas — une journée d''aventure accessible, en petit groupe, sans prise de tête.',
    NULL,
    'Parking entrée gorges — Kherrata',
    ARRAY['Guide', 'Collation', 'Transport A/R depuis Béjaïa'],
    3500, 'Journée', 14, 14, true
  ),
  (
    'a1000000-0000-4000-8000-000000000004',
    'Corniche — Soirée coucher de soleil',
    'On marche le long de la corniche, on s''arrête pour un thé, on admire le soleil qui tombe sur la Méditerranée.',
    NULL,
    'Place du 1er Novembre, Béjaïa',
    ARRAY['Guide', 'Thé local', 'Transport'],
    1800, 'Soirée', 16, 2, true
  ),
  (
    'a1000000-0000-4000-8000-000000000005',
    'Parc de Gouraya',
    'Randonnée douce dans le parc national : forêts, vue sur la baie, pique-nique au sommet.',
    NULL,
    'Entrée principale du parc, Gouraya',
    ARRAY['Guide', 'Pique-nique', 'Transport'],
    3200, 'Journée', 12, 5, true
  )
ON CONFLICT (id) DO NOTHING;
