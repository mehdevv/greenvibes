import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { HERO_VIDEO_SOURCES } from "@/lib/gallery-assets";
import { supabase } from "@/lib/supabase";
import { formatPostgrestError } from "./db-utils";
import { applyMediaLayout, heroLayoutKey, useMediaLayout } from "./site-media-layout";
import { useSiteImages } from "./site-images";

export type HeroVideoItem = {
  id: string;
  src: string;
  bundled?: boolean;
  custom?: boolean;
  dbId?: string;
  slot?: string;
};

export type SiteHeroVideoRow = {
  id: string;
  url: string;
  sortOrder: number;
  createdAt: string;
};

function mapHeroVideoRow(row: Record<string, unknown>): SiteHeroVideoRow {
  return {
    id: String(row.id),
    url: String(row.url),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at),
  };
}

export function heroVideoSlot(index: number) {
  return `hero-video-${index}`;
}

function useSiteHeroVideoRows() {
  return useQuery({
    queryKey: ["site-hero-videos"],
    queryFn: async (): Promise<SiteHeroVideoRow[]> => {
      const { data, error } = await supabase
        .from("site_hero_videos")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) {
        if (error.code === "42P01") return [];
        throw new Error(formatPostgrestError(error));
      }
      return (data ?? []).map(mapHeroVideoRow);
    },
    staleTime: 60_000,
  });
}

export function useMergedHeroVideos(): HeroVideoItem[] {
  const { data: imageMap } = useSiteImages();
  const { data: extra = [] } = useSiteHeroVideoRows();
  const { data: layout = {} } = useMediaLayout();

  return useMemo(() => {
    const bundled: HeroVideoItem[] = HERO_VIDEO_SOURCES.map((video, index) => {
      const slot = heroVideoSlot(index);
      return {
        id: `bundled-${index}`,
        src: imageMap?.[slot] ?? video.src,
        bundled: true,
        slot,
      };
    });

    const custom: HeroVideoItem[] = extra.map((row) => ({
      id: `custom-${row.id}`,
      src: row.url,
      custom: true,
      dbId: row.id,
    }));

    return applyMediaLayout([...bundled, ...custom], "hero", layout);
  }, [imageMap, extra, layout]);
}

export { heroLayoutKey };

export function useAddHeroVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (url: string) => {
      const { data, error } = await supabase
        .from("site_hero_videos")
        .insert({ url, sort_order: Date.now() })
        .select()
        .single();
      if (error) throw new Error(formatPostgrestError(error));
      return mapHeroVideoRow(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-hero-videos"] }),
  });
}

export function useRemoveHeroVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("site_hero_videos").delete().eq("id", id);
      if (error) throw new Error(formatPostgrestError(error));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-hero-videos"] }),
  });
}

export function useUpdateHeroVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, url }: { id: string; url: string }) => {
      const { data, error } = await supabase
        .from("site_hero_videos")
        .update({ url })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(formatPostgrestError(error));
      return mapHeroVideoRow(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-hero-videos"] }),
  });
}
