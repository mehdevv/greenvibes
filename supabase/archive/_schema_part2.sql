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
    {"id":"firstName","label":"Prénom"},
    {"id":"lastName","label":"Nom"},
    {"id":"phone","label":"Téléphone"},
    {"id":"location","label":"Adresse"},
    {"id":"status","label":"Statut"},
    {"id":"bookingRef","label":"Référence"}
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
    RAISE EXCEPTION 'Permission refusée pour créer une réservation';
  END IF;

  IF trim(p_first_name) = '' OR trim(p_last_name) = '' OR trim(p_phone) = '' OR trim(p_location) = '' THEN
    RAISE EXCEPTION 'Tous les champs sont requis';
  END IF;

  v_phone_norm := public.normalize_phone(p_phone);
  IF length(v_phone_norm) < 9 THEN
    RAISE EXCEPTION 'Numéro de téléphone invalide';
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
    RAISE EXCEPTION 'Ce numéro a déjà une réservation pour cette sortie';
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
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  IF NOT (
    public.admin_has_permission('tripLists', 'update')
    OR public.admin_has_permission('trips', 'update')
  ) THEN
    RAISE EXCEPTION 'Permission refusée pour modifier la structure des listes';
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
