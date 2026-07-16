import type { Reservation, ReservationStatus } from "./types";
import { getActiveSupabase } from "@/lib/supabase";
import { formatPostgrestError } from "./db-utils";

const RESERVATION_SELECT =
  "*, trips(id, title, description, photo_url, meeting_point, includes, price, duration, capacity, spots_taken, active, archived, departure_date, created_at)";

function mapReservation(row: Record<string, unknown>): Reservation {
  const trips = row.trips as Record<string, unknown> | null;
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    bookingRef: String(row.booking_ref),
    firstName: String(row.first_name),
    lastName: String(row.last_name),
    phone: String(row.phone),
    location: String(row.location),
    status: row.status as ReservationStatus,
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at),
    trip: trips
      ? {
          id: String(trips.id ?? ""),
          title: String(trips.title ?? ""),
          description: String(trips.description ?? ""),
          photoUrl: trips.photo_url ? String(trips.photo_url) : null,
          meetingPoint: String(trips.meeting_point ?? ""),
          includes: Array.isArray(trips.includes) ? trips.includes.map(String) : [],
          price: Number(trips.price ?? 0),
          duration: String(trips.duration ?? ""),
          capacity: Number(trips.capacity ?? 0),
          spotsTaken: Number(trips.spots_taken ?? 0),
          active: Boolean(trips.active ?? true),
          slug: trips.slug ? String(trips.slug) : null,
          archived: Boolean(trips.archived ?? false),
          departureDate: trips.departure_date ? String(trips.departure_date) : null,
          listColumns: [],
          media: [],
          createdAt: String(trips.created_at ?? ""),
        }
      : null,
  };
}

async function syncSpotsForStatusChange(
  tripId: string,
  oldStatus: ReservationStatus,
  newStatus: ReservationStatus,
) {
  const wasConfirmed = oldStatus === "confirmed";
  const willConfirm = newStatus === "confirmed";
  if (wasConfirmed === willConfirm) return;

  const { data: trip, error } = await getActiveSupabase()
    .from("trips")
    .select("capacity, spots_taken")
    .eq("id", tripId)
    .single();
  if (error) throw new Error(formatPostgrestError(error));

  const taken = Number(trip.spots_taken);
  const capacity = Number(trip.capacity);

  if (!wasConfirmed && willConfirm) {
    if (taken >= capacity) {
      throw new Error("Complet — aucune place disponible pour confirmer cette réservation.");
    }
    const { error: updateError } = await getActiveSupabase()
      .from("trips")
      .update({ spots_taken: taken + 1 })
      .eq("id", tripId);
    if (updateError) throw new Error(formatPostgrestError(updateError));
    return;
  }

  const { error: updateError } = await getActiveSupabase()
    .from("trips")
    .update({ spots_taken: Math.max(0, taken - 1) })
    .eq("id", tripId);
  if (updateError) throw new Error(formatPostgrestError(updateError));
}

export async function updateReservationStatusById(
  id: string,
  status: ReservationStatus,
): Promise<Reservation> {
  const { data: existing, error: fetchError } = await getActiveSupabase()
    .from("reservations")
    .select("id, status, trip_id")
    .eq("id", id)
    .single();
  if (fetchError) throw new Error(formatPostgrestError(fetchError));

  const oldStatus = existing.status as ReservationStatus;
  if (oldStatus !== status) {
    await syncSpotsForStatusChange(existing.trip_id, oldStatus, status);
  }

  const { data, error } = await getActiveSupabase()
    .from("reservations")
    .update({ status })
    .eq("id", id)
    .select(RESERVATION_SELECT)
    .single();
  if (error) throw new Error(formatPostgrestError(error));
  return mapReservation(data);
}

export async function updateReservationFieldsById(
  id: string,
  patch: Record<string, unknown>,
): Promise<Reservation> {
  const { data, error } = await getActiveSupabase()
    .from("reservations")
    .update(patch)
    .eq("id", id)
    .select(RESERVATION_SELECT)
    .single();
  if (error) throw new Error(formatPostgrestError(error));
  return mapReservation(data);
}

export { syncSpotsForStatusChange };
