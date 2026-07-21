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
import { tripSpotsRemaining } from "@/lib/availability";
import { formatPrice } from "@/lib/constants";
import { formatDepartureDate } from "@/lib/trip-dates";
import { getTripSharePath } from "@/lib/trip-slug";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ExternalLink, MoreVertical, Settings2, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-11 w-full max-w-md rounded-xl" />
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <p className="text-muted-foreground">Offre introuvable.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to={paths.trips}>Retour aux voyages</Link>
        </Button>
      </div>
    );
  }

  const remaining = tripSpotsRemaining(trip.capacity, trip.spotsTaken);
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

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-5">
      <AdminBreadcrumbs
        items={[
          { label: "Voyages", to: paths.trips },
          { label: trip.title },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <Link to={paths.trips} aria-label="Retour">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">{trip.title}</h1>
            <Badge variant={trip.archived ? "outline" : trip.active ? "default" : "secondary"}>
              {trip.archived ? "Archivée" : trip.active ? "Actif" : "Inactif"}
            </Badge>
            {remaining <= 0 && <Badge variant="destructive">Complet</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            {formatPrice(trip.price)} DA · {trip.duration}
            {trip.departureDate && <> · Départ {formatDepartureDate(trip) ?? trip.departureDate}</>}
            {" · "}
            {trip.spotsTaken}/{trip.capacity} places
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          {can("reservations", "create") && (
            <Button asChild variant="default" size="sm" className="h-11 w-full gap-1.5 sm:h-9 sm:w-auto">
              <Link to={paths.inscriptions} search={{ trip: trip.id }}>
                <UserPlus className="h-4 w-4" />
                Inscrire un client
              </Link>
            </Button>
          )}
          <div className="flex gap-2">
            <div className="hidden flex-wrap gap-2 sm:flex">
              <TripShareLink trip={trip} compact />
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <a href={getTripSharePath(trip)} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Page publique
                </a>
              </Button>
              {can("trips", "delete") && (
                <Button variant="destructive" size="sm" className="gap-1.5" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 sm:hidden">
                  <MoreVertical className="h-5 w-5" />
                  <span className="sr-only">Plus d&apos;actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <a href={getTripSharePath(trip)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Page publique
                  </a>
                </DropdownMenuItem>
                {can("trips", "delete") && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer l&apos;offre
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TripTab)} className="flex min-h-0 flex-1 flex-col gap-4">
        <TabsList className="h-auto w-full max-w-md grid grid-cols-2 rounded-xl bg-secondary/80 p-1">
          <TabsTrigger
            value="participants"
            className="gap-2 rounded-lg py-2.5 text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <Users className="h-4 w-4" />
            Participants
            <span className="rounded-full bg-forest/10 px-2 py-0.5 text-xs font-semibold text-forest">
              {activeReservations}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="info"
            className="gap-2 rounded-lg py-2.5 text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <Settings2 className="h-4 w-4" />
            Informations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="participants" className="mt-0 min-h-0 flex-1 focus-visible:outline-none">
          <div className="flex flex-col gap-4">
            {can("reservations", "create") && <ReservationQuickForm trip={trip} />}
            <Card className="flex min-h-0 flex-1 flex-col">
              <CardContent className="flex min-h-0 flex-1 flex-col p-3 md:p-6">
                <TripSheetsManager trip={trip} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="info" className="mt-0 min-h-0 flex-1 focus-visible:outline-none">
          <Card>
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
