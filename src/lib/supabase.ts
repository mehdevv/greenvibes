import { createClient, FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder",
);

async function getFunctionErrorMessage(
  name: string,
  error: unknown,
  data: unknown,
): Promise<string> {
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
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
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
