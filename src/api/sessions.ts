import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TripSession } from "./types";
import { mapTripSession } from "./mappers";
import { supabase } from "@/lib/supabase";
import { offerDestinationEmbed } from "./offers";

const sessionSelect = `*, offers(*, ${offerDestinationEmbed})`;

export function useListSessionsByOfferAdmin(offerId?: string) {
  return useQuery({
    queryKey: ["sessions", "offer-admin", offerId],
    enabled: Boolean(offerId),
    queryFn: async (): Promise<TripSession[]> => {
      const { data, error } = await supabase
        .from("trip_sessions")
        .select(sessionSelect)
        .eq("offer_id", offerId!)
        .order("session_date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => mapTripSession(r));
    },
  });
}

export function useGetSession(sessionId: string) {
  return useQuery({
    queryKey: ["sessions", "id", sessionId],
    enabled: Boolean(sessionId),
    queryFn: async (): Promise<TripSession | null> => {
      const { data, error } = await supabase
        .from("trip_sessions")
        .select(sessionSelect)
        .eq("id", sessionId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapTripSession(data) : null;
    },
  });
}

export function useListSessionsByOffer(offerId?: string) {
  return useQuery({
    queryKey: ["sessions", offerId],
    enabled: Boolean(offerId),
    queryFn: async (): Promise<TripSession[]> => {
      const { data, error } = await supabase
        .from("trip_sessions")
        .select(sessionSelect)
        .eq("offer_id", offerId!)
        .gte("session_date", new Date().toISOString().slice(0, 10))
        .neq("status", "cancelled")
        .order("session_date");
      if (error) throw error;
      return (data ?? []).map((r) => mapTripSession(r));
    },
  });
}

export function useListSessionsForAdmin(currentSessionId?: string) {
  return useQuery({
    queryKey: ["sessions", "admin-edit", currentSessionId],
    queryFn: async (): Promise<TripSession[]> => {
      const today = new Date().toISOString().slice(0, 10);
      let query = supabase
        .from("trip_sessions")
        .select(sessionSelect)
        .neq("status", "cancelled")
        .order("session_date");

      if (currentSessionId) {
        query = query.or(`session_date.gte.${today},id.eq.${currentSessionId}`);
      } else {
        query = query.gte("session_date", today);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((r) => mapTripSession(r));
    },
  });
}

export function useListAllSessions() {
  return useQuery({
    queryKey: ["sessions", "all"],
    queryFn: async (): Promise<TripSession[]> => {
      const { data, error } = await supabase
        .from("trip_sessions")
        .select(sessionSelect)
        .gte("session_date", new Date().toISOString().slice(0, 10))
        .order("session_date");
      if (error) throw error;
      return (data ?? []).map((r) => mapTripSession(r));
    },
  });
}

export type SessionInput = {
  offerId: string;
  sessionDate: string;
  capacity: number;
  status?: TripSession["status"];
};

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SessionInput) => {
      const { data, error } = await supabase
        .from("trip_sessions")
        .insert({
          offer_id: input.offerId,
          session_date: input.sessionDate,
          capacity: input.capacity,
          status: input.status ?? "open",
        })
        .select(sessionSelect)
        .single();
      if (error) throw error;
      return mapTripSession(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useUpdateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      capacity,
      status,
    }: {
      id: string;
      capacity?: number;
      status?: TripSession["status"];
    }) => {
      const updates: Record<string, unknown> = {};
      if (capacity != null) updates.capacity = capacity;
      if (status) updates.status = status;
      const { data, error } = await supabase
        .from("trip_sessions")
        .update(updates)
        .eq("id", id)
        .select(sessionSelect)
        .single();
      if (error) throw error;
      return mapTripSession(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trip_sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useBulkCreateSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessions: SessionInput[]) => {
      const { data, error } = await supabase
        .from("trip_sessions")
        .insert(
          sessions.map((s) => ({
            offer_id: s.offerId,
            session_date: s.sessionDate,
            capacity: s.capacity,
            status: s.status ?? "open",
          })),
        )
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}
