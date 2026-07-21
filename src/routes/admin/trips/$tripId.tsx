import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  useDeleteTrip,
  useGetTrip,
  useListAllTripsAdmin,
  useListReservationsByTrip,
  useReservationsRealtime,
  useTripsRealtime,
} from "@/api";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { TripFormPanel } from "@/components/admin/trip-form-panel";
import { ReservationQuickForm } from "@/components/admin/reservation-quick-form";
import { TripSheetsManager } from "@/components/admin/trip-sheets-manager";
import { TripShareLink } from "@/components/admin/trip-share-link";
import { useAuth } from "@/lib/auth";
import { useWorkspacePaths } from "@/lib/workspace-paths";
import {
  tripAvailabilityBarColor,
  tripAvailabilityLabel,
  tripSpotsRemaining,
} from "@/lib/availability";
import { formatPrice } from "@/lib/constants";
import { formatDepartureDate } from "@/lib/trip-dates";
import { getTripSharePath } from "@/lib/trip-slug";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  MapPin,
  Settings2,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/trips/$tripId")({
  component: AdminTripDetailRoute,
});

function AdminTripDetailRoute() {
  const { tripId } = Route.useParams();
  return <TripDetailPage tripId={tripId} />;
}

type TripTab = "participants" | "info";

export function TripDetailPage({ tripId }: { tripId: string }) {
  const paths = useWorkspacePaths();
  const navigate = useNavigate();
  const { can } = useAuth();
  const [tab, setTab] = useState<TripTab>("participants");
  useTripsRealtime();
  useReservationsRealtime();

  const { data: tripFromApi, isLoading, isError } = useGetTrip(tripId);
  const { data: allTrips } = useListAllTripsAdmin();
  const trip = tripFromApi ?? allTrips?.find((t) => t.id === tripId) ?? null;
  const { data: reservations = [] } = useListReservationsByTrip(tripId);
  const deleteTrip = useDeleteTrip();

  if (isLoading && !trip) {
    return (
      <div className="space-y-4">
        <Skeleton className="hidden h-6 w-48 md:block" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <p className="text-muted-foreground">Offre introuvable.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to={paths.trips}>Retour aux voyages</Link>
        </Button>
      </div>
    );
  }

  const remaining = tripSpotsRemaining(trip.capacity, trip.spotsTaken);
  const fillPercent =
    trip.capacity > 0 ? Math.min(100, Math.round((trip.spotsTaken / trip.capacity) * 100)) : 0;
  const activeReservations = reservations.filter((r) => r.status !== "cancelled").length;

  const handleDelete = async () => {
    if (!window.confirm(`Supprimer définitivement « ${trip.title} » et toutes ses réservations ?`)) {
      return;
    }
    try {
      await deleteTrip.mutateAsync(trip.id);
      toast.success("Offre supprimée");
      navigate({ to: paths.trips });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const scrollToInscription = () => {
    setTab("participants");
    window.setTimeout(() => {
      document.getElementById("trip-inscription-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6 pb-4">
      <AdminBreadcrumbs
        className="hidden md:flex"
        items={[
          { label: "Voyages", to: paths.trips },
          { label: trip.title },
        ]}
      />

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
          <Button asChild variant="ghost" size="sm" className="h-9 gap-1.5 px-2">
            <Link to={paths.trips}>
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Voyages</span>
            </Link>
          </Button>
        </div>

        <div className="p-4 md:p-6">
          <div className="flex gap-4">
            {trip.photoUrl ? (
              <img
                src={trip.photoUrl}
                alt=""
                className="h-20 w-20 shrink-0 rounded-xl object-cover sm:h-24 sm:w-24"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-secondary text-xs text-muted-foreground sm:h-24 sm:w-24">
                Offre
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl font-bold leading-tight text-foreground sm:text-2xl md:text-3xl">
                {trip.title}
              </h1>
              {trip.slug && (
                <p className="mt-1 font-mono text-xs text-muted-foreground">/r/{trip.slug}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant={trip.archived ? "outline" : trip.active ? "default" : "secondary"}>
                  {trip.archived ? "Archivée" : trip.active ? "Active" : "Inactive"}
                </Badge>
                {remaining <= 0 && <Badge variant="destructive">Complet</Badge>}
              </div>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <TripStat label="Prix" value={`${formatPrice(trip.price)} DA`} />
            <TripStat label="Durée" value={trip.duration || "—"} />
            <TripStat
              label="Départ"
              value={trip.departureDate ? formatDepartureDate(trip) ?? trip.departureDate : "À définir"}
              icon={Calendar}
            />
            <TripStat
              label="Participants"
              value={`${activeReservations} inscrit${activeReservations !== 1 ? "s" : ""}`}
              icon={Users}
            />
          </dl>

          {trip.meetingPoint && (
            <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {trip.meetingPoint}
            </p>
          )}

          <div className="mt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">
                {trip.spotsTaken}/{trip.capacity} places
              </span>
              <span className="text-muted-foreground">{tripAvailabilityLabel(remaining, trip.capacity)}</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn("h-full rounded-full transition-all", tripAvailabilityBarColor(remaining, trip.capacity))}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {can("reservations", "create") && (
              <Button type="button" className="col-span-2 h-11 gap-2 sm:col-span-1 sm:w-auto" onClick={scrollToInscription}>
                <UserPlus className="h-4 w-4" />
                Nouvelle inscription
              </Button>
            )}
            <TripShareLink trip={trip} compact className="h-11 w-full sm:w-auto" />
            <Button asChild variant="outline" className="h-11 gap-2">
              <a href={getTripSharePath(trip)} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Page publique
              </a>
            </Button>
            {can("trips", "delete") && (
              <Button
                type="button"
                variant="outline"
                className="col-span-2 h-11 gap-2 text-destructive hover:text-destructive sm:col-span-1"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            )}
          </div>
        </div>
      </section>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TripTab)} className="flex min-h-0 flex-1 flex-col gap-5">
        <TabsList className="h-auto w-full grid grid-cols-2 rounded-2xl bg-secondary/60 p-1.5">
          <TabsTrigger
            value="participants"
            className="gap-2 rounded-xl py-3 text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <Users className="h-4 w-4" />
            Participants
            <span className="rounded-full bg-forest/10 px-2 py-0.5 text-xs font-semibold text-forest">
              {activeReservations}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="info"
            className="gap-2 rounded-xl py-3 text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <Settings2 className="h-4 w-4" />
            Informations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="participants" className="mt-0 min-h-0 flex-1 focus-visible:outline-none">
          <div className="flex flex-col gap-5">
            {can("reservations", "create") && (
              <div id="trip-inscription-form" className="scroll-mt-24">
                <ReservationQuickForm trip={trip} />
              </div>
            )}
            <Card className="rounded-2xl">
              <CardContent className="flex min-h-0 flex-1 flex-col p-3 md:p-6">
                <TripSheetsManager trip={trip} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="info" className="mt-0 min-h-0 flex-1 focus-visible:outline-none">
          <Card className="rounded-2xl">
            <CardContent className="p-4 md:p-6">
              {can("trips", "update") ? (
                <TripFormPanel trip={trip} />
              ) : (
                <TripReadOnlySummary trip={trip} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TripStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Calendar;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-secondary/30 px-3 py-2.5">
      <dt className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function TripReadOnlySummary({ trip }: { trip: import("@/api/types").Trip }) {
  return (
    <div className="space-y-4">
      <TripShareLink trip={trip} />
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Description</dt>
          <dd className="mt-0.5">{trip.description || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Rendez-vous</dt>
          <dd className="mt-0.5">{trip.meetingPoint || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Inclus</dt>
          <dd className="mt-0.5">{trip.includes.length ? trip.includes.join(", ") : "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
