-- Allow updating trip list columns via tripLists.update OR trips.update

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

GRANT EXECUTE ON FUNCTION public.update_trip_list_columns(uuid, jsonb) TO authenticated;
