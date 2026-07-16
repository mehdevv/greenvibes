import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { CreateReservationInput, CreateReservationResult, Reservation, ReservationStatus, Trip, UpdateReservationInput } from "./types";
import { invokeFunction, getActiveSupabase } from "@/lib/supabase";
import { formatPostgrestError } from "./db-utils";
import { parseListColumns } from "@/lib/trip-list-columns";
import {
  syncSpotsForStatusChange,
  updateReservationFieldsById,
  updateReservationStatusById,
} from "./reservation-mutations";
import { syncReservationToSheetRow } from "./reservation-sheet-sync";

async function createReservationRpc(
  input: CreateReservationInput,
): Promise<CreateReservationResult> {
  const { data, error } = await getActiveSupabase().rpc("create_reservation", {
    p_trip_id: input.tripId,
    p_first_name: input.firstName,
    p_last_name: input.lastName,
    p_phone: input.phone,
    p_location: input.location,
  });
  if (error) throw new Error(formatPostgrestError(error));

  const result = data as {
    reservation_id: string;
    booking_ref: string;
    status: CreateReservationResult["status"];
    spots_remaining: number;
  };

  return {
    reservationId: result.reservation_id,
    bookingRef: result.booking_ref,
    status: result.status,
    spotsRemaining: Number(result.spots_remaining),
  };
}

async function createReservationEdge(
  input: CreateReservationInput,
): Promise<CreateReservationResult> {
  const result = await invokeFunction<{
    reservation_id: string;
    booking_ref: string;
    status: CreateReservationResult["status"];
    spots_remaining: number;
  }>("create-reservation", {
    tripId: input.tripId,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    location: input.location,
  });

  return {
    reservationId: result.reservation_id,
    bookingRef: result.booking_ref,
    status: result.status,
    spotsRemaining: Number(result.spots_remaining),
  };
}

function mapTripSummary(row: Record<string, unknown> | null | undefined): Trip | null {
  if (!row) return null;
  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    photoUrl: row.photo_url ? String(row.photo_url) : null,
    meetingPoint: String(row.meeting_point ?? ""),
    includes: Array.isArray(row.includes) ? row.includes.map(String) : [],
    price: Number(row.price ?? 0),
    duration: String(row.duration ?? ""),
    capacity: Number(row.capacity ?? 0),
    spotsTaken: Number(row.spots_taken ?? 0),
    active: Boolean(row.active ?? true),
    slug: row.slug ? String(row.slug) : null,
    archived: Boolean(row.archived ?? false),
    departureDate: row.departure_date ? String(row.departure_date) : null,
    listColumns: parseListColumns(row.list_columns),
    media: [],
    createdAt: String(row.created_at ?? ""),
  };
}

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
    trip: mapTripSummary(trips),
  };
}

const RESERVATION_SELECT =
  "*, trips(id, title, description, photo_url, meeting_point, includes, price, duration, capacity, spots_taken, active, archived, departure_date, created_at)";

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateReservationInput): Promise<CreateReservationResult> => {
      let result: CreateReservationResult;
      try {
        result = await createReservationRpc(input);
      } catch (rpcError) {
        try {
          result = await createReservationEdge(input);
        } catch {
          throw rpcError instanceof Error ? rpcError : new Error("Réservation impossible");
        }
      }

      const { data, error } = await getActiveSupabase()
        .from("reservations")
        .select(RESERVATION_SELECT)
        .eq("id", result.reservationId)
        .single();
      if (!error && data) {
        const reservation = mapReservation(data);
        await syncReservationToSheetRow(reservation);
      }
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["trip-sheet-rows"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useListReservations(
  params?: { search?: string; status?: string; tripId?: string },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["reservations", params],
    enabled: (options?.enabled ?? true) && params?.tripId !== "",
    queryFn: async (): Promise<Reservation[]> => {
      let query = getActiveSupabase()
        .from("reservations")
        .select(RESERVATION_SELECT)
        .order("created_at", { ascending: true });

      if (params?.tripId) {
        query = query.eq("trip_id", params.tripId).order("sort_order", { ascending: true });
      }
      if (params?.status) query = query.eq("status", params.status);
      if (params?.search) {
        const q = params.search.trim();
        query = query.or(
          `first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%,location.ilike.%${q}%,booking_ref.ilike.%${q}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw new Error(formatPostgrestError(error));
      return (data ?? []).map((r) => mapReservation(r));
    },
  });
}

export function useListReservationsByTrip(tripId: string) {
  return useListReservations({ tripId });
}

async function updateReservationStatusByIdLocal(id: string, status: ReservationStatus) {
  const reservation = await updateReservationStatusById(id, status);
  await syncReservationToSheetRow(reservation);
  return reservation;
}

function invalidateReservationQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["reservations"] });
  qc.invalidateQueries({ queryKey: ["trips"] });
  qc.invalidateQueries({ queryKey: ["trip-sheet-rows"] });
  qc.invalidateQueries({ queryKey: ["analytics"] });
}

export function useUpdateReservationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReservationStatus }) =>
      updateReservationStatusByIdLocal(id, status),
    onSuccess: () => invalidateReservationQueries(qc),
  });
}

export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => updateReservationStatusByIdLocal(id, "cancelled"),
    onSuccess: () => invalidateReservationQueries(qc),
  });
}

export function useUpdateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateReservationInput): Promise<Reservation> => {
      const patch: Record<string, unknown> = {};
      if (input.firstName !== undefined) patch.first_name = input.firstName.trim();
      if (input.lastName !== undefined) patch.last_name = input.lastName.trim();
      if (input.phone !== undefined) patch.phone = input.phone.trim();
      if (input.location !== undefined) patch.location = input.location.trim();
      if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

      const reservation = await updateReservationFieldsById(input.id, patch);
      await syncReservationToSheetRow(reservation);
      return reservation;
    },
    onSuccess: () => invalidateReservationQueries(qc),
  });
}

export function useReorderReservations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; sortOrder: number }[]) => {
      const updates = items.map(({ id, sortOrder }) =>
        getActiveSupabase().from("reservations").update({ sort_order: sortOrder }).eq("id", id),
      );
      const results = await Promise.all(updates);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw new Error(formatPostgrestError(failed.error));
    },
    onSuccess: () => invalidateReservationQueries(qc),
  });
}

export function useDeleteReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: existing, error: fetchError } = await getActiveSupabase()
        .from("reservations")
        .select("id, status, trip_id")
        .eq("id", id)
        .single();
      if (fetchError) throw new Error(formatPostgrestError(fetchError));

      const oldStatus = existing.status as ReservationStatus;
      if (oldStatus === "confirmed") {
        await syncSpotsForStatusChange(existing.trip_id, oldStatus, "cancelled");
      }

      const { error } = await getActiveSupabase().from("reservations").delete().eq("id", id);
      if (error) throw new Error(formatPostgrestError(error));
    },
    onSuccess: () => invalidateReservationQueries(qc),
  });
}

export function useReservationsRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = getActiveSupabase()
      .channel("reservations-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        () => {
          qc.invalidateQueries({ queryKey: ["reservations"] });
          qc.invalidateQueries({ queryKey: ["trips"] });
          qc.invalidateQueries({ queryKey: ["analytics"] });
        },
      )
      .subscribe();

    return () => {
      getActiveSupabase().removeChannel(channel);
    };
  }, [qc]);
}

export async function exportReservationsCsv(rows: Reservation[]): Promise<Blob> {
  const header =
    "Référence,Prénom,Nom,Téléphone,Adresse,Voyage,Prix voyage,Statut,Date\n";
  const body = rows
    .map((r) =>
      [
        r.bookingRef,
        r.firstName,
        r.lastName,
        r.phone,
        r.location,
        r.trip?.title ?? "",
        r.trip?.price ?? "",
        r.status,
        r.createdAt,
      ].join(","),
    )
    .join("\n");
  return new Blob([header + body], { type: "text/csv;charset=utf-8" });
}

const STATUS_LABELS: Record<ReservationStatus, string> = {
  confirmed: "Confirmée",
  waitlisted: "Réservée",
  cancelled: "Annulée",
};

export function reservationStatusLabel(status: ReservationStatus): string {
  return STATUS_LABELS[status];
}
