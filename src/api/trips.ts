import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Trip } from "./types";
import { DEMO_TRIPS } from "@/lib/demo-trips";
import { PLACEHOLDER_IMAGES } from "@/lib/constants";
import { getPublicImageUrl, supabase } from "@/lib/supabase";
import { formatPostgrestError } from "./db-utils";

const DEMO_PHOTO_BY_ID: Record<string, string> = {
  "a1000000-0000-4000-8000-000000000001": PLACEHOLDER_IMAGES.tichy,
  "a1000000-0000-4000-8000-000000000002": PLACEHOLDER_IMAGES.gouraya,
  "a1000000-0000-4000-8000-000000000003": PLACEHOLDER_IMAGES.kherrata,
  "a1000000-0000-4000-8000-000000000004": PLACEHOLDER_IMAGES.corniche,
  "a1000000-0000-4000-8000-000000000005": PLACEHOLDER_IMAGES.gouraya,
};

function mapTrip(row: Record<string, unknown>): Trip {
  const id = String(row.id);
  const rawPhoto = row.photo_url ? String(row.photo_url) : null;
  const photoUrl =
    getPublicImageUrl(rawPhoto) || DEMO_PHOTO_BY_ID[id] || PLACEHOLDER_IMAGES.hero;

  return {
    id,
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
    createdAt: String(row.created_at),
  };
}

async function fetchActiveTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42P01" || error.message.includes("trips")) {
      return DEMO_TRIPS;
    }
    throw new Error(formatPostgrestError(error));
  }

  if (!data?.length) return DEMO_TRIPS;
  return data.map((r) => mapTrip(r));
}

async function fetchTripById(id: string): Promise<Trip | null> {
  const { data, error } = await supabase.from("trips").select("*").eq("id", id).maybeSingle();
  if (error) {
    if (error.code === "42P01") {
      return DEMO_TRIPS.find((t) => t.id === id) ?? null;
    }
    throw new Error(formatPostgrestError(error));
  }
  if (!data) return DEMO_TRIPS.find((t) => t.id === id) ?? null;
  return mapTrip(data);
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

/** Live updates when spots_taken changes */
export function useTripsRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("trips-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trips" },
        () => {
          qc.invalidateQueries({ queryKey: ["trips"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
};

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TripInput) => {
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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

export function useListAllTripsAdmin() {
  return useQuery({
    queryKey: ["trips", "admin"],
    queryFn: async (): Promise<Trip[]> => {
      const { data, error } = await supabase.from("trips").select("*").order("created_at", {
        ascending: false,
      });
      if (error) throw new Error(formatPostgrestError(error));
      return (data ?? []).map((r) => mapTrip(r));
    },
  });
}
