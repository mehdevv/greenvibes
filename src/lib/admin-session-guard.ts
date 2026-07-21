import { redirect } from "@tanstack/react-router";
import { supabaseAdmin } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/supabase";

type SessionCache = {
  userId: string | null;
  role: string | null;
  checkedAt: number;
};

let sessionCache: SessionCache | null = null;
const SESSION_CACHE_MS = 60_000;

export async function ensureOwnerAdminSession(loginPath = "/admin/login") {
  if (!isSupabaseConfigured) return;

  const now = Date.now();
  if (sessionCache && now - sessionCache.checkedAt < SESSION_CACHE_MS) {
    if (!sessionCache.userId) {
      throw redirect({ to: loginPath });
    }
    if (sessionCache.role === "worker") {
      throw redirect({ to: "/employe/login" });
    }
    return;
  }

  const { data: { session } } = await supabaseAdmin.auth.getSession();
  if (!session) {
    sessionCache = { userId: null, role: null, checkedAt: now };
    throw redirect({ to: loginPath });
  }

  const { data: profile } = await supabaseAdmin
    .from("admin_profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  sessionCache = {
    userId: session.user.id,
    role: profile?.role ?? null,
    checkedAt: now,
  };

  if (profile?.role === "worker") {
    throw redirect({ to: "/employe/login" });
  }
}

export function clearAdminSessionCache() {
  sessionCache = null;
}
