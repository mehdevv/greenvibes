import { createClient, type SupabaseClient, FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js";

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
/** Valid JWT shape — only used when env is missing so the app can boot offline */
const PLACEHOLDER_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDY5NzgxMjAsImV4cCI6MTk2MjU1NDEyMH0.dc_Xq_iYekNbGRi4SzOaHzmMeDlao5cB4DnmjrjqEME";

function cleanEnv(value: unknown): string {
  if (value == null) return "";
  const s = String(value).trim().replace(/^["']|["']$/g, "");
  if (!s || s === "undefined" || s === "null") return "";
  if (/your[-_]?project|YOUR_PROJECT|example\.com/i.test(s)) return "";
  return s;
}

function resolveSupabaseUrl(raw: string): string {
  if (!raw) return "";
  if (raw.startsWith("sb_") || raw.startsWith("sbp_") || raw.startsWith("eyJ")) return "";

  let candidate = raw;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    if (!parsed.hostname.includes(".")) return "";
    return parsed.origin;
  } catch {
    return "";
  }
}

const resolvedUrl = resolveSupabaseUrl(cleanEnv(import.meta.env.VITE_SUPABASE_URL));
const resolvedKey = cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const isSupabaseConfigured = Boolean(resolvedUrl && resolvedKey);

export const supabaseConfigHint = isSupabaseConfigured
  ? null
  : "Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans votre fichier .env (ou les variables d'environnement de déploiement).";

function createSafeClient(storageKey: string): SupabaseClient {
  const url = isSupabaseConfigured ? resolvedUrl : PLACEHOLDER_URL;
  const key = isSupabaseConfigured ? resolvedKey : PLACEHOLDER_KEY;

  try {
    return createClient(url, key, {
      auth: {
        storageKey,
        persistSession: isSupabaseConfigured,
        autoRefreshToken: isSupabaseConfigured,
      },
    });
  } catch {
    return createClient(PLACEHOLDER_URL, PLACEHOLDER_KEY, {
      auth: { storageKey, persistSession: false, autoRefreshToken: false },
    });
  }
}

/** Owner / manager admin session — separate storage from employee portal */
export const supabaseAdmin = createSafeClient("gv-admin-auth");

/** Employee session — can coexist with admin session in another tab */
export const supabaseEmployee = createSafeClient("gv-employee-auth");

/** @deprecated Prefer supabaseAdmin or getActiveSupabase() */
export const supabase = supabaseAdmin;

export function getActiveSupabase(): SupabaseClient {
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/employe")) {
    return supabaseEmployee;
  }
  return supabaseAdmin;
}

async function getFunctionErrorMessage(
  name: string,
  error: unknown,
  data: unknown,
): Promise<string> {
  if (!isSupabaseConfigured) {
    return "Supabase n'est pas configuré. Vérifiez les variables d'environnement.";
  }

  if (data && typeof data === "object" && "error" in data && data.error) {
    return String(data.error);
  }

  if (error instanceof FunctionsFetchError) {
    return `Impossible de joindre la fonction "${name}". Déployez-la dans Supabase.`;
  }

  if (error instanceof FunctionsHttpError && error.context instanceof Response) {
    if (error.context.status === 404) {
      return `La fonction "${name}" n'est pas déployée.`;
    }
    try {
      const body = await error.context.clone().json();
      if (body && typeof body === "object") {
        if ("error" in body && body.error) return String(body.error);
        if ("message" in body && body.message) return String(body.message);
      }
    } catch {
      // fall through
    }
  }

  if (error instanceof Error) return error.message;
  return "La requête a échoué";
}

export async function invokeFunction<T>(
  name: string,
  body?: Record<string, unknown>,
  client: SupabaseClient = getActiveSupabase(),
): Promise<T> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase n'est pas configuré.");
  }

  const { data, error } = await client.functions.invoke(name, { body });
  if (error) throw new Error(await getFunctionErrorMessage(name, error, data));
  if (data?.error) throw new Error(data.error);
  return data as T;
}

/** Unsplash IDs that no longer resolve — treat as missing */
const BROKEN_IMAGE_URL_FRAGMENTS = ["photo-1476514525535-07fb3b4e5a1e"];

function isBrokenImageUrl(url: string): boolean {
  return BROKEN_IMAGE_URL_FRAGMENTS.some((fragment) => url.includes(fragment));
}

export function getPublicImageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) {
    return isBrokenImageUrl(path) ? "" : path;
  }
  if (!isSupabaseConfigured) return "";
  const { data } = supabase.storage.from("trip-images").getPublicUrl(path);
  return data.publicUrl;
}

/** Resolves DB/storage paths with a guaranteed fallback image */
export function resolveCoverImage(
  path: string | null | undefined,
  fallback: string,
): string {
  return getPublicImageUrl(path) || fallback;
}
