import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Booking, BookingStatus, CreateBookingInput, CreateBookingResult, UpdateBookingInput } from "./types";
import { mapBooking } from "./mappers";
import { invokeFunction, supabase } from "@/lib/supabase";
import { formatPostgrestError } from "./db-utils";

const bookingSelect =
  "*, trip_sessions(session_date, capacity, booked_count, offer:offers!trip_sessions_offer_id_fkey(title, slug, price_dzd)), clients(*)";

export function useListBookings(params?: {
  status?: BookingStatus;
  search?: string;
  sessionId?: string;
}) {
  return useQuery({
    queryKey: ["bookings", params],
    queryFn: async (): Promise<Booking[]> => {
      let query = supabase
        .from("bookings")
        .select(bookingSelect)
        .order("created_at", { ascending: false });

      if (params?.sessionId) query = query.eq("session_id", params.sessionId);
      if (params?.status) query = query.eq("status", params.status);
      if (params?.search) {
        query = query.or(
          `booking_ref.ilike.%${params.search}%,first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,email.ilike.%${params.search}%,phone.ilike.%${params.search}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw new Error(formatPostgrestError(error));
      return (data ?? []).map((r) => mapBooking(r));
    },
  });
}

export function useGetBookingByRef(ref: string) {
  return useQuery({
    queryKey: ["bookings", "ref", ref],
    enabled: Boolean(ref),
    queryFn: async (): Promise<Booking | null> => {
      const { data, error } = await supabase.rpc("get_booking_by_ref", { p_ref: ref });
      if (error) throw new Error(formatPostgrestError(error));
      if (!data) return null;
      return mapBooking(data as Record<string, unknown>);
    },
  });
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: async (input: CreateBookingInput): Promise<CreateBookingResult> => {
      const { data, error } = await supabase.rpc("create_booking", {
        p_session_id: input.sessionId,
        p_first_name: input.firstName,
        p_last_name: input.lastName,
        p_email: input.email,
        p_phone: input.phone,
        p_participants: input.participants,
        p_special_requests: input.specialRequests ?? null,
      });
      if (error) throw error;

      const result = data as {
        booking_id: string;
        booking_ref: string;
        status: BookingStatus;
        total_price_dzd: number;
      };

      try {
        await invokeFunction("send-booking-confirmation", {
          bookingRef: result.booking_ref,
        });
      } catch {
        // Email is best-effort; booking still succeeds
      }

      return {
        bookingId: result.booking_id,
        bookingRef: result.booking_ref,
        status: result.status,
        totalPriceDzd: Number(result.total_price_dzd),
      };
    },
  });
}

export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateBookingInput): Promise<Booking> => {
      const { id, ...fields } = input;
      const { error } = await supabase.rpc("admin_update_booking", {
        p_booking_id: id,
        p_first_name: fields.firstName,
        p_last_name: fields.lastName,
        p_email: fields.email,
        p_phone: fields.phone,
        p_participants: fields.participants,
        p_status: fields.status,
        p_special_requests: fields.specialRequests ?? null,
        p_session_id: fields.sessionId ?? null,
        p_total_price_dzd: fields.totalPriceDzd ?? null,
      });
      if (error) throw new Error(formatPostgrestError(error));

      const { data, error: fetchError } = await supabase
        .from("bookings")
        .select(bookingSelect)
        .eq("id", id)
        .single();
      if (fetchError) throw new Error(formatPostgrestError(fetchError));
      return mapBooking(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", id)
        .select(bookingSelect)
        .single();
      if (error) throw error;
      return mapBooking(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: booking, error: fetchError } = await supabase
        .from("bookings")
        .select("*, trip_sessions(*)")
        .eq("id", id)
        .single();
      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (updateError) throw updateError;

      const session = booking.trip_sessions as { id: string; booked_count: number };
      const participants = booking.participants as number;
      const { error: sessionError } = await supabase
        .from("trip_sessions")
        .update({
          booked_count: Math.max(0, session.booked_count - participants),
          status: "open",
        })
        .eq("id", session.id);
      if (sessionError) throw sessionError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export async function exportBookingsCsv(bookings: Booking[]): Promise<Blob> {
  const header = "Référence,Prénom,Nom,Email,Téléphone,Participants,Statut,Total DA,Date\n";
  const rows = bookings
    .map((b) =>
      [
        b.bookingRef,
        b.firstName,
        b.lastName,
        b.email,
        b.phone,
        b.participants,
        b.status,
        b.totalPriceDzd,
        b.createdAt,
      ].join(","),
    )
    .join("\n");
  return new Blob([header + rows], { type: "text/csv;charset=utf-8" });
}
