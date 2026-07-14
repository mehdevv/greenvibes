import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SITE_TEXT_DEFAULTS } from "@/lib/site-text-defaults";
import { supabase } from "@/lib/supabase";
import { formatPostgrestError } from "./db-utils";

export type SiteTextMap = Record<string, string>;

async function fetchSiteTexts(): Promise<SiteTextMap> {
  const { data, error } = await supabase.from("site_texts").select("key, value");
  if (error) {
    if (error.code === "42P01") return {};
    throw new Error(formatPostgrestError(error));
  }
  const map: SiteTextMap = {};
  for (const row of data ?? []) {
    map[String(row.key)] = String(row.value);
  }
  return map;
}

export function useSiteTexts() {
  return useQuery({
    queryKey: ["site-texts"],
    queryFn: fetchSiteTexts,
    staleTime: 60_000,
  });
}

export function useSiteText(key: string, fallback?: string): string {
  const { data } = useSiteTexts();
  return data?.[key] ?? fallback ?? SITE_TEXT_DEFAULTS[key] ?? "";
}

export function useUpdateSiteText() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("site_texts")
        .upsert({ key, value }, { onConflict: "key" });
      if (error) throw new Error(formatPostgrestError(error));
      return { key, value };
    },
    onSuccess: (result) => {
      qc.setQueryData<SiteTextMap>(["site-texts"], (prev) => ({
        ...prev,
        [result.key]: result.value,
      }));
      qc.invalidateQueries({ queryKey: ["site-texts"] });
    },
  });
}
