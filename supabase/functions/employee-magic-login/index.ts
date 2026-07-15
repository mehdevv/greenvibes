import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const TOKEN_TTL_HOURS = 72;

function getBearerToken(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function getSiteOrigin(req: Request): string {
  const fromEnv = Deno.env.get("SITE_URL")?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const origin = req.headers.get("origin")?.trim();
  if (origin) return origin.replace(/\/$/, "");
  return "https://greenvibes-ten.vercel.app";
}

async function assertSuperAdmin(req: Request) {
  const token = getBearerToken(req);
  if (!token) {
    return { error: jsonResponse({ error: "Non authentifié" }, 401) };
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) {
    return { error: jsonResponse({ error: "Session invalide" }, 401) };
  }

  const service = createClient(url, serviceKey);
  const { data: profile, error: profileError } = await service
    .from("admin_profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "super_admin") {
    return { error: jsonResponse({ error: "Réservé au propriétaire" }, 403) };
  }

  return { service, callerId: authData.user.id };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action = String(body.action ?? "");
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const service = createClient(url, serviceKey);

    if (action === "create") {
      const gate = await assertSuperAdmin(req);
      if ("error" in gate && gate.error) return gate.error;

      const workerId = String(body.workerId ?? "");
      if (!workerId) return jsonResponse({ error: "workerId requis" }, 400);

      const { data: worker, error: workerError } = await service
        .from("admin_profiles")
        .select("id, email, role, full_name")
        .eq("id", workerId)
        .maybeSingle();

      if (workerError || !worker) {
        return jsonResponse({ error: "Employé introuvable" }, 404);
      }
      if (worker.role !== "worker") {
        return jsonResponse({ error: "Réservé aux comptes employés" }, 400);
      }

      await service
        .from("employee_login_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("worker_id", workerId)
        .is("used_at", null);

      const rawToken = randomToken();
      const tokenHash = await hashToken(rawToken);
      const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString();

      const { error: insertError } = await service.from("employee_login_tokens").insert({
        worker_id: workerId,
        token_hash: tokenHash,
        expires_at: expiresAt,
        created_by: gate.callerId,
      });

      if (insertError) {
        return jsonResponse({ error: insertError.message }, 400);
      }

      const loginUrl = `${getSiteOrigin(req)}/employe/entree/${rawToken}`;

      return jsonResponse({
        ok: true,
        loginUrl,
        expiresAt,
        workerName: worker.full_name || worker.email,
      });
    }

    if (action === "redeem") {
      const rawToken = String(body.token ?? "").trim();
      if (!rawToken || rawToken.length < 16) {
        return jsonResponse({ error: "Lien invalide" }, 400);
      }

      const tokenHash = await hashToken(rawToken);
      const { data: pending, error: lookupError } = await service
        .from("employee_login_tokens")
        .select("id, worker_id, expires_at, used_at")
        .eq("token_hash", tokenHash)
        .maybeSingle();

      if (lookupError || !pending) {
        return jsonResponse({ error: "Lien invalide ou expiré" }, 400);
      }
      if (pending.used_at) {
        return jsonResponse({ error: "Ce lien a déjà été utilisé" }, 400);
      }
      if (new Date(pending.expires_at).getTime() < Date.now()) {
        return jsonResponse({ error: "Ce lien a expiré" }, 400);
      }

      const { data: worker, error: workerError } = await service
        .from("admin_profiles")
        .select("id, email, role")
        .eq("id", pending.worker_id)
        .maybeSingle();

      if (workerError || !worker || worker.role !== "worker") {
        return jsonResponse({ error: "Compte employé invalide" }, 400);
      }

      const redirectTo = `${getSiteOrigin(req)}/employe/inscriptions`;
      const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
        type: "magiclink",
        email: worker.email,
        options: { redirectTo },
      });

      if (linkError || !linkData?.properties) {
        return jsonResponse({ error: linkError?.message ?? "Connexion impossible" }, 500);
      }

      const actionLink = linkData.properties.action_link;
      const tokenHashOtp = linkData.properties.hashed_token;
      if (!actionLink && !tokenHashOtp) {
        return jsonResponse({ error: "Connexion impossible" }, 500);
      }

      const { data: claimed, error: claimError } = await service
        .from("employee_login_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", pending.id)
        .is("used_at", null)
        .select("id")
        .maybeSingle();

      if (claimError || !claimed) {
        return jsonResponse({ error: "Ce lien a déjà été utilisé" }, 400);
      }

      return jsonResponse({
        ok: true,
        action_link: actionLink,
        token_hash: tokenHashOtp,
        email: worker.email,
        verification_type: linkData.properties.verification_type ?? "magiclink",
      });
    }

    return jsonResponse({ error: "Action inconnue" }, 400);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
