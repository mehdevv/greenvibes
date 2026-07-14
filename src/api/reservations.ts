import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateReservationInput, CreateReservationResult, Reservation } from "./types";
import { invokeFunction, supabase } from "@/lib/supabase";
import { formatPostgrestError } from "./db-utils";

async function createReservationRpc(
  input: CreateReservationInput,
): Promise<CreateReservationResult> {
  const { data, error } = await supabase.rpc("create_reservation", {
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

function mapReservation(row: Record<string, unknown>): Reservation {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    bookingRef: String(row.booking_ref),
    firstName: String(row.first_name),
    lastName: String(row.last_name),
    phone: String(row.phone),
    location: String(row.location),
    status: row.status as Reservation["status"],
    createdAt: String(row.created_at),
  };
}

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateReservationInput): Promise<CreateReservationResult> => {
      try {
        return await createReservationRpc(input);
      } catch (rpcError) {
        try {
          return await createReservationEdge(input);
        } catch {
          throw rpcError instanceof Error ? rpcError : new Error("Réservation impossible");
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useListReservations(params?: { search?: string; status?: string }) {
  return useQuery({
    queryKey: ["reservations", params],
    queryFn: async (): Promise<Reservation[]> => {
      let query = supabase
        .from("reservations")
        .select("*, trips(title)")
        .order("created_at", { ascending: false });

      if (params?.status) query = query.eq("status", params.status);
      if (params?.search) {
        query = query.or(
          `first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,phone.ilike.%${params.search}%,booking_ref.ilike.%${params.search}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw new Error(formatPostgrestError(error));
      return (data ?? []).map((r) => mapReservation(r));
    },
  });
}

export async function exportReservationsCsv(rows: Reservation[]): Promise<Blob> {
  const header = "Référence,Prénom,Nom,Téléphone,Localisation,Statut,Date\n";
  const body = rows
    .map((r) =>
      [r.bookingRef, r.firstName, r.lastName, r.phone, r.location, r.status, r.createdAt].join(","),
    )
    .join("\n");
  return new Blob([header + body], { type: "text/csv;charset=utf-8" });
}
