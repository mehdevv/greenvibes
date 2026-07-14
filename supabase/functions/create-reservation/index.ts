import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

type CreateReservationBody = {
  tripId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Méthode non autorisée" }, 405);
  }

  try {
    const body = (await req.json()) as CreateReservationBody;
    const { tripId, firstName, lastName, phone, location } = body;

    if (!tripId || !firstName?.trim() || !lastName?.trim() || !phone?.trim() || !location?.trim()) {
      return jsonResponse({ error: "Tous les champs sont requis" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.rpc("create_reservation", {
      p_trip_id: tripId,
      p_first_name: firstName.trim(),
      p_last_name: lastName.trim(),
      p_phone: phone.trim(),
      p_location: location.trim(),
    });

    if (error) {
      return jsonResponse({ error: error.message }, 400);
    }

    const result = data as {
      reservation_id: string;
      booking_ref: string;
      status: string;
      spots_remaining: number;
    };

    // Best-effort agency notification (does not block booking)
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const baseUrl = Deno.env.get("SUPABASE_URL");
    if (serviceKey && baseUrl && result.booking_ref) {
      fetch(`${baseUrl}/functions/v1/send-reservation-notification`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingRef: result.booking_ref }),
      }).catch(() => {});
    }

    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
