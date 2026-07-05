import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Client, UpdateClientInput } from "./types";
import { mapClient } from "./mappers";
import { supabase } from "@/lib/supabase";

export function useListClients(search?: string) {
  return useQuery({
    queryKey: ["clients", search],
    queryFn: async (): Promise<Client[]> => {
      let query = supabase.from("clients").select("*").order("created_at", { ascending: false });
      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
        );
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((r) => mapClient(r));
    },
  });
}

export function useGetClient(id: string) {
  return useQuery({
    queryKey: ["clients", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Client | null> => {
      const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data ? mapClient(data) : null;
    },
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateClientInput) => {
      const { id, ...fields } = input;
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (fields.firstName !== undefined) updates.first_name = fields.firstName;
      if (fields.lastName !== undefined) updates.last_name = fields.lastName;
      if (fields.email !== undefined) updates.email = fields.email;
      if (fields.phone !== undefined) updates.phone = fields.phone;
      if (fields.notes !== undefined) updates.notes = fields.notes;
      if (fields.tags !== undefined) updates.tags = fields.tags;

      const { data, error } = await supabase
        .from("clients")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapClient(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useUpdateClientNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes, tags }: { id: string; notes?: string; tags?: string[] }) => {
      const updates: Record<string, unknown> = {};
      if (notes !== undefined) updates.notes = notes;
      if (tags !== undefined) updates.tags = tags;
      const { data, error } = await supabase
        .from("clients")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapClient(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useClientBookings(clientId: string) {
  return useQuery({
    queryKey: ["clients", clientId, "bookings"],
    enabled: Boolean(clientId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, trip_sessions(*, offers(*))")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
