import type { Trip } from "@/api/types";

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "blog",
  "contact",
  "destinations",
  "galerie",
  "login",
  "offres",
  "reservation",
  "reservations",
  "r",
  "setup",
  "trips",
  "employe",
  "entree",
  "a-propos",
  "index",
]);

export function normalizeTripSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function slugifyTripTitle(title: string): string {
  return normalizeTripSlug(title);
}

export function validateTripSlug(slug: string): string | null {
  const normalized = normalizeTripSlug(slug);
  if (!normalized) return "Le lien court ne peut pas être vide.";
  if (normalized.length < 3) return "Le lien court doit contenir au moins 3 caractères.";
  if (RESERVED_SLUGS.has(normalized)) return "Ce lien est réservé — choisissez un autre nom.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    return "Utilisez uniquement des lettres, chiffres et tirets.";
  }
  return null;
}

export function resolveTripSlug(inputSlug: string | null | undefined, title: string): string | null {
  const fromInput = normalizeTripSlug(inputSlug ?? "");
  if (fromInput) {
    const error = validateTripSlug(fromInput);
    if (error) throw new Error(error);
    return fromInput;
  }
  const fromTitle = slugifyTripTitle(title);
  if (!fromTitle || validateTripSlug(fromTitle)) return null;
  return fromTitle;
}

export function getSiteOrigin() {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  return "https://greenvibes-ten.vercel.app";
}

export function getTripSharePath(trip: Pick<Trip, "id" | "slug">): string {
  if (trip.slug) return `/r/${trip.slug}`;
  return `/reservation/${trip.id}`;
}

export function getTripShareUrl(trip: Pick<Trip, "id" | "slug">): string {
  return `${getSiteOrigin()}${getTripSharePath(trip)}`;
}

export async function copyTripShareLink(trip: Pick<Trip, "id" | "slug">): Promise<string> {
  const url = getTripShareUrl(trip);
  await navigator.clipboard.writeText(url);
  return url;
}
