import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { bookingRef } = await req.json();
    if (!bookingRef) {
      return jsonResponse({ error: "bookingRef requis" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: reservation, error } = await supabase
      .from("reservations")
      .select("*, trips(title, duration, price, meeting_point)")
      .eq("booking_ref", bookingRef)
      .single();

    if (error || !reservation) {
      return jsonResponse({ error: "Réservation introuvable" }, 404);
    }

    const trip = reservation.trips as {
      title: string;
      duration: string;
      price: number;
      meeting_point: string;
    } | null;

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const notifyEmail = Deno.env.get("AGENCY_NOTIFY_EMAIL");

    if (resendKey && notifyEmail) {
      const html = `
        <h2>Nouvelle réservation — GreenVibes</h2>
        <p><strong>Référence :</strong> ${reservation.booking_ref}</p>
        <p><strong>Statut :</strong> ${reservation.status}</p>
        <p><strong>Voyageur :</strong> ${reservation.first_name} ${reservation.last_name}</p>
        <p><strong>Téléphone :</strong> ${reservation.phone}</p>
        <p><strong>Adresse :</strong> ${reservation.location}</p>
        <ul>
          <li>Sortie : ${trip?.title ?? "—"}</li>
          <li>Durée : ${trip?.duration ?? "—"}</li>
          <li>Prix : ${trip?.price ?? "—"} DA</li>
          <li>Rendez-vous : ${trip?.meeting_point ?? "—"}</li>
        </ul>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: Deno.env.get("RESEND_FROM") ?? "GreenVibes <onboarding@resend.dev>",
          to: [notifyEmail],
          subject: `Nouvelle réservation ${reservation.booking_ref}`,
          html,
        }),
      });
    }

    return jsonResponse({ ok: true, emailed: Boolean(resendKey && notifyEmail) });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
