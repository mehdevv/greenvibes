import { useQuery } from "@tanstack/react-query";
import type { AnalyticsOverview } from "./types";
import { mapBooking } from "./mappers";
import { supabase } from "@/lib/supabase";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
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

      const [
        bookingsTodayRes,
        bookingsMonthRes,
        clientsRes,
        offersRes,
        sessionsRes,
        recentRes,
        allMonthBookingsRes,
      ] = await Promise.all([
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .gte("created_at", todayStart)
          .neq("status", "cancelled"),
        supabase
          .from("bookings")
          .select("total_price_dzd")
          .gte("created_at", monthStart)
          .neq("status", "cancelled"),
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("offers").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase
          .from("trip_sessions")
          .select("capacity, booked_count")
          .gte("session_date", now.toISOString().slice(0, 10)),
        supabase
          .from("bookings")
          .select(`*, trip_sessions(session_date, offer:offers!trip_sessions_offer_id_fkey(title)), clients(*)`)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("bookings")
          .select("created_at, trip_sessions(session_date, offer:offers!trip_sessions_offer_id_fkey(title))")
          .gte("created_at", thirtyDaysAgo.toISOString())
          .neq("status", "cancelled"),
      ]);

      const errors = [
        bookingsTodayRes.error,
        bookingsMonthRes.error,
        clientsRes.error,
        offersRes.error,
        sessionsRes.error,
        recentRes.error,
        allMonthBookingsRes.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        throw new Error(
          errors[0]?.message ?? "Accès refusé aux données admin. Vérifiez votre profil administrateur.",
        );
      }

      const revenueThisMonth = (bookingsMonthRes.data ?? []).reduce(
        (sum, b) => sum + Number(b.total_price_dzd),
        0,
      );

      const sessions = sessionsRes.data ?? [];
      const totalCapacity = sessions.reduce((s, x) => s + (x.capacity ?? 0), 0);
      const totalBooked = sessions.reduce((s, x) => s + (x.booked_count ?? 0), 0);
      const fillRatePercent =
        totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

      const trendMap = new Map<string, number>();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        trendMap.set(d.toISOString().slice(0, 10), 0);
      }
      for (const b of allMonthBookingsRes.data ?? []) {
        const day = String(b.created_at).slice(0, 10);
        if (trendMap.has(day)) trendMap.set(day, (trendMap.get(day) ?? 0) + 1);
      }

      const offerCounts = new Map<string, number>();
      for (const b of allMonthBookingsRes.data ?? []) {
        const session = b.trip_sessions as { offer?: { title?: string }; offers?: { title?: string } } | null;
        const title = session?.offer?.title ?? session?.offers?.title ?? "Autre";
        offerCounts.set(title, (offerCounts.get(title) ?? 0) + 1);
      }

      const topOffers = [...offerCounts.entries()]
        .map(([title, bookings]) => ({ title, bookings }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);

      return {
        bookingsToday: bookingsTodayRes.count ?? 0,
        bookingsThisMonth: (bookingsMonthRes.data ?? []).length,
        revenueThisMonth,
        totalClients: clientsRes.count ?? 0,
        activeOffers: offersRes.count ?? 0,
        fillRatePercent,
        bookingsTrend: [...trendMap.entries()].map(([date, count]) => ({ date, count })),
        topOffers,
        recentBookings: (recentRes.data ?? []).map((r) => mapBooking(r)),
      };
    },
  });
}
