-- Trip sheets: multiple editable lists per trip + row ordering on reservations

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS reservations_trip_sort_idx
  ON public.reservations(trip_id, sort_order, created_at);

-- Backfill sort_order for existing rows (preserve created_at order)
WITH ordered AS (
  SELECT id, row_number() OVER (PARTITION BY trip_id ORDER BY created_at) - 1 AS rn
  FROM public.reservations
)
UPDATE public.reservations r
SET sort_order = ordered.rn
FROM ordered
WHERE r.id = ordered.id AND r.sort_order = 0;

CREATE TABLE IF NOT EXISTS public.trip_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  name text NOT NULL,
  columns jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trip_sheet_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id uuid NOT NULL REFERENCES public.trip_sheets(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  cells jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trip_sheets_trip_id_idx ON public.trip_sheets(trip_id, sort_order);
CREATE INDEX IF NOT EXISTS trip_sheet_rows_sheet_id_idx ON public.trip_sheet_rows(sheet_id, sort_order);

DROP TRIGGER IF EXISTS trip_sheets_updated_at ON public.trip_sheets;
CREATE TRIGGER trip_sheets_updated_at BEFORE UPDATE ON public.trip_sheets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trip_sheet_rows_updated_at ON public.trip_sheet_rows;
CREATE TRIGGER trip_sheet_rows_updated_at BEFORE UPDATE ON public.trip_sheet_rows
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.trip_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_sheet_rows ENABLE ROW LEVEL SECURITY;

-- Extend can_write_admin to include tripLists
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

-- trip_sheets policies
DROP POLICY IF EXISTS trip_sheets_admin_select ON public.trip_sheets;
DROP POLICY IF EXISTS trip_sheets_admin_insert ON public.trip_sheets;
DROP POLICY IF EXISTS trip_sheets_admin_update ON public.trip_sheets;
DROP POLICY IF EXISTS trip_sheets_admin_delete ON public.trip_sheets;

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

-- trip_sheet_rows policies (inherit tripLists permissions)
DROP POLICY IF EXISTS trip_sheet_rows_admin_select ON public.trip_sheet_rows;
DROP POLICY IF EXISTS trip_sheet_rows_admin_insert ON public.trip_sheet_rows;
DROP POLICY IF EXISTS trip_sheet_rows_admin_update ON public.trip_sheet_rows;
DROP POLICY IF EXISTS trip_sheet_rows_admin_delete ON public.trip_sheet_rows;

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

-- Align commercial role: tripLists is read-only unless explicitly granted in JSONB
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

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'trip_sheets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_sheets;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'trip_sheet_rows'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_sheet_rows;
  END IF;
END $$;
