import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Destination } from "./types";
import { mapDestination } from "./mappers";
import { supabase } from "@/lib/supabase";

export function useListPublishedDestinations() {
  return useQuery({
    queryKey: ["destinations", "published"],
    queryFn: async (): Promise<Destination[]> => {
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .eq("is_published", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((r) => mapDestination(r));
    },
  });
}

export function useListAllDestinations() {
  return useQuery({
    queryKey: ["destinations", "all"],
    queryFn: async (): Promise<Destination[]> => {
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((r) => mapDestination(r));
    },
  });
}

export function useGetDestinationById(id: string) {
  return useQuery({
    queryKey: ["destinations", "id", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Destination | null> => {
      const { data, error } = await supabase.from("destinations").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data ? mapDestination(data) : null;
    },
  });
}

export function useGetDestinationBySlug(slug: string) {
  return useQuery({
    queryKey: ["destinations", slug],
    enabled: Boolean(slug),
    queryFn: async (): Promise<Destination | null> => {
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ? mapDestination(data) : null;
    },
  });
}

export type DestinationInput = {
  slug: string;
  title: string;
  tag: string;
  description: string;
  coverImage?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isPublished: boolean;
  sortOrder: number;
};

export function useCreateDestination() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: DestinationInput) => {
      const { data, error } = await supabase
        .from("destinations")
        .insert({
          slug: input.slug,
          title: input.title,
          tag: input.tag,
          description: input.description,
          cover_image: input.coverImage,
          latitude: input.latitude,
          longitude: input.longitude,
          is_published: input.isPublished,
          sort_order: input.sortOrder,
        })
        .select()
        .single();
      if (error) throw error;
      return mapDestination(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["destinations"] }),
  });
}

export function useUpdateDestination() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: DestinationInput & { id: string }) => {
      const { data, error } = await supabase
        .from("destinations")
        .update({
          slug: input.slug,
          title: input.title,
          tag: input.tag,
          description: input.description,
          cover_image: input.coverImage,
          latitude: input.latitude,
          longitude: input.longitude,
          is_published: input.isPublished,
          sort_order: input.sortOrder,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapDestination(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["destinations"] }),
  });
}

export function useDeleteDestination() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("destinations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["destinations"] }),
  });
}
