import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

type Permissions = {
  trips: { read: boolean; create: boolean; update: boolean; delete: boolean };
  reservations: { read: boolean; create: boolean; update: boolean; delete: boolean };
};

function getBearerToken(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
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

function sanitizePermissions(input: Permissions | undefined): Permissions {
  const base = {
    trips: { read: false, create: false, update: false, delete: false },
    reservations: { read: false, create: false, update: false, delete: false },
  };
  if (!input) return base;
  for (const resource of ["trips", "reservations"] as const) {
    const src = input[resource];
    if (!src) continue;
    base[resource] = {
      read: Boolean(src.read),
      create: Boolean(src.create),
      update: Boolean(src.update),
      delete: Boolean(src.delete),
    };
  }
  return base;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const gate = await assertSuperAdmin(req);
    if ("error" in gate && gate.error) return gate.error;
    const { service, callerId } = gate;

    const body = await req.json();
    const action = String(body.action ?? "");

    if (action === "create") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      const fullName = String(body.fullName ?? "").trim();
      const permissions = sanitizePermissions(body.permissions);

      if (!email || !password || !fullName) {
        return jsonResponse({ error: "Email, mot de passe et nom requis" }, 400);
      }
      if (password.length < 8) {
        return jsonResponse({ error: "Mot de passe : 8 caractères minimum" }, 400);
      }

      const { data: authData, error: authError } = await service.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (authError || !authData.user) {
        return jsonResponse({ error: authError?.message ?? "Création échouée" }, 400);
      }

      const { error: profileError } = await service.from("admin_profiles").insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role: "worker",
        permissions,
      });

      if (profileError) {
        await service.auth.admin.deleteUser(authData.user.id);
        return jsonResponse({ error: profileError.message }, 400);
      }

      return jsonResponse({ ok: true, id: authData.user.id });
    }

    if (action === "update") {
      const id = String(body.id ?? "");
      if (!id) return jsonResponse({ error: "ID requis" }, 400);

      const { data: target } = await service
        .from("admin_profiles")
        .select("role")
        .eq("id", id)
        .maybeSingle();

      if (!target) return jsonResponse({ error: "Compte introuvable" }, 404);
      if (target.role === "super_admin") {
        return jsonResponse({ error: "Impossible de modifier le propriétaire" }, 400);
      }

      const updates: Record<string, unknown> = {};
      if (body.fullName) updates.full_name = String(body.fullName).trim();
      if (body.permissions) updates.permissions = sanitizePermissions(body.permissions);

      if (Object.keys(updates).length > 0) {
        const { error } = await service.from("admin_profiles").update(updates).eq("id", id);
        if (error) return jsonResponse({ error: error.message }, 400);
      }

      if (body.password) {
        const password = String(body.password);
        if (password.length < 8) {
          return jsonResponse({ error: "Mot de passe : 8 caractères minimum" }, 400);
        }
        const { error } = await service.auth.admin.updateUserById(id, { password });
        if (error) return jsonResponse({ error: error.message }, 400);
      }

      return jsonResponse({ ok: true });
    }

    if (action === "delete") {
      const id = String(body.id ?? "");
      if (!id) return jsonResponse({ error: "ID requis" }, 400);
      if (id === callerId) {
        return jsonResponse({ error: "Vous ne pouvez pas supprimer votre propre compte" }, 400);
      }

      const { data: target } = await service
        .from("admin_profiles")
        .select("role")
        .eq("id", id)
        .maybeSingle();

      if (!target) return jsonResponse({ error: "Compte introuvable" }, 404);
      if (target.role === "super_admin") {
        return jsonResponse({ error: "Impossible de supprimer le propriétaire" }, 400);
      }

      const { error } = await service.auth.admin.deleteUser(id);
      if (error) return jsonResponse({ error: error.message }, 400);

      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: "Action inconnue" }, 400);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
