-- Let guests load confirmation details by reference (anon cannot list all bookings via RLS)
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
  IF p_ref IS NULL OR length(trim(p_ref)) = 0 THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_row FROM public.bookings WHERE booking_ref = trim(p_ref);
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_session FROM public.trip_sessions WHERE id = v_row.session_id;
  SELECT * INTO v_offer FROM public.offers WHERE id = v_session.offer_id;

  RETURN jsonb_build_object(
    'id', v_row.id,
    'booking_ref', v_row.booking_ref,
    'session_id', v_row.session_id,
    'client_id', v_row.client_id,
    'first_name', v_row.first_name,
    'last_name', v_row.last_name,
    'email', v_row.email,
    'phone', v_row.phone,
    'participants', v_row.participants,
    'status', v_row.status,
    'special_requests', v_row.special_requests,
    'total_price_dzd', v_row.total_price_dzd,
    'created_at', v_row.created_at,
    'trip_sessions', jsonb_build_object(
      'id', v_session.id,
      'session_date', v_session.session_date,
      'offer_id', v_session.offer_id,
      'offer', jsonb_build_object(
        'id', v_offer.id,
        'title', v_offer.title,
        'slug', v_offer.slug
      )
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_booking_by_ref(text) TO anon, authenticated;
