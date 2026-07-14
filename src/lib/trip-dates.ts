import type { Trip } from "@/api/types";

export function parseDepartureDate(trip: Pick<Trip, "departureDate">): Date | null {
  if (!trip.departureDate) return null;
  const d = new Date(`${trip.departureDate}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isTripExpired(trip: Pick<Trip, "departureDate">): boolean {
  const d = parseDepartureDate(trip);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dep = new Date(d);
  dep.setHours(0, 0, 0, 0);
  return dep < today;
}

export function daysUntilDeparture(trip: Pick<Trip, "departureDate">): number | null {
  const d = parseDepartureDate(trip);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dep = new Date(d);
  dep.setHours(0, 0, 0, 0);
  return Math.ceil((dep.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDepartureCountdown(trip: Pick<Trip, "departureDate">): string | null {
  const days = daysUntilDeparture(trip);
  if (days === null) return null;
  if (days < 0) return "Départ passé";
  if (days === 0) return "Départ aujourd'hui";
  if (days === 1) return "Départ demain";
  return `Départ dans ${days} jours`;
}

export function formatDepartureDate(trip: Pick<Trip, "departureDate">): string | null {
  const d = parseDepartureDate(trip);
  if (!d) return null;
  return new Intl.DateTimeFormat("fr-DZ", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function isTripPublicVisible(trip: Trip): boolean {
  return trip.active && !trip.archived && !isTripExpired(trip);
}
