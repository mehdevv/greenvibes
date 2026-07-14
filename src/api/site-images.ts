import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { formatPostgrestError } from "./db-utils";

export type SiteImageMap = Record<string, string>;

/** Known homepage image slots */
export const SITE_IMAGE_SLOTS = {
  services01: "services-01",
  services02: "services-02",
  services03: "services-03",
  agencyPoster: "agency-video-poster",
} as const;

async function fetchSiteImages(): Promise<SiteImageMap> {
  const { data, error } = await supabase.from("site_images").select("slot, url");
  if (error) {
    if (error.code === "42P01") return {};
    throw new Error(formatPostgrestError(error));
  }
  const map: SiteImageMap = {};
  for (const row of data ?? []) {
    map[String(row.slot)] = String(row.url);
  }
  return map;
}

export function useSiteImages() {
  return useQuery({
    queryKey: ["site-images"],
    queryFn: fetchSiteImages,
    staleTime: 60_000,
  });
}

export function useSiteImageUrl(slot: string, fallback: string): string {
  const { data } = useSiteImages();
  return data?.[slot] ?? fallback;
}

export function useUpdateSiteImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ slot, url }: { slot: string; url: string }) => {
      const { error } = await supabase.from("site_images").upsert(
        { slot, url },
        { onConflict: "slot" },
      );
      if (error) throw new Error(formatPostgrestError(error));
      return { slot, url };
    },
    onSuccess: (result) => {
      qc.setQueryData<SiteImageMap>(["site-images"], (prev) => ({
        ...prev,
        [result.slot]: result.url,
      }));
      qc.invalidateQueries({ queryKey: ["site-images"] });
    },
  });
}
