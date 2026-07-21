import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useAnalyticsOverview,
  useListAllTripsAdmin,
  useListReservations,
  useReservationsRealtime,
  useTripsRealtime,
  reservationStatusLabel,
} from "@/api";
import { QuickActionCard } from "@/components/admin/dashboard-quick-actions";
import { TripFormDialog } from "@/components/admin/trip-form-dialog";
import { PortalLoginQrSection } from "@/components/admin/login-qr-cards";
import { useAuth } from "@/lib/auth";
import { computeAdminOverviewStats } from "@/lib/admin-overview-stats";
import { tripSpotsRemaining } from "@/lib/availability";
import { formatDepartureDate } from "@/lib/trip-dates";
import { formatPrice } from "@/lib/constants";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  ChevronRight,
  QrCode,
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { user, can } = useAuth();
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
    return list.slice(0, 5);
  }, [trips]);

  const loading = (isLoading && !data) || (tripsLoading && !trips) || (resaLoading && !allReservations.length);

  const greetingName = user?.fullName?.split(" ")[0] || user?.email?.split("@")[0] || "Admin";

  if (loading) {
    return (
      <div className="space-y-10">
        <Skeleton className="h-16 w-full max-w-md rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <h1 className="font-display text-xl font-bold text-foreground">Impossible de charger le tableau de bord</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          {error instanceof Error
            ? error.message
            : "Vérifiez que le schéma Supabase est appliqué et que vous êtes connecté en tant qu'admin."}
        </p>
        <Button className="mt-6 rounded-full" onClick={() => refetch()}>
          Réessayer
        </Button>
      </div>
    );
  }

  const reservationRows = [
    { label: "Confirmées", value: stats.reservationsConfirmed, color: "bg-emerald-500", icon: CheckCircle2 },
    { label: "En attente", value: stats.reservationsWaitlisted, color: "bg-amber-500", icon: Clock },
    { label: "Annulées", value: stats.reservationsCancelled, color: "bg-muted-foreground/50", icon: XCircle },
  ];
  const resaMax = Math.max(stats.reservationsTotal, 1);

  return (
    <div className="space-y-10 pb-4">
      {/* Welcome */}
      <header className="space-y-1">
        <p className="text-sm font-medium text-forest">Bonjour, {greetingName}</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Tableau de bord
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
          Actions, chiffres clés et activité récente — tout est regroupé ici.
        </p>
      </header>

      {/* Quick actions */}
      <section className="space-y-4">
        <SectionHeading title="Actions rapides" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {can("reservations", "create") && (
            <QuickActionCard
              to="/admin/inscriptions"
              title="Inscrire un client"
              description="Ajouter une réservation sur place, en 30 secondes."
              icon={UserPlus}
              variant="primary"
            />
          )}
          {can("trips", "create") && (
            <QuickActionCard
              title="Nouvelle offre"
              description="Créer un voyage, définir le slug et publier."
              icon={Plus}
              onClick={() => setDialogOpen(true)}
            />
          )}
          {can("reservations", "read") && (
            <QuickActionCard
              to="/admin/reservations"
              title="Réservations"
              description="Consulter et gérer toutes les inscriptions."
              icon={BookOpen}
            />
          )}
          {can("trips", "read") && (
            <QuickActionCard
              to="/admin/trips"
              title="Voyages"
              description="Modifier les offres, places et listes participants."
              icon={Package}
            />
          )}
        </div>
      </section>

      {/* Key metrics */}
      <section className="space-y-4">
        <SectionHeading title="Vue d'ensemble" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Réservations aujourd'hui"
            value={data.bookingsToday}
            hint={`${data.bookingsThisMonth} ce mois`}
            icon={Calendar}
          />
          <KpiCard
            label="Chiffre d'affaires"
            value={`${formatPrice(data.revenueThisMonth)} DA`}
            hint="Confirmées ce mois"
            icon={TrendingUp}
          />
          <KpiCard
            label="Offres actives"
            value={stats.activeOffers}
            hint={`${stats.offers} au total · ${stats.archivedOffers} archivées`}
            icon={Package}
          />
          <KpiCard
            label="Remplissage"
            value={`${stats.fillRate}%`}
            hint={`${stats.totalSpotsTaken} / ${stats.totalCapacity} places`}
            icon={Armchair}
          />
        </div>
      </section>

      {/* Charts + breakdown */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-2xl xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Réservations — 30 derniers jours</CardTitle>
            <CardDescription>Tendance des nouvelles inscriptions</CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.bookingsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2D6A4F" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Statut des réservations</CardTitle>
            <CardDescription>{stats.reservationsTotal} inscriptions au total</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            {reservationRows.map((row) => (
              <div key={row.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <row.icon className="h-4 w-4" />
                    {row.label}
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">{row.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn("h-full rounded-full transition-all", row.color)}
                    style={{ width: `${(row.value / resaMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="rounded-xl border border-border/70 bg-secondary/30 px-4 py-3">
              <p className="text-xs text-muted-foreground">Remplissage offres actives</p>
              <p className="mt-1 font-display text-2xl font-bold text-foreground">{data.fillRatePercent}%</p>
              {stats.fullOffers > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats.fullOffers} voyage{stats.fullOffers > 1 ? "s" : ""} complet{stats.fullOffers > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trips + popular */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
            <div>
              <CardTitle className="text-base font-semibold">Prochaines offres</CardTitle>
              <CardDescription className="mt-1">Voyages actifs à venir</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0 gap-1 text-forest">
              <Link to="/admin/trips">
                Tout voir
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingTrips.length > 0 ? (
              upcomingTrips.map((t) => {
                const remaining = tripSpotsRemaining(t.capacity, t.spotsTaken);
                const full = remaining <= 0;
                return (
                  <Link
                    key={t.id}
                    to="/admin/trips/$tripId"
                    params={{ tripId: t.id }}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3.5 transition hover:border-forest/20 hover:bg-secondary/40"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground line-clamp-1">{t.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t.departureDate ? formatDepartureDate(t) ?? t.departureDate : "Date à définir"}
                        {" · "}
                        {t.spotsTaken}/{t.capacity} places
                      </p>
                    </div>
                    <Badge variant={full ? "destructive" : "secondary"} className="shrink-0">
                      {full ? "Complet" : `${remaining} libre${remaining > 1 ? "s" : ""}`}
                    </Badge>
                  </Link>
                );
              })
            ) : (
              <EmptyBlock message="Aucune offre active pour le moment." actionLabel="Créer une offre" onAction={() => setDialogOpen(true)} />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Voyages populaires</CardTitle>
            <CardDescription>Réservations ce mois</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            {data.topOffers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topOffers} margin={{ bottom: 48 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="title" fontSize={10} interval={0} angle={-20} textAnchor="end" height={56} />
                  <YAxis allowDecimals={false} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#52B788" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyBlock message="Aucune réservation enregistrée ce mois." />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent reservations */}
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
          <div>
            <CardTitle className="text-base font-semibold">Dernières réservations</CardTitle>
            <CardDescription className="mt-1">Les 6 inscriptions les plus récentes</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="shrink-0 gap-1 text-forest">
            <Link to="/admin/reservations">
              Voir toutes
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {data.recentBookings.length > 0 ? (
            <div className="divide-y divide-border rounded-xl border border-border">
              {data.recentBookings.slice(0, 6).map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">
                        {r.firstName} {r.lastName}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">{r.bookingRef}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                      {r.trip?.title ?? "Voyage"} · {r.location}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <a href={`tel:${r.phone}`} className="text-sm text-forest hover:underline">
                      {r.phone}
                    </a>
                    <Badge variant="secondary">{reservationStatusLabel(r.status)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyBlock message="Aucune réservation pour le moment." actionLabel="Inscrire un client" actionTo="/admin/inscriptions" />
          )}
        </CardContent>
      </Card>

      {/* QR codes — collapsed by default */}
      <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-5">
        <AccordionItem value="qr" className="border-none">
          <AccordionTrigger className="py-5 hover:no-underline">
            <span className="flex items-center gap-2 text-base font-semibold">
              <QrCode className="h-4 w-4 text-forest" />
              Connexion rapide (QR codes)
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-5 pt-0">
            <PortalLoginQrSection embedded />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <TripFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>;
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: typeof Calendar;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forest/10">
          <Icon className="h-4 w-4 text-forest" />
        </div>
      </div>
      <p className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
        {value}
      </p>
      {hint && <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

function EmptyBlock({
  message,
  actionLabel,
  actionTo,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/20 px-6 py-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {actionLabel && actionTo && (
        <Button asChild variant="outline" size="sm" className="mt-4 rounded-full">
          <Link to={actionTo}>{actionLabel}</Link>
        </Button>
      )}
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
