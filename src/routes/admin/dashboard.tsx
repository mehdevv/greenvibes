import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAnalyticsOverview } from "@/api";
import type { Booking } from "@/api/types";
import { BookingEditDialog } from "@/components/admin/booking-edit-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Users, Package, TrendingUp, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { formatPrice } from "@/lib/constants";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { canWrite } = useAuth();
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const { data, isLoading, isError, error, refetch } = useAnalyticsOverview();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-md border border-border bg-card p-8 text-center">
        <h1 className="font-display text-xl font-bold text-foreground">Impossible de charger le tableau de bord</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {error instanceof Error
            ? error.message
            : "Vérifiez que les migrations Supabase sont appliquées et que vous êtes connecté en tant qu'admin."}
        </p>
        <Button className="mt-6 rounded-full" onClick={() => refetch()}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Vue d&apos;ensemble de l&apos;activité GreenVibes</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard title="Réservations aujourd'hui" value={data.bookingsToday} icon={Calendar} />
        <StatCard title="Réservations ce mois" value={data.bookingsThisMonth} icon={TrendingUp} />
        <StatCard title="Clients" value={data.totalClients} icon={Users} />
        <StatCard title="Offres actives" value={data.activeOffers} icon={Package} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Réservations — 30 derniers jours</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.bookingsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2D6A4F" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chiffre d&apos;affaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-bold text-foreground">
              {formatPrice(data.revenueThisMonth)} DA
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Ce mois (réservations confirmées)</p>
            <div className="mt-6">
              <div className="text-sm font-medium">Taux de remplissage</div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${data.fillRatePercent}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{data.fillRatePercent}%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Offres populaires</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topOffers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" fontSize={10} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Bar dataKey="bookings" fill="#52B788" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Réservations récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{b.bookingRef}</div>
                    <div className="text-muted-foreground">
                      {b.firstName} {b.lastName} · {b.participants} pers.
                    </div>
                    {b.phone ? (
                      <a href={`tel:${b.phone}`} className="text-xs text-foreground hover:underline">
                        {b.phone}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Pas de téléphone</span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
                      {b.status}
                    </span>
                    {canWrite && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingBooking(b)}
                        aria-label="Modifier la réservation"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {data.recentBookings.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune réservation pour le moment.</p>
              )}
            </div>
            <Link to="/admin/reservations" className="mt-4 inline-block text-sm font-medium text-foreground hover:underline">
              Voir toutes les réservations →
            </Link>
          </CardContent>
        </Card>
      </div>

      <BookingEditDialog
        booking={editingBooking}
        open={Boolean(editingBooking)}
        onOpenChange={(open) => {
          if (!open) setEditingBooking(null);
        }}
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: typeof Calendar;
}) {
  return (
    <Card className="border-l-4 border-l-leaf">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-foreground" />
      </CardHeader>
      <CardContent>
        <div className="font-display text-3xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}
