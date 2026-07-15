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

export type DepartureTimeLeft = {
  days: number;
  hours: number;
  past: boolean;
};

export function getTimeUntilDeparture(
  trip: Pick<Trip, "departureDate">,
): DepartureTimeLeft | null {
  const dep = parseDepartureDate(trip);
  if (!dep) return null;

  const diffMs = dep.getTime() - Date.now();
  if (diffMs <= 0) return { days: 0, hours: 0, past: true };

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  return {
    days: Math.floor(totalHours / 24),
    hours: totalHours % 24,
    past: false,
  };
}

function formatDaysHours(days: number, hours: number): string {
  if (days > 0 && hours > 0) return `${days} j et ${hours} h`;
  if (days > 0) return `${days} j`;
  return `${hours} h`;
}

export function formatDepartureCountdown(trip: Pick<Trip, "departureDate">): string | null {
  const left = getTimeUntilDeparture(trip);
  if (!left) return null;
  if (left.past) return "Départ passé";
  if (left.days === 0 && left.hours === 0) return "Départ imminent";
  if (left.days === 0) return `Départ dans ${left.hours} h`;
  if (left.days === 1 && left.hours === 0) return "Départ demain";
  if (left.days === 1) return `Départ demain · ${left.hours} h`;
  return `Départ dans ${formatDaysHours(left.days, left.hours)}`;
}

/** Compact label for buttons, e.g. "3 j · 14 h" */
export function formatDepartureTimeLeftCompact(
  trip: Pick<Trip, "departureDate">,
): string | null {
  const left = getTimeUntilDeparture(trip);
  if (!left || left.past) return null;
  if (left.days === 0 && left.hours === 0) return "Imminent";
  if (left.days === 0) return `${left.hours} h`;
  if (left.hours === 0) return `${left.days} j`;
  return `${left.days} j · ${left.hours} h`;
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
