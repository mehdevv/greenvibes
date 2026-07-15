import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  useAnalyticsOverview,
  useListAllTripsAdmin,
  useListReservations,
  useReservationsRealtime,
  useTripsRealtime,
  reservationStatusLabel,
} from "@/api";
import { TripFormDialog } from "@/components/admin/trip-form-dialog";
import { PortalLoginQrSection } from "@/components/admin/login-qr-cards";
import { useAuth } from "@/lib/auth";
import { computeAdminOverviewStats } from "@/lib/admin-overview-stats";
import { tripSpotsRemaining } from "@/lib/availability";
import { formatDepartureDate } from "@/lib/trip-dates";
import { formatPrice } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  Package,
  TrendingUp,
  BookOpen,
  UserPlus,
  Plus,
  Armchair,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
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
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { canWrite, can, isSuperAdmin } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading, isError, error, refetch } = useAnalyticsOverview();
  const { data: trips, isLoading: tripsLoading } = useListAllTripsAdmin();
  const { data: allReservations = [], isLoading: resaLoading } = useListReservations();
  useTripsRealtime();
  useReservationsRealtime();

  const stats = useMemo(
    () => computeAdminOverviewStats(trips, allReservations),
    [trips, allReservations],
  );

  const upcomingTrips = useMemo(() => {
    const list = [...(trips ?? [])].filter((t) => t.active && !t.archived);
    list.sort((a, b) => {
      if (a.departureDate && b.departureDate) {
        return new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list.slice(0, 6);
  }, [trips]);

  const loading = isLoading || tripsLoading || resaLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Tableau de bord</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            Vue complète de l&apos;activité — offres, places et réservations en un coup d&apos;œil.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/admin/trips">
              <Package className="h-4 w-4" />
              Voyages
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/admin/inscriptions">
              <UserPlus className="h-4 w-4" />
              Inscriptions
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/admin/reservations">
              <BookOpen className="h-4 w-4" />
              Réservations
            </Link>
          </Button>
          {can("trips", "create") && (
            <Button size="sm" className="gap-1.5 rounded-full" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Nouvelle offre
            </Button>
          )}
        </div>
      </div>

      <PortalLoginQrSection />

      <section className="space-y-3">
        <SectionTitle>Activité récente</SectionTitle>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatPill
            label="Réservations aujourd'hui"
            value={data.bookingsToday}
            icon={Calendar}
          />
          <StatPill
            label="Réservations ce mois"
            value={data.bookingsThisMonth}
            sub={`${data.totalClients} clients uniques`}
            icon={TrendingUp}
          />
          <StatPill
            label="Chiffre d'affaires"
            value={`${formatPrice(data.revenueThisMonth)} DA`}
            sub="Ce mois (confirmées)"
            icon={TrendingUp}
            valueClassName="text-2xl md:text-3xl"
          />
          <StatPill
            label="Clients ce mois"
            value={data.totalClients}
            sub="Contacts distincts"
            icon={Users}
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Offres &amp; capacité</SectionTitle>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatPill
            label="Offres"
            value={stats.offers}
            sub={`${stats.activeOffers} actives · ${stats.archivedOffers} archivées`}
            icon={Package}
          />
          <StatPill
            label="Places prises"
            value={stats.totalSpotsTaken}
            sub={`sur ${stats.totalCapacity} places`}
            icon={Armchair}
          />
          <StatPill
            label="Remplissage global"
            value={`${stats.fillRate}%`}
            sub={`${stats.fullOffers} voyage${stats.fullOffers > 1 ? "s" : ""} complet${stats.fullOffers > 1 ? "s" : ""}`}
            icon={TrendingUp}
          />
          <StatPill
            label="Voyages actifs"
            value={stats.activeOffers}
            sub={stats.inactiveOffers > 0 ? `${stats.inactiveOffers} inactif${stats.inactiveOffers > 1 ? "s" : ""}` : "Tous publiés"}
            icon={Package}
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Réservations</SectionTitle>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatPill
            label="Total"
            value={stats.reservationsTotal}
            sub="Toutes les inscriptions"
            icon={BookOpen}
          />
          <StatPill
            label="Confirmées"
            value={stats.reservationsConfirmed}
            sub="Places validées"
            icon={CheckCircle2}
            accent="success"
          />
          <StatPill
            label="En attente"
            value={stats.reservationsWaitlisted}
            sub="Liste d'attente"
            icon={Clock}
            accent="warning"
          />
          <StatPill
            label="Annulées"
            value={stats.reservationsCancelled}
            sub="Historique"
            icon={XCircle}
            accent="muted"
          />
        </div>
      </section>

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
            <CardTitle className="text-base">Remplissage actif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-bold text-foreground">{data.fillRatePercent}%</div>
            <p className="mt-1 text-sm text-muted-foreground">Offres actives uniquement</p>
            <div className="mt-4">
              <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-forest transition-all"
                  style={{ width: `${data.fillRatePercent}%` }}
                />
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Global toutes offres : <span className="font-semibold text-foreground">{stats.fillRate}%</span>
              {" · "}
              {stats.totalSpotsTaken}/{stats.totalCapacity} places
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Voyages populaires (ce mois)</CardTitle>
            <Link to="/admin/trips" className="text-xs font-medium text-forest hover:underline">
              Voir tout →
            </Link>
          </CardHeader>
          <CardContent className="h-56">
            {data.topOffers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topOffers}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" fontSize={10} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#52B788" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune réservation ce mois.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Prochaines offres</CardTitle>
            <Link to="/admin/trips" className="text-xs font-medium text-forest hover:underline">
              Gérer →
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingTrips.map((t) => {
                const remaining = tripSpotsRemaining(t.capacity, t.spotsTaken);
                const full = remaining <= 0;
                return (
                  <Link
                    key={t.id}
                    to="/admin/trips/$tripId"
                    params={{ tripId: t.id }}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm transition hover:bg-secondary/50"
                  >
                    <div className="min-w-0">
                      <p className="font-medium line-clamp-1">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.departureDate ? formatDepartureDate(t) ?? t.departureDate : "Date à définir"}
                        {" · "}
                        {t.spotsTaken}/{t.capacity} places
                      </p>
                    </div>
                    <Badge variant={full ? "destructive" : "secondary"}>
                      {full ? "Complet" : `${remaining} libre${remaining > 1 ? "s" : ""}`}
                    </Badge>
                  </Link>
                );
              })}
              {upcomingTrips.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune offre active.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Dernières réservations</CardTitle>
          <Link to="/admin/reservations" className="text-sm font-medium text-forest hover:underline">
            Voir toutes →
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.recentBookings.map((r) => (
              <div
                key={r.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border p-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium">{r.bookingRef}</div>
                  <div className="text-muted-foreground">
                    {r.firstName} {r.lastName}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    {r.trip?.title ?? "Voyage"} · {r.location}
                  </div>
                  <a href={`tel:${r.phone}`} className="text-xs text-forest hover:underline">
                    {r.phone}
                  </a>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                  {reservationStatusLabel(r.status)}
                </span>
              </div>
            ))}
          </div>
          {data.recentBookings.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune réservation pour le moment.</p>
          )}
        </CardContent>
      </Card>

      <TripFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{children}</h2>
  );
}

function StatPill({
  label,
  value,
  sub,
  icon: Icon,
  valueClassName,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: typeof Calendar;
  valueClassName?: string;
  accent?: "success" | "warning" | "muted";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card px-4 py-3",
        accent === "success" && "border-emerald-200/80 bg-emerald-50/30",
        accent === "warning" && "border-amber-200/80 bg-amber-50/30",
        accent === "muted" && "bg-secondary/30",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-forest/70" />}
      </div>
      <p className={cn("mt-0.5 font-display text-2xl font-bold text-foreground md:text-3xl", valueClassName)}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}
