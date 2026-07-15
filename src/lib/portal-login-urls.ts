import { getSiteOrigin } from "@/lib/trip-slug";

export type LoginPortal = "admin" | "employee";

export function getPortalLoginPath(portal: LoginPortal): "/admin/login" | "/employe/login" {
  return portal === "admin" ? "/admin/login" : "/employe/login";
}

export function getPortalLoginUrl(portal: LoginPortal): string {
  const origin = getSiteOrigin();
  return `${origin}${getPortalLoginPath(portal)}`;
}

export const PORTAL_LOGIN_META: Record<
  LoginPortal,
  { title: string; description: string; label: string }
> = {
  admin: {
    title: "Admin propriétaire",
    description: "Connexion réservée au propriétaire et aux gestionnaires.",
    label: "Lien admin",
  },
  employee: {
    title: "Espace employé",
    description: "Connexion dédiée aux comptes employés — indépendante de l'admin.",
    label: "Lien employé",
  },
};
