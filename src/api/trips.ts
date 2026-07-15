import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Trip, TripMedia, TripMediaType } from "./types";
import { DEMO_TRIPS } from "@/lib/demo-trips";
import { isTripPublicVisible } from "@/lib/trip-dates";
import { PLACEHOLDER_IMAGES } from "@/lib/constants";
import { resolveTripSlug } from "@/lib/trip-slug";
import { getPublicImageUrl, getActiveSupabase } from "@/lib/supabase";
import { formatPostgrestError } from "./db-utils";

const DEMO_PHOTO_BY_ID: Record<string, string> = {
  "a1000000-0000-4000-8000-000000000001": PLACEHOLDER_IMAGES.tichy,
  "a1000000-0000-4000-8000-000000000002": PLACEHOLDER_IMAGES.gouraya,
  "a1000000-0000-4000-8000-000000000003": PLACEHOLDER_IMAGES.kherrata,
  "a1000000-0000-4000-8000-000000000004": PLACEHOLDER_IMAGES.corniche,
  "a1000000-0000-4000-8000-000000000005": PLACEHOLDER_IMAGES.gouraya,
};

function mapTripMedia(row: Record<string, unknown>): TripMedia {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    url: String(row.url),
    mediaType: (row.media_type === "video" ? "video" : "image") as TripMediaType,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export function mapTrip(row: Record<string, unknown>, media: TripMedia[] = []): Trip {
  const id = String(row.id);
  const rawPhoto = row.photo_url ? String(row.photo_url) : null;
  const coverFromMedia = media.find((m) => m.mediaType === "image")?.url ?? null;
  const photoUrl =
    getPublicImageUrl(rawPhoto) ||
    coverFromMedia ||
    DEMO_PHOTO_BY_ID[id] ||
    PLACEHOLDER_IMAGES.hero;

  return {
    id,
    slug: row.slug ? String(row.slug) : null,
    title: String(row.title),
    description: String(row.description ?? ""),
    photoUrl,
    meetingPoint: String(row.meeting_point ?? ""),
    includes: Array.isArray(row.includes) ? row.includes.map(String) : [],
    price: Number(row.price ?? 0),
    duration: String(row.duration ?? ""),
    capacity: Number(row.capacity ?? 0),
    spotsTaken: Number(row.spots_taken ?? 0),
    active: Boolean(row.active),
    archived: Boolean(row.archived ?? false),
    departureDate: row.departure_date ? String(row.departure_date) : null,
    media,
    createdAt: String(row.created_at),
  };
}

async function fetchTripMediaMap(tripIds: string[]): Promise<Map<string, TripMedia[]>> {
  const map = new Map<string, TripMedia[]>();
  if (!tripIds.length) return map;

  const { data, error } = await getActiveSupabase()
    .from("trip_media")
    .select("*")
    .in("trip_id", tripIds)
    .order("sort_order", { ascending: true });

  if (error) {
    if (error.code === "42P01") return map;
    throw new Error(formatPostgrestError(error));
  }

  for (const row of data ?? []) {
    const item = mapTripMedia(row);
    const list = map.get(item.tripId) ?? [];
    list.push(item);
    map.set(item.tripId, list);
  }
  return map;
}

async function archiveExpiredTrips() {
  const { error } = await getActiveSupabase().rpc("archive_expired_trips");
  if (error && error.code !== "42883") {
    // function missing before migration — ignore
    console.warn("archive_expired_trips:", error.message);
  }
}

async function fetchActiveTrips(): Promise<Trip[]> {
  await archiveExpiredTrips();

  let { data, error } = await getActiveSupabase()
    .from("trips")
    .select("*")
    .eq("active", true)
    .eq("archived", false)
    .order("departure_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error?.message?.includes("archived") || error?.code === "42703") {
    ({ data, error } = await getActiveSupabase()
      .from("trips")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false }));
  }

  if (error) {
    if (error.code === "42P01" || error.message.includes("trips")) {
      return DEMO_TRIPS.filter(isTripPublicVisible);
    }
    throw new Error(formatPostgrestError(error));
  }

  if (!data?.length) return DEMO_TRIPS.filter(isTripPublicVisible);

  const mediaMap = await fetchTripMediaMap(data.map((r) => String(r.id)));
  return data
    .map((r) => mapTrip(r, mediaMap.get(String(r.id)) ?? []))
    .filter(isTripPublicVisible);
}

async function fetchTripById(id: string): Promise<Trip | null> {
  const { data, error } = await getActiveSupabase().from("trips").select("*").eq("id", id).maybeSingle();
  if (error) {
    if (error.code === "42P01") {
      return DEMO_TRIPS.find((t) => t.id === id) ?? null;
    }
    throw new Error(formatPostgrestError(error));
  }
  if (!data) return DEMO_TRIPS.find((t) => t.id === id) ?? null;
  const mediaMap = await fetchTripMediaMap([id]);
  return mapTrip(data, mediaMap.get(id) ?? []);
}

async function fetchTripBySlug(slug: string): Promise<Trip | null> {
  const normalized = slug.trim().toLowerCase();
  const { data, error } = await getActiveSupabase()
    .from("trips")
    .select("*")
    .ilike("slug", normalized)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01" || error.code === "42703") {
      return DEMO_TRIPS.find((t) => t.slug === normalized) ?? null;
    }
    throw new Error(formatPostgrestError(error));
  }
  if (!data) return DEMO_TRIPS.find((t) => t.slug === normalized) ?? null;
  const tripId = String(data.id);
  const mediaMap = await fetchTripMediaMap([tripId]);
  return mapTrip(data, mediaMap.get(tripId) ?? []);
}

export function useListTrips() {
  return useQuery({
    queryKey: ["trips", "active"],
    queryFn: fetchActiveTrips,
  });
}

export function useGetTrip(id: string) {
  return useQuery({
    queryKey: ["trips", id],
    enabled: Boolean(id),
    queryFn: () => fetchTripById(id),
  });
}

export function useGetTripBySlug(slug: string) {
  return useQuery({
    queryKey: ["trips", "slug", slug],
    enabled: Boolean(slug),
    queryFn: () => fetchTripBySlug(slug),
  });
}

export function useTripsRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = getActiveSupabase()
      .channel("trips-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trips" },
        () => {
          qc.invalidateQueries({ queryKey: ["trips"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trip_media" },
        () => {
          qc.invalidateQueries({ queryKey: ["trips"] });
        },
      )
      .subscribe();

    return () => {
      getActiveSupabase().removeChannel(channel);
    };
  }, [qc]);
}

export type TripInput = {
  title: string;
  description: string;
  photoUrl?: string | null;
  meetingPoint: string;
  includes: string[];
  price: number;
  duration: string;
  capacity: number;
  active: boolean;
  departureDate?: string | null;
  slug?: string | null;
};

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TripInput) => {
      const slug = resolveTripSlug(input.slug, input.title);
      const { data, error } = await getActiveSupabase()
        .from("trips")
        .insert({
          title: input.title,
          description: input.description,
          photo_url: input.photoUrl ?? null,
          meeting_point: input.meetingPoint,
          includes: input.includes,
          price: input.price,
          duration: input.duration,
          capacity: input.capacity,
          active: input.active,
          departure_date: input.departureDate || null,
          slug,
        })
        .select()
        .single();
      if (error) throw new Error(formatPostgrestError(error));
      return mapTrip(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trips"] }),
  });
}

export function useUpdateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: TripInput & { id: string }) => {
      const slug = resolveTripSlug(input.slug, input.title);
      const { data, error } = await getActiveSupabase()
        .from("trips")
        .update({
          title: input.title,
          description: input.description,
          photo_url: input.photoUrl ?? null,
          meeting_point: input.meetingPoint,
          includes: input.includes,
          price: input.price,
          duration: input.duration,
          capacity: input.capacity,
          active: input.active,
          departure_date: input.departureDate || null,
          slug,
          ...(input.active ? { archived: false } : {}),
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(formatPostgrestError(error));
      return mapTrip(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trips"] }),
  });
}

export function useDeleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error: resError } = await getActiveSupabase().from("reservations").delete().eq("trip_id", id);
      if (resError) throw new Error(formatPostgrestError(resError));

      const { error } = await getActiveSupabase().from("trips").delete().eq("id", id);
      if (error) throw new Error(formatPostgrestError(error));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trips"] }),
  });
}

export function useUpdateTripCapacity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, capacity }: { id: string; capacity: number }) => {
      if (capacity < 1) throw new Error("La capacité doit être au moins 1.");

      const { data: trip, error: fetchError } = await getActiveSupabase()
        .from("trips")
        .select("spots_taken")
        .eq("id", id)
        .single();
      if (fetchError) throw new Error(formatPostgrestError(fetchError));

      if (capacity < Number(trip.spots_taken)) {
        throw new Error(
          `Impossible : ${trip.spots_taken} place(s) déjà confirmée(s). Réduisez les confirmations ou annulez des réservations.`,
        );
      }

      const { data, error } = await getActiveSupabase()
        .from("trips")
        .update({ capacity })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(formatPostgrestError(error));
      return mapTrip(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trips"] }),
  });
}

export function useListAllTripsAdmin() {
  return useQuery({
    queryKey: ["trips", "admin"],
    queryFn: async (): Promise<Trip[]> => {
      await archiveExpiredTrips();

      const { data, error } = await getActiveSupabase()
        .from("trips")
        .select("*")
        .order("archived", { ascending: true })
        .order("departure_date", { ascending: false, nullsFirst: true })
        .order("created_at", { ascending: false });

      if (error) throw new Error(formatPostgrestError(error));
      const mediaMap = await fetchTripMediaMap((data ?? []).map((r) => String(r.id)));
      return (data ?? []).map((r) => mapTrip(r, mediaMap.get(String(r.id)) ?? []));
    },
  });
}

export function useAddTripMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tripId,
      url,
      mediaType,
    }: {
      tripId: string;
      url: string;
      mediaType: TripMediaType;
    }) => {
      const { data, error } = await getActiveSupabase()
        .from("trip_media")
        .insert({
          trip_id: tripId,
          url,
          media_type: mediaType,
          sort_order: Date.now(),
        })
        .select()
        .single();
      if (error) throw new Error(formatPostgrestError(error));
      return mapTripMedia(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trips"] }),
  });
}

export function useRemoveTripMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getActiveSupabase().from("trip_media").delete().eq("id", id);
      if (error) throw new Error(formatPostgrestError(error));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trips"] }),
  });
}
