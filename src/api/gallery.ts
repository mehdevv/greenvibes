import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GalleryItem } from "./types";
import { mapGalleryItem } from "./mappers";
import { supabase } from "@/lib/supabase";

export function useListGalleryItems() {
  return useQuery({
    queryKey: ["gallery"],
    queryFn: async (): Promise<GalleryItem[]> => {
      const { data, error } = await supabase
        .from("gallery_items")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((r) => mapGalleryItem(r));
    },
  });
}

export type GalleryInput = {
  title: string;
  storagePath: string;
  destinationId?: string | null;
  sortOrder: number;
};

export function useCreateGalleryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: GalleryInput) => {
      const { data, error } = await supabase
        .from("gallery_items")
        .insert({
          title: input.title,
          storage_path: input.storagePath,
          destination_id: input.destinationId,
          sort_order: input.sortOrder,
        })
        .select()
        .single();
      if (error) throw error;
      return mapGalleryItem(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gallery"] }),
  });
}

export function useDeleteGalleryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gallery_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gallery"] }),
  });
}
