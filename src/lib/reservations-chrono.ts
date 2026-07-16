import type { Reservation, TripSheetColumn, TripSheetRow } from "@/api/types";

export const ALL_RESERVATIONS_VIEW_ID = "__all_chronological__";

export const CHRONO_COLUMNS: TripSheetColumn[] = [
  { id: "createdAt", label: "Date" },
  { id: "tripTitle", label: "Offre" },
  { id: "firstName", label: "Prénom" },
  { id: "lastName", label: "Nom" },
  { id: "phone", label: "Téléphone" },
  { id: "location", label: "Adresse" },
  { id: "status", label: "Statut" },
  { id: "bookingRef", label: "Référence" },
];

export function formatReservationDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-DZ", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function reservationToChronoRow(reservation: Reservation): TripSheetRow {
  return {
    id: reservation.id,
    sheetId: ALL_RESERVATIONS_VIEW_ID,
    sortOrder: 0,
    reservationId: reservation.id,
    createdAt: reservation.createdAt,
    cells: {
      createdAt: formatReservationDate(reservation.createdAt),
      tripTitle: reservation.trip?.title ?? "—",
      firstName: reservation.firstName,
      lastName: reservation.lastName,
      phone: reservation.phone,
      location: reservation.location,
      status: reservation.status,
      bookingRef: reservation.bookingRef,
    },
  };
}

export function sortReservationsChronologically(reservations: Reservation[]): Reservation[] {
  return [...reservations].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}
