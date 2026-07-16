import type { Reservation, ReservationStatus, TripSheetColumn } from "@/api/types";

export const ROW_DRAG_MIME = "application/x-greenvibes-sheet-row";
export const COLUMN_DRAG_MIME = "application/x-greenvibes-sheet-column";

export const DEFAULT_LIST_COLUMNS: TripSheetColumn[] = [
  { id: "firstName", label: "Prénom" },
  { id: "lastName", label: "Nom" },
  { id: "phone", label: "Téléphone" },
  { id: "location", label: "Adresse" },
  { id: "status", label: "Statut" },
  { id: "bookingRef", label: "Référence" },
];

export function parseListColumns(value: unknown): TripSheetColumn[] {
  if (!Array.isArray(value) || !value.length) return DEFAULT_LIST_COLUMNS;
  const cols = value
    .map((col) => {
      if (!col || typeof col !== "object") return null;
      const c = col as Record<string, unknown>;
      const id = String(c.id ?? "");
      const label = String(c.label ?? "");
      if (!id || !label) return null;
      return { id, label };
    })
    .filter((c): c is TripSheetColumn => c !== null);
  return cols.length ? cols : DEFAULT_LIST_COLUMNS;
}

export function reservationToCells(reservation: Reservation): Record<string, string> {
  return {
    firstName: reservation.firstName,
    lastName: reservation.lastName,
    phone: reservation.phone,
    location: reservation.location,
    status: reservation.status,
    bookingRef: reservation.bookingRef,
  };
}

export function cellsToReservationPatch(
  cells: Record<string, string>,
): Partial<Pick<Reservation, "firstName" | "lastName" | "phone" | "location" | "status">> {
  const patch: Partial<Pick<Reservation, "firstName" | "lastName" | "phone" | "location" | "status">> = {};
  if (cells.firstName !== undefined) patch.firstName = cells.firstName;
  if (cells.lastName !== undefined) patch.lastName = cells.lastName;
  if (cells.phone !== undefined) patch.phone = cells.phone;
  if (cells.location !== undefined) patch.location = cells.location;
  if (cells.status === "confirmed" || cells.status === "waitlisted" || cells.status === "cancelled") {
    patch.status = cells.status;
  }
  return patch;
}

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  confirmed: "Confirmée",
  waitlisted: "Réservée",
  cancelled: "Annulée",
};

export function statusCellLabel(status: string): string {
  if (status in STATUS_LABELS) return STATUS_LABELS[status as ReservationStatus];
  return status;
}
