import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password, fullName } = await req.json();

    if (!email || !password || !fullName) {
      return jsonResponse({ error: "Champs requis manquants" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { count } = await supabase
      .from("admin_profiles")
      .select("id", { count: "exact", head: true });

    if ((count ?? 0) > 0) {
      return jsonResponse({ error: "Un administrateur existe déjà" }, 400);
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return jsonResponse({ error: authError?.message ?? "Création échouée" }, 400);
    }

    const { error: profileError } = await supabase.from("admin_profiles").insert({
      id: authData.user.id,
      email,
      full_name: fullName,
      role: "super_admin",
    });

    if (profileError) {
      return jsonResponse({ error: profileError.message }, 400);
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
