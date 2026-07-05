import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ContactMessage } from "./types";
import { mapContactMessage } from "./mappers";
import { supabase } from "@/lib/supabase";

export function useSubmitContact() {
  return useMutation({
    mutationFn: async (input: {
      name: string;
      email: string;
      phone?: string;
      subject: string;
      message: string;
    }) => {
      const { error } = await supabase.from("contact_messages").insert({
        name: input.name,
        email: input.email,
        phone: input.phone,
        subject: input.subject,
        message: input.message,
      });
      if (error) throw error;
    },
  });
}

export function useListContactMessages() {
  return useQuery({
    queryKey: ["contact-messages"],
    queryFn: async (): Promise<ContactMessage[]> => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => mapContactMessage(r));
    },
  });
}

export function useMarkContactRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_messages")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contact-messages"] }),
  });
}
