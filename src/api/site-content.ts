import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { LOCAL_GALLERY_MEDIA, type GalleryMedia } from "@/lib/gallery-assets";
import { supabase } from "@/lib/supabase";
import { SITE_IMAGE_SLOTS } from "@/api/site-images";
import { PLACEHOLDER_IMAGES } from "@/lib/constants";
import { applyMediaLayout, galleryLayoutKey, presentationLayoutKey, useMediaLayout } from "./site-media-layout";
import { formatPostgrestError } from "./db-utils";

export type SiteGalleryItem = {
  id: string;
  url: string;
  title: string;
  sortOrder: number;
  createdAt: string;
};

export type PresentationBlock = {
  id: string;
  title: string;
  body: string;
  imageUrl: string;
  imageLeft: boolean;
  sortOrder: number;
};

export type GalleryMediaItem = GalleryMedia & {
  custom?: boolean;
  dbId?: string;
};

export type PresentationSectionItem = {
  id: string;
  bundled: boolean;
  dbId?: string;
  title: string;
  body: string;
  titleKey?: string;
  textKey?: string;
  imageSlot: string;
  imageFallback: string;
};

export const STATIC_PRESENTATION_BLOCKS: Omit<PresentationSectionItem, "bundled">[] = [
  {
    id: "static-01",
    titleKey: "services.block01.title",
    title: "Sorties organisées",
    textKey: "services.block01.text",
    body: "On te emmène sur des itinéraires qu'on connaît par cœur — criques, sentiers, couchers de soleil. Tu viens, on guide, tu profites.",
    imageSlot: SITE_IMAGE_SLOTS.services01,
    imageFallback: PLACEHOLDER_IMAGES.tichy,
  },
  {
    id: "static-02",
    titleKey: "services.block02.title",
    title: "Petits groupes, bonne vibe",
    textKey: "services.block02.text",
    body: "Pas de gros bus ni d'ambiance impersonnelle. On voyage à taille humaine, entre amis qui ne se connaissent pas encore.",
    imageSlot: SITE_IMAGE_SLOTS.services02,
    imageFallback: PLACEHOLDER_IMAGES.gouraya,
  },
  {
    id: "static-03",
    titleKey: "services.block03.title",
    title: "Découvertes authentiques",
    textKey: "services.block03.text",
    body: "Villages, cascades et points de vue — on te montre la Petite Kabylie que les circuits classiques oublient, avec des guides qui connaissent chaque coin.",
    imageSlot: SITE_IMAGE_SLOTS.services03,
    imageFallback: PLACEHOLDER_IMAGES.kherrata,
  },
];

function mapGalleryRow(row: Record<string, unknown>): SiteGalleryItem {
  return {
    id: String(row.id),
    url: String(row.url),
    title: String(row.title ?? "Souvenir GreenVibes"),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at),
  };
}

function mapPresentationRow(row: Record<string, unknown>): PresentationBlock {
  return {
    id: String(row.id),
    title: String(row.title),
    body: String(row.body ?? ""),
    imageUrl: String(row.image_url),
    imageLeft: Boolean(row.image_left),
    sortOrder: Number(row.sort_order ?? 100),
  };
}

export function useSiteGalleryItems() {
  return useQuery({
    queryKey: ["site-gallery"],
    queryFn: async (): Promise<SiteGalleryItem[]> => {
      const { data, error } = await supabase
        .from("site_gallery_items")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) {
        if (error.code === "42P01") return [];
        throw new Error(formatPostgrestError(error));
      }
      return (data ?? []).map(mapGalleryRow);
    },
  });
}

export function useMergedGalleryMedia(): GalleryMediaItem[] {
  const { data: extra = [] } = useSiteGalleryItems();
  const { data: layout = {} } = useMediaLayout();
  return useMemo(() => {
    const custom: GalleryMediaItem[] = extra.map((row) => ({
      id: `custom-${row.id}`,
      src: row.url,
      title: row.title,
      type: "image",
      custom: true,
      dbId: row.id,
    }));
    const all = [...LOCAL_GALLERY_MEDIA, ...custom];
    return applyMediaLayout(all, "gallery", layout);
  }, [extra, layout]);
}

export { galleryLayoutKey };

export function useMergedPresentationBlocks(): PresentationSectionItem[] {
  const { data: extra = [] } = usePresentationBlocks();
  const { data: layout = {} } = useMediaLayout();

  return useMemo(() => {
    const staticItems: PresentationSectionItem[] = STATIC_PRESENTATION_BLOCKS.map((block) => ({
      ...block,
      bundled: true,
    }));

    const customItems: PresentationSectionItem[] = extra.map((block) => ({
      id: `custom-${block.id}`,
      bundled: false,
      dbId: block.id,
      title: block.title,
      body: block.body,
      imageSlot: presentationImageSlot(block.id),
      imageFallback: block.imageUrl,
    }));

    return applyMediaLayout([...staticItems, ...customItems], "presentation", layout);
  }, [extra, layout]);
}

export { presentationLayoutKey };

export function useAddGalleryImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ url, title }: { url: string; title?: string }) => {
      const { data, error } = await supabase
        .from("site_gallery_items")
        .insert({
          url,
          title: title?.trim() || "Souvenir GreenVibes",
          sort_order: Date.now(),
        })
        .select()
        .single();
      if (error) throw new Error(formatPostgrestError(error));
      return mapGalleryRow(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-gallery"] }),
  });
}

export function useRemoveGalleryImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("site_gallery_items").delete().eq("id", id);
      if (error) throw new Error(formatPostgrestError(error));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-gallery"] }),
  });
}

export function usePresentationBlocks() {
  return useQuery({
    queryKey: ["site-presentation"],
    queryFn: async (): Promise<PresentationBlock[]> => {
      const { data, error } = await supabase
        .from("site_presentation_blocks")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) {
        if (error.code === "42P01") return [];
        throw new Error(formatPostgrestError(error));
      }
      return (data ?? []).map(mapPresentationRow);
    },
  });
}

export function useAddPresentationBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      body: string;
      imageUrl: string;
      imageLeft: boolean;
    }) => {
      const { data, error } = await supabase
        .from("site_presentation_blocks")
        .insert({
          title: input.title.trim(),
          body: input.body.trim(),
          image_url: input.imageUrl,
          image_left: input.imageLeft,
          sort_order: Date.now(),
        })
        .select()
        .single();
      if (error) throw new Error(formatPostgrestError(error));
      return mapPresentationRow(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-presentation"] }),
  });
}

export function useRemovePresentationBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("site_presentation_blocks").delete().eq("id", id);
      if (error) throw new Error(formatPostgrestError(error));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-presentation"] }),
  });
}

export function presentationImageSlot(id: string) {
  return `presentation-${id}`;
}
