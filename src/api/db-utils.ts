import type { OfferType } from "./types";

const OFFER_TYPES: OfferType[] = ["mer", "montagne", "culture", "aventure"];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeUuid(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return UUID_RE.test(trimmed) ? trimmed : null;
}

export function normalizeOfferType(value: unknown): OfferType {
  if (typeof value === "string" && OFFER_TYPES.includes(value as OfferType)) {
    return value as OfferType;
  }
  return "mer";
}

export function normalizeFiniteNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function formatPostgrestError(error: {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
}): string {
  if (error.code === "22P02") {
    return "Identifiant invalide (destination ou référence).";
  }
  if (error.code === "23503") {
    return "La destination sélectionnée est introuvable ou inaccessible.";
  }
  if (error.code === "23514") {
    return "Type d'offre invalide.";
  }
  if (error.code === "23505") {
    return "Ce slug est déjà utilisé par une autre offre.";
  }
  if (error.code === "PGRST116") {
    return "Mise à jour impossible. Vérifiez vos droits d'écriture.";
  }
  if (error.code === "42501") {
    return "Permissions insuffisantes pour modifier cette offre.";
  }

  const parts = [error.message, error.details, error.hint].filter(Boolean);
  return parts.join(" — ") || "Erreur base de données";
}
