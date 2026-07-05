-- Admin booking update with seat management
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
  IF NOT public.can_write_admin() THEN
    RAISE EXCEPTION 'Permission refusée';
  END IF;

  IF p_participants IS NULL OR p_participants < 1 THEN
    RAISE EXCEPTION 'Nombre de participants invalide';
  END IF;

  IF p_status NOT IN ('pending', 'confirmed', 'paid', 'cancelled', 'completed') THEN
    RAISE EXCEPTION 'Statut invalide';
  END IF;

  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Réservation introuvable';
  END IF;

  v_new_session_id := COALESCE(p_session_id, v_booking.session_id);
  v_old_active := v_booking.status <> 'cancelled';
  v_new_active := p_status <> 'cancelled';

  IF v_old_active THEN
    v_new_booked := GREATEST(0, (
      SELECT booked_count FROM public.trip_sessions WHERE id = v_booking.session_id
    ) - v_booking.participants);

    UPDATE public.trip_sessions
    SET booked_count = v_new_booked,
        status = CASE
          WHEN status = 'cancelled' THEN 'cancelled'
          WHEN v_new_booked >= capacity THEN 'full'
          ELSE 'open'
        END,
        updated_at = now()
    WHERE id = v_booking.session_id;
  END IF;

  IF v_new_active THEN
    SELECT * INTO v_session FROM public.trip_sessions WHERE id = v_new_session_id FOR UPDATE;
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
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Offre introuvable';
    END IF;

    v_total := COALESCE(p_total_price_dzd, v_offer.price_dzd * p_participants);

    v_new_booked := v_session.booked_count + p_participants;

    UPDATE public.trip_sessions
    SET booked_count = v_new_booked,
        status = CASE
          WHEN v_new_booked >= capacity THEN 'full'
          ELSE 'open'
        END,
        updated_at = now()
    WHERE id = v_new_session_id;
  ELSE
    v_total := COALESCE(p_total_price_dzd, v_booking.total_price_dzd);
  END IF;

  IF v_booking.client_id IS NOT NULL THEN
    UPDATE public.clients
    SET first_name = p_first_name,
        last_name = p_last_name,
        email = p_email,
        phone = COALESCE(NULLIF(p_phone, ''), phone),
        updated_at = now()
    WHERE id = v_booking.client_id;
  END IF;

  UPDATE public.bookings
  SET first_name = p_first_name,
      last_name = p_last_name,
      email = p_email,
      phone = COALESCE(p_phone, ''),
      participants = p_participants,
      status = p_status,
      special_requests = p_special_requests,
      session_id = v_new_session_id,
      total_price_dzd = v_total,
      updated_at = now()
  WHERE id = p_booking_id;

  RETURN to_jsonb((SELECT b FROM public.bookings b WHERE b.id = p_booking_id));
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_booking TO authenticated;
