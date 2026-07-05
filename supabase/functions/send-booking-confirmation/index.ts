import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { bookingRef } = await req.json();
    if (!bookingRef) {
      return new Response(JSON.stringify({ error: "bookingRef requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*, trip_sessions(session_date, offers(title))")
      .eq("booking_ref", bookingRef)
      .single();

    if (error || !booking) {
      return new Response(JSON.stringify({ error: "Réservation introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = booking.trip_sessions as {
      session_date: string;
      offers: { title: string };
    };
    const offerTitle = session?.offers?.title ?? "Circuit GreenVibes";

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const html = `
        <h2>Confirmation de réservation — GreenVibes</h2>
        <p>Bonjour ${booking.first_name} ${booking.last_name},</p>
        <p>Votre réservation <strong>${booking.booking_ref}</strong> est confirmée.</p>
        <ul>
          <li>Circuit : ${offerTitle}</li>
          <li>Date : ${session?.session_date}</li>
          <li>Participants : ${booking.participants}</li>
          <li>Total : ${booking.total_price_dzd} DA</li>
        </ul>
        <p>À bientôt pour votre aventure en Algérie !<br/>L'équipe GreenVibes</p>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: Deno.env.get("RESEND_FROM") ?? "GreenVibes <onboarding@resend.dev>",
          to: [booking.email],
          subject: `Confirmation ${booking.booking_ref} — GreenVibes`,
          html,
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true, emailed: Boolean(resendKey) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
