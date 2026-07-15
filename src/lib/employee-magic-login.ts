import { getSiteOrigin } from "@/lib/trip-slug";

export function getEmployeeMagicLoginPath(token: string): string {
  return `/employe/entree/${token}`;
}

export function getEmployeeMagicLoginUrl(token: string): string {
  return `${getSiteOrigin()}${getEmployeeMagicLoginPath(token)}`;
}

/** Extract token from full magic login URL if pasted by user */
export function parseEmployeeMagicLoginUrl(input: string): string | null {
  try {
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("/employe/entree/")) {
      return trimmed.replace("/employe/entree/", "");
    }
    const url = new URL(trimmed);
    const match = url.pathname.match(/^\/employe\/entree\/([^/]+)$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
