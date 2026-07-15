import type { Reservation, Trip } from "@/api/types";
import { tripSpotsRemaining } from "@/lib/availability";

export type AdminOverviewStats = {
  offers: number;
  activeOffers: number;
  archivedOffers: number;
  inactiveOffers: number;
  fullOffers: number;
  totalCapacity: number;
  totalSpotsTaken: number;
  fillRate: number;
  reservationsTotal: number;
  reservationsConfirmed: number;
  reservationsWaitlisted: number;
  reservationsCancelled: number;
};

export function computeAdminOverviewStats(
  trips: Trip[] | undefined,
  reservations: Reservation[] | undefined,
): AdminOverviewStats {
  const list = trips ?? [];
  const resa = reservations ?? [];

  const totalCapacity = list.reduce((s, t) => s + t.capacity, 0);
  const totalSpotsTaken = list.reduce((s, t) => s + t.spotsTaken, 0);

  return {
    offers: list.length,
    activeOffers: list.filter((t) => t.active && !t.archived).length,
    archivedOffers: list.filter((t) => t.archived).length,
    inactiveOffers: list.filter((t) => !t.active && !t.archived).length,
    fullOffers: list.filter((t) => tripSpotsRemaining(t.capacity, t.spotsTaken) <= 0).length,
    totalCapacity,
    totalSpotsTaken,
    fillRate: totalCapacity > 0 ? Math.round((totalSpotsTaken / totalCapacity) * 100) : 0,
    reservationsTotal: resa.length,
    reservationsConfirmed: resa.filter((r) => r.status === "confirmed").length,
    reservationsWaitlisted: resa.filter((r) => r.status === "waitlisted").length,
    reservationsCancelled: resa.filter((r) => r.status === "cancelled").length,
  };
}
