-- Prevent duplicate reservations: same phone cannot book the same trip twice.
-- Run in Supabase SQL Editor after fix_reservation_rpc.sql

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

GRANT EXECUTE ON FUNCTION public.normalize_phone(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_reservation(uuid, text, text, text, text) TO anon, authenticated;
