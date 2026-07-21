-- =============================================================================
-- GreenVibes — COMPLETE DATABASE SCHEMA (single file)
-- Paste into Supabase → SQL Editor on a FRESH project (empty public schema).
--
-- Includes:
--   • Admin auth profiles + granular permissions + worker role
--   • Legacy CRM (destinations, offers, sessions, bookings, blog, gallery)
--   • V2 trips + reservations + trip sheets + CMS tables
--   • Storage buckets (trip-images, site-media)
--   • Realtime on trips, trip_sheets, trip_sheet_rows
--
-- No demo/seed data — add trips via /admin after setup.
--
-- After running:
--   1. Deploy edge functions (setup-admin, create-reservation, etc.)
--   2. Open /admin/login → create the first admin account
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
    CHECK (role IN ('super_admin', 'manager', 'commercial', 'reader', 'worker')),
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
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
    IF p_resource = 'tripLists' AND p_action <> 'read' THEN RETURN false; END IF;
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
    OR public.admin_has_permission('reservations', 'delete')
    OR public.admin_has_permission('tripLists', 'create')
    OR public.admin_has_permission('tripLists', 'update')
    OR public.admin_has_permission('tripLists', 'delete');
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
  IF v_session.status = 'cancelled' THEN RAISE EXCEPTION 'Cette session est annulÃ©e'; END IF;

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
  IF NOT public.can_write_admin() THEN RAISE EXCEPTION 'Permission refusÃ©e'; END IF;
  IF p_participants IS NULL OR p_participants < 1 THEN RAISE EXCEPTION 'Nombre de participants invalide'; END IF;
  IF p_status NOT IN ('pending', 'confirmed', 'paid', 'cancelled', 'completed') THEN RAISE EXCEPTION 'Statut invalide'; END IF;

  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'RÃ©servation introuvable'; END IF;

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
    IF v_session.status = 'cancelled' THEN RAISE EXCEPTION 'Cette session est annulÃ©e'; END IF;

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
-- V2 — Trips + reservations (public site)
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
  slug text,
  departure_date date,
  archived boolean NOT NULL DEFAULT false,
  list_columns jsonb NOT NULL DEFAULT '[
    {"id":"firstName","label":"PrÃ©nom"},
    {"id":"lastName","label":"Nom"},
    {"id":"phone","label":"TÃ©lÃ©phone"},
    {"id":"location","label":"Adresse"},
    {"id":"status","label":"Statut"},
    {"id":"bookingRef","label":"RÃ©fÃ©rence"}
  ]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (spots_taken <= capacity)
);

CREATE UNIQUE INDEX IF NOT EXISTS trips_slug_unique_idx
  ON public.trips (lower(slug))
  WHERE slug IS NOT NULL AND slug <> '';

CREATE INDEX IF NOT EXISTS trips_active_idx ON public.trips(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS trips_departure_idx ON public.trips (departure_date)
  WHERE departure_date IS NOT NULL AND archived = false;

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
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reservations_trip_id_idx ON public.reservations(trip_id);
CREATE INDEX IF NOT EXISTS reservations_created_at_idx ON public.reservations(created_at DESC);
CREATE INDEX IF NOT EXISTS reservations_trip_sort_idx
  ON public.reservations(trip_id, sort_order, created_at);

DROP TRIGGER IF EXISTS trips_updated_at ON public.trips;
CREATE TRIGGER trips_updated_at BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.trip_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trip_media_trip_idx ON public.trip_media (trip_id, sort_order);

CREATE TABLE IF NOT EXISTS public.trip_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  name text NOT NULL,
  columns jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS trip_sheets_one_default_per_trip_idx
  ON public.trip_sheets(trip_id)
  WHERE is_default = true;

CREATE TABLE IF NOT EXISTS public.trip_sheet_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id uuid NOT NULL REFERENCES public.trip_sheets(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  cells jsonb NOT NULL DEFAULT '{}'::jsonb,
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS trip_sheet_rows_reservation_id_idx
  ON public.trip_sheet_rows(reservation_id)
  WHERE reservation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS trip_sheets_trip_id_idx ON public.trip_sheets(trip_id, sort_order);
CREATE INDEX IF NOT EXISTS trip_sheet_rows_sheet_id_idx ON public.trip_sheet_rows(sheet_id, sort_order);

DROP TRIGGER IF EXISTS trip_sheets_updated_at ON public.trip_sheets;
CREATE TRIGGER trip_sheets_updated_at BEFORE UPDATE ON public.trip_sheets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trip_sheet_rows_updated_at ON public.trip_sheet_rows;
CREATE TRIGGER trip_sheet_rows_updated_at BEFORE UPDATE ON public.trip_sheet_rows
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.archive_expired_trips()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE public.trips
  SET archived = true, active = false, updated_at = now()
  WHERE departure_date IS NOT NULL
    AND departure_date < CURRENT_DATE
    AND archived = false;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

GRANT EXECUTE ON FUNCTION public.archive_expired_trips() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.normalize_phone(p text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN length(d) = 0 THEN ''
    WHEN length(d) <= 9 THEN d
    ELSE right(d, 9)
  END
  FROM (SELECT regexp_replace(trim(coalesce(p, '')), '[^0-9]', '', 'g') AS d) s;
$$;

CREATE OR REPLACE FUNCTION public.generate_reservation_ref()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
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
  v_phone_norm text;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.admin_has_permission('reservations', 'create') THEN
    RAISE EXCEPTION 'Permission refusÃ©e pour crÃ©er une rÃ©servation';
  END IF;

  IF trim(p_first_name) = '' OR trim(p_last_name) = '' OR trim(p_phone) = '' OR trim(p_location) = '' THEN
    RAISE EXCEPTION 'Tous les champs sont requis';
  END IF;

  v_phone_norm := public.normalize_phone(p_phone);
  IF length(v_phone_norm) < 9 THEN
    RAISE EXCEPTION 'NumÃ©ro de tÃ©lÃ©phone invalide';
  END IF;

  SELECT * INTO v_trip FROM public.trips WHERE id = p_trip_id FOR UPDATE;
  IF NOT FOUND OR NOT v_trip.active THEN
    RAISE EXCEPTION 'Voyage introuvable';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.reservations r
    WHERE r.trip_id = p_trip_id
      AND r.status <> 'cancelled'
      AND public.normalize_phone(r.phone) = v_phone_norm
  ) THEN
    RAISE EXCEPTION 'Ce numÃ©ro a dÃ©jÃ  une rÃ©servation pour cette sortie';
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

CREATE OR REPLACE FUNCTION public.update_trip_list_columns(
  p_trip_id uuid,
  p_columns jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non authentifiÃ©';
  END IF;

  IF NOT (
    public.admin_has_permission('tripLists', 'update')
    OR public.admin_has_permission('trips', 'update')
  ) THEN
    RAISE EXCEPTION 'Permission refusÃ©e pour modifier la structure des listes';
  END IF;

  IF jsonb_typeof(p_columns) IS DISTINCT FROM 'array' OR jsonb_array_length(p_columns) < 1 THEN
    RAISE EXCEPTION 'Au moins une colonne est requise';
  END IF;

  UPDATE public.trips
  SET list_columns = p_columns,
      updated_at = now()
  WHERE id = p_trip_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Voyage introuvable';
  END IF;

  RETURN p_columns;
END;
$$;

GRANT EXECUTE ON FUNCTION public.normalize_phone(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_reservation_ref() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_reservation(uuid, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_trip_list_columns(uuid, jsonb) TO authenticated;

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_sheet_rows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trips_public_read ON public.trips;
DROP POLICY IF EXISTS trips_admin_write ON public.trips;
DROP POLICY IF EXISTS trips_admin_insert ON public.trips;
DROP POLICY IF EXISTS trips_admin_update ON public.trips;
DROP POLICY IF EXISTS trips_admin_delete ON public.trips;
DROP POLICY IF EXISTS reservations_admin_all ON public.reservations;
DROP POLICY IF EXISTS reservations_admin_select ON public.reservations;
DROP POLICY IF EXISTS reservations_admin_insert ON public.reservations;
DROP POLICY IF EXISTS reservations_admin_update ON public.reservations;
DROP POLICY IF EXISTS reservations_admin_delete ON public.reservations;
DROP POLICY IF EXISTS reservations_public_insert ON public.reservations;
DROP POLICY IF EXISTS trip_media_public_read ON public.trip_media;
DROP POLICY IF EXISTS trip_media_admin_write ON public.trip_media;
DROP POLICY IF EXISTS trip_sheets_admin_select ON public.trip_sheets;
DROP POLICY IF EXISTS trip_sheets_admin_insert ON public.trip_sheets;
DROP POLICY IF EXISTS trip_sheets_admin_update ON public.trip_sheets;
DROP POLICY IF EXISTS trip_sheets_admin_delete ON public.trip_sheets;
DROP POLICY IF EXISTS trip_sheet_rows_admin_select ON public.trip_sheet_rows;
DROP POLICY IF EXISTS trip_sheet_rows_admin_insert ON public.trip_sheet_rows;
DROP POLICY IF EXISTS trip_sheet_rows_admin_update ON public.trip_sheet_rows;
DROP POLICY IF EXISTS trip_sheet_rows_admin_delete ON public.trip_sheet_rows;

CREATE POLICY trips_public_read ON public.trips
  FOR SELECT TO anon, authenticated USING (active = true OR public.is_admin());

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

CREATE POLICY reservations_public_insert ON public.reservations
  FOR INSERT TO anon, authenticated WITH CHECK (false);

CREATE POLICY trip_media_public_read ON public.trip_media
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_id
        AND (t.active = true OR public.is_admin())
    )
  );

CREATE POLICY trip_media_admin_write ON public.trip_media
  FOR ALL TO authenticated
  USING (public.can_write_admin())
  WITH CHECK (public.can_write_admin());

CREATE POLICY trip_sheets_admin_select ON public.trip_sheets
  FOR SELECT TO authenticated
  USING (public.admin_has_permission('tripLists', 'read'));

CREATE POLICY trip_sheets_admin_insert ON public.trip_sheets
  FOR INSERT TO authenticated
  WITH CHECK (public.admin_has_permission('tripLists', 'create'));

CREATE POLICY trip_sheets_admin_update ON public.trip_sheets
  FOR UPDATE TO authenticated
  USING (public.admin_has_permission('tripLists', 'update'))
  WITH CHECK (public.admin_has_permission('tripLists', 'update'));

CREATE POLICY trip_sheets_admin_delete ON public.trip_sheets
  FOR DELETE TO authenticated
  USING (public.admin_has_permission('tripLists', 'delete'));

CREATE POLICY trip_sheet_rows_admin_select ON public.trip_sheet_rows
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_sheets s
      WHERE s.id = trip_sheet_rows.sheet_id
        AND public.admin_has_permission('tripLists', 'read')
    )
  );

CREATE POLICY trip_sheet_rows_admin_insert ON public.trip_sheet_rows
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_sheets s
      WHERE s.id = trip_sheet_rows.sheet_id
        AND public.admin_has_permission('tripLists', 'create')
    )
  );

CREATE POLICY trip_sheet_rows_admin_update ON public.trip_sheet_rows
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_sheets s
      WHERE s.id = trip_sheet_rows.sheet_id
        AND public.admin_has_permission('tripLists', 'update')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_sheets s
      WHERE s.id = trip_sheet_rows.sheet_id
        AND public.admin_has_permission('tripLists', 'update')
    )
  );

CREATE POLICY trip_sheet_rows_admin_delete ON public.trip_sheet_rows
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_sheets s
      WHERE s.id = trip_sheet_rows.sheet_id
        AND public.admin_has_permission('tripLists', 'delete')
    )
  );

GRANT SELECT ON public.trip_media TO anon, authenticated;
GRANT ALL ON public.trip_media TO authenticated;

-- =============================================================================
-- Employee magic login tokens (edge function only)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.employee_login_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS employee_login_tokens_worker_active_idx
  ON public.employee_login_tokens (worker_id, created_at DESC)
  WHERE used_at IS NULL;

ALTER TABLE public.employee_login_tokens ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Homepage CMS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.site_images (
  slot text PRIMARY KEY,
  url text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  title text NOT NULL DEFAULT 'Souvenir GreenVibes',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_presentation_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  image_left boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_hero_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_media_layout (
  item_key text PRIMARY KEY,
  sort_order bigint NOT NULL DEFAULT 0,
  hidden boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_texts (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_presentation_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_hero_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_media_layout ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_texts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_images_public_read ON public.site_images;
DROP POLICY IF EXISTS site_images_admin_write ON public.site_images;
DROP POLICY IF EXISTS site_gallery_public_read ON public.site_gallery_items;
DROP POLICY IF EXISTS site_gallery_admin_write ON public.site_gallery_items;
DROP POLICY IF EXISTS site_presentation_public_read ON public.site_presentation_blocks;
DROP POLICY IF EXISTS site_presentation_admin_write ON public.site_presentation_blocks;
DROP POLICY IF EXISTS site_hero_videos_public_read ON public.site_hero_videos;
DROP POLICY IF EXISTS site_hero_videos_admin_write ON public.site_hero_videos;
DROP POLICY IF EXISTS site_media_layout_public_read ON public.site_media_layout;
DROP POLICY IF EXISTS site_media_layout_admin_write ON public.site_media_layout;
DROP POLICY IF EXISTS site_texts_public_read ON public.site_texts;
DROP POLICY IF EXISTS site_texts_admin_write ON public.site_texts;

CREATE POLICY site_images_public_read ON public.site_images
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY site_images_admin_write ON public.site_images
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.can_write_admin());

CREATE POLICY site_gallery_public_read ON public.site_gallery_items
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY site_gallery_admin_write ON public.site_gallery_items
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.can_write_admin());

CREATE POLICY site_presentation_public_read ON public.site_presentation_blocks
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY site_presentation_admin_write ON public.site_presentation_blocks
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.can_write_admin());

CREATE POLICY site_hero_videos_public_read ON public.site_hero_videos
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY site_hero_videos_admin_write ON public.site_hero_videos
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.can_write_admin());

CREATE POLICY site_media_layout_public_read ON public.site_media_layout
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY site_media_layout_admin_write ON public.site_media_layout
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.can_write_admin());

CREATE POLICY site_texts_public_read ON public.site_texts
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY site_texts_admin_write ON public.site_texts
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.can_write_admin());

GRANT SELECT ON public.site_images TO anon, authenticated;
GRANT ALL ON public.site_images TO authenticated;
GRANT SELECT ON public.site_gallery_items TO anon, authenticated;
GRANT ALL ON public.site_gallery_items TO authenticated;
GRANT SELECT ON public.site_presentation_blocks TO anon, authenticated;
GRANT ALL ON public.site_presentation_blocks TO authenticated;
GRANT SELECT ON public.site_hero_videos TO anon, authenticated;
GRANT ALL ON public.site_hero_videos TO authenticated;
GRANT SELECT ON public.site_media_layout TO anon, authenticated;
GRANT ALL ON public.site_media_layout TO authenticated;
GRANT SELECT ON public.site_texts TO anon, authenticated;
GRANT ALL ON public.site_texts TO authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-media', 'site-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS site_media_public_read ON storage.objects;
DROP POLICY IF EXISTS site_media_admin_write ON storage.objects;

CREATE POLICY site_media_public_read ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'site-media');

CREATE POLICY site_media_admin_write ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'site-media' AND public.can_write_admin())
  WITH CHECK (bucket_id = 'site-media' AND public.can_write_admin());

-- Super admin can update any team member profile
DROP POLICY IF EXISTS admin_profiles_update_super ON public.admin_profiles;
CREATE POLICY admin_profiles_update_super ON public.admin_profiles
  FOR UPDATE TO authenticated
  USING (public.get_admin_role() = 'super_admin')
  WITH CHECK (public.get_admin_role() = 'super_admin');

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'trips'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'trip_sheets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_sheets;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'trip_sheet_rows'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_sheet_rows;
  END IF;
END $$;

