import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Offer, OfferType } from "./types";
import { mapOffer } from "./mappers";
import { supabase } from "@/lib/supabase";
import {
  formatPostgrestError,
  normalizeFiniteNumber,
  normalizeOfferType,
  normalizeUuid,
} from "./db-utils";

/** Explicit FK hint — bare `destinations(*)` can 400 (ambiguous embed). */
export const offerDestinationEmbed =
  "destination:destinations!offers_destination_id_fkey(*)";

const offerSelectPublic = `*, ${offerDestinationEmbed}`;
const offerSelectAdmin = "*";
const offerSelectAdminDetail = `*, ${offerDestinationEmbed}`;

function toOfferRow(input: OfferInput) {
  return {
    destination_id: normalizeUuid(input.destinationId),
    slug: input.slug.trim(),
    title: input.title.trim(),
    description: input.description,
    price_dzd: normalizeFiniteNumber(input.priceDzd),
    duration_label: input.durationLabel.trim(),
    offer_type: normalizeOfferType(input.offerType),
    features: input.features,
    cover_image: input.coverImage?.trim() ? input.coverImage.trim() : null,
    is_active: input.isActive,
    is_featured: input.isFeatured,
    sort_order: normalizeFiniteNumber(input.sortOrder),
  };
}

export function useListPublishedOffers() {
  return useQuery({
    queryKey: ["offers", "published"],
    queryFn: async (): Promise<Offer[]> => {
      const { data, error } = await supabase
        .from("offers")
        .select(offerSelectPublic)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((r) => mapOffer(r));
    },
  });
}

export function useListAllOffers() {
  return useQuery({
    queryKey: ["offers", "all"],
    queryFn: async (): Promise<Offer[]> => {
      const { data, error } = await supabase
        .from("offers")
        .select(offerSelectAdmin)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((r) => mapOffer(r));
    },
  });
}

export function useListOffersByDestination(destinationId: string) {
  return useQuery({
    queryKey: ["offers", "destination", destinationId],
    enabled: Boolean(destinationId),
    queryFn: async (): Promise<Offer[]> => {
      const { data, error } = await supabase
        .from("offers")
        .select(offerSelectAdminDetail)
        .eq("destination_id", destinationId)
        .order("sort_order");
      if (error) throw new Error(formatPostgrestError(error));
      return (data ?? []).map((r) => mapOffer(r));
    },
  });
}

export function useGetOfferBySlug(slug: string) {
  return useQuery({
    queryKey: ["offers", slug],
    enabled: Boolean(slug),
    queryFn: async (): Promise<Offer | null> => {
      const { data, error } = await supabase
        .from("offers")
        .select(offerSelectPublic)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ? mapOffer(data) : null;
    },
  });
}

export function useGetOfferById(id: string) {
  return useQuery({
    queryKey: ["offers", "id", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Offer | null> => {
      const { data, error } = await supabase
        .from("offers")
        .select(offerSelectAdminDetail)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapOffer(data) : null;
    },
  });
}

export type OfferInput = {
  destinationId?: string | null;
  slug: string;
  title: string;
  description: string;
  priceDzd: number;
  durationLabel: string;
  offerType: OfferType;
  features: string[];
  coverImage?: string | null;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
};

export function useCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: OfferInput) => {
      const { data, error } = await supabase
        .from("offers")
        .insert(toOfferRow(input))
        .select(offerSelectAdmin)
        .maybeSingle();
      if (error) throw new Error(formatPostgrestError(error));
      if (!data) throw new Error("Création impossible. Vérifiez vos droits d'écriture.");
      return mapOffer(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["offers"] }),
  });
}

export function useUpdateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: OfferInput & { id: string }) => {
      const { error: updateError } = await supabase
        .from("offers")
        .update(toOfferRow(input))
        .eq("id", id);
      if (updateError) throw new Error(formatPostgrestError(updateError));

      const { data, error: readError } = await supabase
        .from("offers")
        .select(offerSelectAdminDetail)
        .eq("id", id)
        .maybeSingle();
      if (readError) throw new Error(formatPostgrestError(readError));
      if (!data) {
        throw new Error("Mise à jour impossible. Vérifiez vos droits d'écriture.");
      }
      return mapOffer(data);
    },
    onSuccess: (data, variables) => {
      qc.setQueryData(["offers", "id", variables.id], data);
      qc.invalidateQueries({ queryKey: ["offers"] });
    },
  });
}

export function useDeleteOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("offers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["offers"] }),
  });
}
