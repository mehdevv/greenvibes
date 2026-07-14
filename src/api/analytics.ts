import { useQuery } from "@tanstack/react-query";
import type { AnalyticsOverview, Reservation } from "./types";
import { supabase } from "@/lib/supabase";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function mapReservationRow(row: Record<string, unknown>): Reservation {
  const trips = row.trips as Record<string, unknown> | null;
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    bookingRef: String(row.booking_ref),
    firstName: String(row.first_name),
    lastName: String(row.last_name),
    phone: String(row.phone),
    location: String(row.location),
    status: row.status as Reservation["status"],
    createdAt: String(row.created_at),
    trip: trips
      ? {
          id: String(trips.id ?? row.trip_id),
          title: String(trips.title ?? ""),
          description: "",
          photoUrl: null,
          meetingPoint: "",
          includes: [],
          price: Number(trips.price ?? 0),
          duration: "",
          capacity: 0,
          spotsTaken: 0,
          active: true,
          createdAt: "",
        }
      : null,
  };
}

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: async (): Promise<AnalyticsOverview> => {
      const now = new Date();
      const todayStart = startOfDay(now);
      const monthStart = startOfMonth(now);
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const selectWithTrip =
        "*, trips(id, title, price, capacity, spots_taken)";

      const [
        bookingsTodayRes,
        bookingsMonthRes,
        tripsRes,
        recentRes,
        trendRes,
        monthWithTripsRes,
      ] = await Promise.all([
        supabase
          .from("reservations")
          .select("id", { count: "exact", head: true })
          .gte("created_at", todayStart)
          .neq("status", "cancelled"),
        supabase
          .from("reservations")
          .select("id", { count: "exact", head: true })
          .gte("created_at", monthStart)
          .neq("status", "cancelled"),
        supabase.from("trips").select("id, capacity, spots_taken").eq("active", true),
        supabase
          .from("reservations")
          .select(selectWithTrip)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("reservations")
          .select("created_at")
          .gte("created_at", thirtyDaysAgo.toISOString())
          .neq("status", "cancelled"),
        supabase
          .from("reservations")
          .select(selectWithTrip)
          .gte("created_at", monthStart)
          .neq("status", "cancelled"),
      ]);

      const errors = [
        bookingsTodayRes.error,
        bookingsMonthRes.error,
        tripsRes.error,
        recentRes.error,
        trendRes.error,
        monthWithTripsRes.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        throw new Error(
          errors[0]?.message ?? "Accès refusé aux données admin. Vérifiez votre profil administrateur.",
        );
      }

      const monthRows = monthWithTripsRes.data ?? [];
      const revenueThisMonth = monthRows
        .filter((r) => r.status === "confirmed")
        .reduce((sum, r) => {
          const trip = r.trips as { price?: number } | null;
          return sum + Number(trip?.price ?? 0);
        }, 0);

      const trips = tripsRes.data ?? [];
      const totalCapacity = trips.reduce((s, t) => s + Number(t.capacity ?? 0), 0);
      const totalBooked = trips.reduce((s, t) => s + Number(t.spots_taken ?? 0), 0);
      const fillRatePercent =
        totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

      const trendMap = new Map<string, number>();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        trendMap.set(d.toISOString().slice(0, 10), 0);
      }
      for (const r of trendRes.data ?? []) {
        const day = String(r.created_at).slice(0, 10);
        if (trendMap.has(day)) trendMap.set(day, (trendMap.get(day) ?? 0) + 1);
      }

      const tripCounts = new Map<string, number>();
      for (const r of monthRows) {
        const trip = r.trips as { title?: string } | null;
        const title = trip?.title ?? "Autre";
        tripCounts.set(title, (tripCounts.get(title) ?? 0) + 1);
      }

      const topOffers = [...tripCounts.entries()]
        .map(([title, bookings]) => ({ title, bookings }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);

      const uniqueClients = new Set(
        monthRows.map((r) => `${r.phone}-${r.first_name}-${r.last_name}`),
      );

      return {
        bookingsToday: bookingsTodayRes.count ?? 0,
        bookingsThisMonth: bookingsMonthRes.count ?? 0,
        revenueThisMonth,
        totalClients: uniqueClients.size,
        activeOffers: trips.length,
        fillRatePercent,
        bookingsTrend: [...trendMap.entries()].map(([date, count]) => ({ date, count })),
        topOffers,
        recentBookings: (recentRes.data ?? []).map((r) => mapReservationRow(r)),
      };
    },
  });
}
