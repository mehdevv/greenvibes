-- Shared list columns per trip + row moves between sheets

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS list_columns jsonb;

UPDATE public.trips
SET list_columns = '[
  {"id":"firstName","label":"Prénom"},
  {"id":"lastName","label":"Nom"},
  {"id":"phone","label":"Téléphone"},
  {"id":"location","label":"Adresse"},
  {"id":"status","label":"Statut"},
  {"id":"bookingRef","label":"Référence"}
]'::jsonb
WHERE list_columns IS NULL;

ALTER TABLE public.trips
  ALTER COLUMN list_columns SET DEFAULT '[
    {"id":"firstName","label":"Prénom"},
    {"id":"lastName","label":"Nom"},
    {"id":"phone","label":"Téléphone"},
    {"id":"location","label":"Adresse"},
    {"id":"status","label":"Statut"},
    {"id":"bookingRef","label":"Référence"}
  ]'::jsonb;

ALTER TABLE public.trips
  ALTER COLUMN list_columns SET NOT NULL;

ALTER TABLE public.trip_sheets
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

ALTER TABLE public.trip_sheet_rows
  ADD COLUMN IF NOT EXISTS reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS trip_sheet_rows_reservation_id_idx
  ON public.trip_sheet_rows(reservation_id)
  WHERE reservation_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS trip_sheets_one_default_per_trip_idx
  ON public.trip_sheets(trip_id)
  WHERE is_default = true;

-- Default "Participants" sheet per trip
INSERT INTO public.trip_sheets (trip_id, name, sort_order, is_default, columns)
SELECT t.id, 'Participants', 0, true, t.list_columns
FROM public.trips t
WHERE NOT EXISTS (
  SELECT 1 FROM public.trip_sheets s
  WHERE s.trip_id = t.id AND s.is_default = true
);

-- Mark first sheet as default if none marked yet
WITH first_sheet AS (
  SELECT DISTINCT ON (trip_id) id, trip_id
  FROM public.trip_sheets
  ORDER BY trip_id, sort_order, created_at
)
UPDATE public.trip_sheets s
SET is_default = true
FROM first_sheet f
WHERE s.id = f.id
  AND NOT EXISTS (
    SELECT 1 FROM public.trip_sheets d
    WHERE d.trip_id = s.trip_id AND d.is_default = true
  );

-- Backfill rows from existing reservations
INSERT INTO public.trip_sheet_rows (sheet_id, sort_order, reservation_id, cells)
SELECT
  s.id,
  r.sort_order,
  r.id,
  jsonb_build_object(
    'firstName', r.first_name,
    'lastName', r.last_name,
    'phone', r.phone,
    'location', r.location,
    'status', r.status,
    'bookingRef', r.booking_ref
  )
FROM public.reservations r
JOIN public.trip_sheets s ON s.trip_id = r.trip_id AND s.is_default = true
WHERE NOT EXISTS (
  SELECT 1 FROM public.trip_sheet_rows sr WHERE sr.reservation_id = r.id
);

-- Sync trip list_columns from first sheet if trips still have generic defaults
UPDATE public.trips t
SET list_columns = s.columns
FROM public.trip_sheets s
WHERE s.trip_id = t.id
  AND s.is_default = true
  AND jsonb_array_length(s.columns) > 0
  AND s.columns <> t.list_columns
  AND EXISTS (
    SELECT 1 FROM public.trip_sheets x
    WHERE x.trip_id = t.id AND x.columns <> '[]'::jsonb
  );
