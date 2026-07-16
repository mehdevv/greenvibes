import type { Reservation } from "./types";
import { getActiveSupabase } from "@/lib/supabase";
import { formatPostgrestError } from "./db-utils";
import { DEFAULT_LIST_COLUMNS, reservationToCells } from "@/lib/trip-list-columns";

function mapSheet(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    name: String(row.name),
    isDefault: Boolean(row.is_default ?? false),
  };
}

export async function ensureDefaultSheetForTrip(tripId: string) {
  const { data: existing } = await getActiveSupabase()
    .from("trip_sheets")
    .select("*")
    .eq("trip_id", tripId)
    .eq("is_default", true)
    .maybeSingle();

  if (existing) return mapSheet(existing);

  const { data, error } = await getActiveSupabase()
    .from("trip_sheets")
    .insert({
      trip_id: tripId,
      name: "Participants",
      sort_order: 0,
      is_default: true,
      columns: DEFAULT_LIST_COLUMNS,
    })
    .select("*")
    .single();
  if (error) throw new Error(formatPostgrestError(error));
  return mapSheet(data);
}

export async function syncReservationToSheetRow(reservation: Reservation): Promise<void> {
  const sheet = await ensureDefaultSheetForTrip(reservation.tripId);
  const cells = reservationToCells(reservation);

  const { data: existing } = await getActiveSupabase()
    .from("trip_sheet_rows")
    .select("id")
    .eq("reservation_id", reservation.id)
    .maybeSingle();

  if (existing) {
    const { error } = await getActiveSupabase()
      .from("trip_sheet_rows")
      .update({ cells, sort_order: reservation.sortOrder })
      .eq("id", existing.id);
    if (error) throw new Error(formatPostgrestError(error));
    return;
  }

  const { error } = await getActiveSupabase().from("trip_sheet_rows").insert({
    sheet_id: sheet.id,
    reservation_id: reservation.id,
    sort_order: reservation.sortOrder,
    cells,
  });
  if (error) throw new Error(formatPostgrestError(error));
}
