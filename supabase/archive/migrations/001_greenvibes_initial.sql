-- GreenVibes Platform — initial schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Admin profiles
CREATE TABLE public.admin_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'manager'
    CHECK (role IN ('super_admin', 'manager', 'commercial', 'reader')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Destinations
CREATE TABLE public.destinations (
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

-- Offers / trips
CREATE TABLE public.offers (
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

CREATE TABLE public.offer_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Trip sessions (departure dates)
CREATE TABLE public.trip_sessions (
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

-- Clients CRM
CREATE TABLE public.clients (
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

CREATE UNIQUE INDEX clients_email_unique ON public.clients (lower(email));

-- Bookings
CREATE TABLE public.bookings (
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

CREATE INDEX bookings_session_id_idx ON public.bookings(session_id);
CREATE INDEX bookings_status_idx ON public.bookings(status);
CREATE INDEX bookings_created_at_idx ON public.bookings(created_at DESC);

-- Blog
CREATE TABLE public.blog_posts (
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

-- Gallery
CREATE TABLE public.gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  storage_path text NOT NULL,
  destination_id uuid REFERENCES public.destinations(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Contact messages
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL DEFAULT '',
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Activity log
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER destinations_updated_at BEFORE UPDATE ON public.destinations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER offers_updated_at BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trip_sessions_updated_at BEFORE UPDATE ON public.trip_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Role helpers
CREATE OR REPLACE FUNCTION public.get_admin_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.admin_profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.can_write_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE id = auth.uid()
      AND role IN ('super_admin', 'manager', 'commercial')
  );
$$;

-- Booking reference generator
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

-- Create booking RPC (race-safe)
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

  SELECT * INTO v_session FROM public.trip_sessions
  WHERE id = p_session_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session introuvable';
  END IF;

  IF v_session.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cette session est annulée';
  END IF;

  v_remaining := v_session.capacity - v_session.booked_count;
  IF p_participants > v_remaining THEN
    RAISE EXCEPTION 'Places insuffisantes (% restantes)', v_remaining;
  END IF;

  SELECT * INTO v_offer FROM public.offers WHERE id = v_session.offer_id;
  IF NOT FOUND OR NOT v_offer.is_active THEN
    RAISE EXCEPTION 'Offre non disponible';
  END IF;

  v_total := v_offer.price_dzd * p_participants;

  SELECT id INTO v_client_id FROM public.clients WHERE lower(email) = lower(p_email);
  IF v_client_id IS NULL THEN
    INSERT INTO public.clients (first_name, last_name, email, phone)
    VALUES (p_first_name, p_last_name, p_email, COALESCE(p_phone, ''))
    RETURNING id INTO v_client_id;
  ELSE
    UPDATE public.clients
    SET first_name = p_first_name,
        last_name = p_last_name,
        phone = COALESCE(NULLIF(p_phone, ''), phone),
        updated_at = now()
    WHERE id = v_client_id;
  END IF;

  v_booking_ref := public.generate_booking_ref();

  INSERT INTO public.bookings (
    booking_ref, session_id, client_id,
    first_name, last_name, email, phone,
    participants, status, special_requests, total_price_dzd
  ) VALUES (
    v_booking_ref, p_session_id, v_client_id,
    p_first_name, p_last_name, p_email, COALESCE(p_phone, ''),
    p_participants, 'confirmed', p_special_requests, v_total
  ) RETURNING id INTO v_booking_id;

  UPDATE public.trip_sessions
  SET booked_count = booked_count + p_participants,
      status = CASE
        WHEN booked_count + p_participants >= capacity THEN 'full'
        ELSE 'open'
      END,
      updated_at = now()
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'booking_id', v_booking_id,
    'booking_ref', v_booking_ref,
    'status', 'confirmed',
    'total_price_dzd', v_total
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_booking TO anon, authenticated;

-- Setup check
CREATE OR REPLACE FUNCTION public.is_admin_setup_complete()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_profiles LIMIT 1);
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_setup_complete TO anon, authenticated;

-- RLS
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

-- Admin profiles policies
CREATE POLICY admin_profiles_select ON public.admin_profiles
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY admin_profiles_update_self ON public.admin_profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- Destinations
CREATE POLICY destinations_public_read ON public.destinations
  FOR SELECT TO anon, authenticated USING (is_published = true OR public.is_admin());
CREATE POLICY destinations_admin_write ON public.destinations
  FOR ALL TO authenticated USING (public.can_write_admin()) WITH CHECK (public.can_write_admin());

-- Offers
CREATE POLICY offers_public_read ON public.offers
  FOR SELECT TO anon, authenticated USING (is_active = true OR public.is_admin());
CREATE POLICY offers_admin_write ON public.offers
  FOR ALL TO authenticated USING (public.can_write_admin()) WITH CHECK (public.can_write_admin());

-- Offer images
CREATE POLICY offer_images_public_read ON public.offer_images
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.offers o WHERE o.id = offer_id AND (o.is_active OR public.is_admin()))
  );
CREATE POLICY offer_images_admin_write ON public.offer_images
  FOR ALL TO authenticated USING (public.can_write_admin()) WITH CHECK (public.can_write_admin());

-- Trip sessions
CREATE POLICY sessions_public_read ON public.trip_sessions
  FOR SELECT TO anon, authenticated
  USING (
    status != 'cancelled' AND EXISTS (
      SELECT 1 FROM public.offers o WHERE o.id = offer_id AND (o.is_active OR public.is_admin())
    )
  );
CREATE POLICY sessions_admin_write ON public.trip_sessions
  FOR ALL TO authenticated USING (public.can_write_admin()) WITH CHECK (public.can_write_admin());

-- Clients
CREATE POLICY clients_admin_all ON public.clients
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.can_write_admin());

-- Bookings
CREATE POLICY bookings_admin_all ON public.bookings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.can_write_admin());

-- Blog
CREATE POLICY blog_public_read ON public.blog_posts
  FOR SELECT TO anon, authenticated
  USING (published_at IS NOT NULL AND published_at <= now() OR public.is_admin());
CREATE POLICY blog_admin_write ON public.blog_posts
  FOR ALL TO authenticated USING (public.can_write_admin()) WITH CHECK (public.can_write_admin());

-- Gallery
CREATE POLICY gallery_public_read ON public.gallery_items
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY gallery_admin_write ON public.gallery_items
  FOR ALL TO authenticated USING (public.can_write_admin()) WITH CHECK (public.can_write_admin());

-- Contact messages
CREATE POLICY contact_public_insert ON public.contact_messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY contact_admin_all ON public.contact_messages
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.can_write_admin());

-- Activity log
CREATE POLICY activity_admin_read ON public.activity_log
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY activity_admin_insert ON public.activity_log
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-images', 'trip-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY trip_images_public_read ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'trip-images');

CREATE POLICY trip_images_admin_write ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'trip-images' AND public.can_write_admin())
  WITH CHECK (bucket_id = 'trip-images' AND public.can_write_admin());
