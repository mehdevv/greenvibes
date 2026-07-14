-- Trip enhancements: departure dates, auto-archive, multi-media
-- Run in Supabase SQL Editor after 006_v2_trips_reservations.sql

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS departure_date date,
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS trips_departure_idx ON public.trips (departure_date)
  WHERE departure_date IS NOT NULL AND archived = false;

-- Archive trips whose departure date has passed
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

-- Multiple images/videos per trip
CREATE TABLE IF NOT EXISTS public.trip_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trip_media_trip_idx ON public.trip_media (trip_id, sort_order);

ALTER TABLE public.trip_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trip_media_public_read ON public.trip_media;
DROP POLICY IF EXISTS trip_media_admin_write ON public.trip_media;

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

GRANT SELECT ON public.trip_media TO anon, authenticated;
GRANT ALL ON public.trip_media TO authenticated;
