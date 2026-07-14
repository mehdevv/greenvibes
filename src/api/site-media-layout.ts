import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { formatPostgrestError } from "./db-utils";

export type MediaLayoutEntry = {
  sortOrder: number;
  hidden: boolean;
};

export type MediaLayoutMap = Record<string, MediaLayoutEntry>;

async function fetchMediaLayout(): Promise<MediaLayoutMap> {
  const { data, error } = await supabase.from("site_media_layout").select("item_key, sort_order, hidden");
  if (error) {
    if (error.code === "42P01") return {};
    throw new Error(formatPostgrestError(error));
  }
  const map: MediaLayoutMap = {};
  for (const row of data ?? []) {
    map[String(row.item_key)] = {
      sortOrder: Number(row.sort_order ?? 0),
      hidden: Boolean(row.hidden),
    };
  }
  return map;
}

export function useMediaLayout() {
  return useQuery({
    queryKey: ["site-media-layout"],
    queryFn: fetchMediaLayout,
    staleTime: 30_000,
  });
}

export function galleryLayoutKey(id: string) {
  return `gallery:${id}`;
}

export function heroLayoutKey(id: string) {
  return `hero:${id}`;
}

export function presentationLayoutKey(id: string) {
  return `presentation:${id}`;
}

export function applyMediaLayout<T extends { id: string }>(
  items: T[],
  prefix: "gallery" | "hero" | "presentation",
  layout: MediaLayoutMap,
): T[] {
  return items
    .map((item, index) => {
      const key = `${prefix}:${item.id}`;
      const entry = layout[key];
      return {
        item,
        sortOrder: entry?.sortOrder ?? index * 1000,
        hidden: entry?.hidden ?? false,
      };
    })
    .filter((row) => !row.hidden)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((row) => row.item);
}

export function useReorderMediaLayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedKeys: string[]) => {
      const rows = orderedKeys.map((item_key, index) => ({
        item_key,
        sort_order: index * 10,
        hidden: false,
      }));
      const { error } = await supabase.from("site_media_layout").upsert(rows, {
        onConflict: "item_key",
      });
      if (error) throw new Error(formatPostgrestError(error));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-media-layout"] }),
  });
}

export function useHideMediaLayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemKey: string) => {
      const { error } = await supabase.from("site_media_layout").upsert(
        { item_key: itemKey, hidden: true, sort_order: 999_999 },
        { onConflict: "item_key" },
      );
      if (error) throw new Error(formatPostgrestError(error));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-media-layout"] }),
  });
}
