import { getSiteOrigin } from "@/lib/trip-slug";

export type LoginPortal = "admin" | "employee";

export function getPortalLoginUrl(portal: LoginPortal): string {
  const origin = getSiteOrigin();
  return portal === "admin" ? `${origin}/admin/login` : `${origin}/employe/login`;
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
