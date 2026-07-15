-- Custom short links for trips (e.g. /r/gouraya)
-- Run in Supabase SQL Editor after trip_enhancements.sql

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS slug text;

CREATE UNIQUE INDEX IF NOT EXISTS trips_slug_unique_idx
  ON public.trips (lower(slug))
  WHERE slug IS NOT NULL AND slug <> '';
