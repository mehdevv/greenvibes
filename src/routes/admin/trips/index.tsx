import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useListAllTripsAdmin, useListReservations, useReservationsRealtime, useDeleteTrip } from "@/api";
import type { Trip } from "@/api/types";
import { TripFormDialog } from "@/components/admin/trip-form-dialog";
import { TripShareLink } from "@/components/admin/trip-share-link";
import { useAuth } from "@/lib/auth";
import { useWorkspacePaths } from "@/lib/workspace-paths";
import {
  tripAvailabilityBarColor,
  tripAvailabilityLabel,
  tripSpotsRemaining,
} from "@/lib/availability";
import { formatDepartureDate } from "@/lib/trip-dates";
import { formatPrice } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Calendar, ChevronRight, Plus, Search, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

type Filter = "all" | "active" | "inactive" | "archived" | "full" | "available";
type CreatedFilter = "all" | "7d" | "30d" | "90d";
type SortOrder = "newest" | "oldest";

function formatCreatedDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("fr-DZ", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function matchesCreatedFilter(createdAt: string, filter: CreatedFilter) {
  if (filter === "all") return true;
  const days = { "7d": 7, "30d": 30, "90d": 90 }[filter];
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs <= days * 24 * 60 * 60 * 1000;
}

export const Route = createFileRoute("/admin/trips/")({
  component: AdminTripsRoute,
});

function AdminTripsRoute() {
  return <TripsListPage />;
}

export function TripsListPage() {
  const paths = useWorkspacePaths();
  const { can } = useAuth();
  const navigate = useNavigate();
  const { data: trips, isLoading, isError } = useListAllTripsAdmin();
  const { data: allReservations = [] } = useListReservations();
  const deleteTrip = useDeleteTrip();
  useReservationsRealtime();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [createdFilter, setCreatedFilter] = useState<CreatedFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [dialogOpen, setDialogOpen] = useState(false);

  const reservationCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of allReservations) {
      if (r.status === "cancelled") continue;
      map.set(r.tripId, (map.get(r.tripId) ?? 0) + 1);
    }
    return map;
  }, [allReservations]);

  const filteredTrips = useMemo(() => {
    let list = trips ?? [];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.slug?.toLowerCase().includes(q) ?? false) ||
          t.meetingPoint.toLowerCase().includes(q) ||
          t.duration.toLowerCase().includes(q),
      );
    }
    switch (filter) {
      case "active":
        list = list.filter((t) => t.active && !t.archived);
        break;
      case "inactive":
        list = list.filter((t) => !t.active && !t.archived);
        break;
      case "archived":
        list = list.filter((t) => t.archived);
        break;
      case "full":
        list = list.filter((t) => tripSpotsRemaining(t.capacity, t.spotsTaken) <= 0);
        break;
      case "available":
        list = list.filter((t) => tripSpotsRemaining(t.capacity, t.spotsTaken) > 0);
        break;
    }
    list = list.filter((t) => matchesCreatedFilter(t.createdAt, createdFilter));
    list = [...list].sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sortOrder === "newest" ? diff : -diff;
    });
    return list;
  }, [trips, search, filter, createdFilter, sortOrder]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "Toutes" },
    { id: "active", label: "Actives" },
    { id: "available", label: "Places libres" },
    { id: "full", label: "Complètes" },
    { id: "archived", label: "Archivées" },
    { id: "inactive", label: "Inactives" },
  ];

  const createdFilters: { id: CreatedFilter; label: string }[] = [
    { id: "all", label: "Toutes dates" },
    { id: "7d", label: "7 jours" },
    { id: "30d", label: "30 jours" },
    { id: "90d", label: "90 jours" },
  ];

  const handleDelete = async (trip: Trip, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Supprimer définitivement « ${trip.title} » et toutes ses réservations ?`)) {
      return;
    }
    try {
      await deleteTrip.mutateAsync(trip.id);
      toast.success("Offre supprimée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Offres &amp; voyages</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            Gérez vos offres et participants — statistiques sur le tableau de bord.
          </p>
        </div>
        {can("trips", "create") && (
          <Button className="gap-2 rounded-full" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle offre
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher une offre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition",
                  filter === f.id
                    ? "bg-forest text-white"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Créée :
          </span>
          {createdFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setCreatedFilter(f.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition",
                createdFilter === f.id
                  ? "bg-forest/90 text-white"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
          <span className="mx-1 hidden h-4 w-px bg-border sm:inline" />
          <button
            type="button"
            onClick={() => setSortOrder((s) => (s === "newest" ? "oldest" : "newest"))}
            className="rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            {sortOrder === "newest" ? "Plus récentes" : "Plus anciennes"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="p-8 text-center text-sm text-destructive">Impossible de charger les offres.</p>
        ) : filteredTrips.length === 0 ? (
          <p className="p-10 text-center text-muted-foreground">Aucune offre ne correspond à votre recherche.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-14" />
                <TableHead className="min-w-[220px] text-base">Offre</TableHead>
                <TableHead className="text-base">Statut</TableHead>
                <TableHead className="text-base">Départ</TableHead>
                <TableHead className="text-base">Créée le</TableHead>
                <TableHead className="text-base">Prix</TableHead>
                <TableHead className="text-base">Places</TableHead>
                <TableHead className="text-base">Réservations</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips.map((t) => {
                const remaining = tripSpotsRemaining(t.capacity, t.spotsTaken);
                const fillPercent =
                  t.capacity > 0 ? Math.min(100, Math.round((t.spotsTaken / t.capacity) * 100)) : 0;
                const resaCount = reservationCounts.get(t.id) ?? 0;

                return (
                  <TableRow key={t.id} className="group cursor-pointer hover:bg-muted/40">
                    <TableCell className="py-3" colSpan={9}>
                      <Link
                        to={paths.tripDetail}
                        params={{ tripId: t.id }}
                        className="grid grid-cols-[3.5rem_minmax(200px,1.3fr)_minmax(110px,0.7fr)_minmax(90px,0.5fr)_minmax(100px,0.55fr)_minmax(80px,0.45fr)_minmax(130px,0.65fr)_minmax(70px,0.35fr)_minmax(120px,0.5fr)] items-center gap-3"
                      >
                        <div>
                          {t.photoUrl ? (
                            <img
                              src={t.photoUrl}
                              alt=""
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-xs text-muted-foreground">
                              —
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{t.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {t.meetingPoint || t.duration}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant={t.archived ? "outline" : t.active ? "default" : "secondary"}>
                            {t.archived ? "Archivée" : t.active ? "Actif" : "Inactif"}
                          </Badge>
                          {remaining <= 0 && <Badge variant="destructive">Complet</Badge>}
                        </div>
                        <div className="text-sm whitespace-nowrap">
                          {t.departureDate ? formatDepartureDate(t) ?? t.departureDate : "—"}
                        </div>
                        <div className="text-sm whitespace-nowrap text-muted-foreground">
                          {formatCreatedDate(t.createdAt)}
                        </div>
                        <div className="text-sm font-medium whitespace-nowrap">
                          {formatPrice(t.price)} DA
                        </div>
                        <div className="min-w-[140px]">
                          <div className="text-sm font-medium">
                            {t.spotsTaken}/{t.capacity}
                          </div>
                          <div className="mt-1.5 h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-border">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                tripAvailabilityBarColor(remaining, t.capacity),
                              )}
                              style={{ width: `${fillPercent}%` }}
                            />
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {tripAvailabilityLabel(remaining, t.capacity)}
                          </div>
                        </div>
                        <div className="text-sm font-medium">{resaCount}</div>
                        <div className="flex items-center justify-end gap-1">
                          {can("reservations", "create") && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate({ to: paths.inscriptions, search: { trip: t.id } });
                              }}
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              Inscrire
                            </Button>
                          )}
                          <TripShareLink
                            trip={t}
                            compact
                            className="h-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                          />
                          {can("trips", "delete") && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive opacity-0 transition group-hover:opacity-100"
                              aria-label="Supprimer"
                              onClick={(e) => handleDelete(t, e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <TripFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={(trip) => {
          setDialogOpen(false);
          navigate({ to: paths.tripDetail, params: { tripId: trip.id } });
        }}
      />
    </div>
  );
}
