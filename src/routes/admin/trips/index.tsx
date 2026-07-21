import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useListAllTripsAdmin, useListReservations, useReservationsRealtime, useDeleteTrip } from "@/api";
import type { Trip } from "@/api/types";
import { TripFormDialog } from "@/components/admin/trip-form-dialog";
import { TripListCard } from "@/components/admin/trip-list-card";
import { useAuth } from "@/lib/auth";
import { useWorkspacePaths } from "@/lib/workspace-paths";
import { tripSpotsRemaining } from "@/lib/availability";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Armchair, Package, Plus, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Filter = "all" | "active" | "inactive" | "archived" | "full" | "available";
type CreatedFilter = "all" | "7d" | "30d" | "90d";
type SortOrder = "newest" | "oldest" | "departure";

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
  const [filter, setFilter] = useState<Filter>("active");
  const [createdFilter, setCreatedFilter] = useState<CreatedFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("departure");
  const [dialogOpen, setDialogOpen] = useState(false);

  const reservationCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of allReservations) {
      if (r.status === "cancelled") continue;
      map.set(r.tripId, (map.get(r.tripId) ?? 0) + 1);
    }
    return map;
  }, [allReservations]);

  const summary = useMemo(() => {
    const list = trips ?? [];
    return {
      total: list.length,
      active: list.filter((t) => t.active && !t.archived).length,
      available: list.filter((t) => tripSpotsRemaining(t.capacity, t.spotsTaken) > 0 && t.active && !t.archived).length,
      full: list.filter((t) => tripSpotsRemaining(t.capacity, t.spotsTaken) <= 0 && !t.archived).length,
      archived: list.filter((t) => t.archived).length,
    };
  }, [trips]);

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
      if (sortOrder === "departure") {
        const aDate = a.departureDate ? new Date(a.departureDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bDate = b.departureDate ? new Date(b.departureDate).getTime() : Number.MAX_SAFE_INTEGER;
        if (aDate !== bDate) return aDate - bDate;
      }
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sortOrder === "oldest" ? -diff : diff;
    });
    return list;
  }, [trips, search, filter, createdFilter, sortOrder]);

  const primaryFilters: { id: Filter; label: string; count?: number }[] = [
    { id: "active", label: "Actives", count: summary.active },
    { id: "all", label: "Toutes", count: summary.total },
    { id: "available", label: "Places libres" },
    { id: "full", label: "Complètes", count: summary.full },
    { id: "archived", label: "Archivées", count: summary.archived },
    { id: "inactive", label: "Inactives" },
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
    <div className="space-y-8 pb-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Voyages &amp; offres
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground md:text-base">
            Toutes vos sorties au même endroit — statut, places, lien court et actions rapides.
          </p>
        </div>
        {can("trips", "create") && (
          <Button className="h-11 shrink-0 gap-2 rounded-full px-5 sm:h-10" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle offre
          </Button>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total offres" value={summary.total} icon={Package} />
        <SummaryCard label="Actives" value={summary.active} icon={Sparkles} accent="forest" />
        <SummaryCard label="Avec places libres" value={summary.available} icon={Armchair} accent="success" />
        <SummaryCard label="Complètes" value={summary.full} icon={Armchair} accent={summary.full > 0 ? "warning" : "muted"} />
      </div>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-4 md:p-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par titre, slug, lieu, durée…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 border-0 bg-secondary/50 pl-9 shadow-none focus-visible:ring-forest/30"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {primaryFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                filter === f.id
                  ? "bg-forest text-white shadow-sm"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
              {f.count !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                    filter === f.id ? "bg-white/20" : "bg-background",
                  )}
                >
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filteredTrips.length}</span>
            {" "}offre{filteredTrips.length !== 1 ? "s" : ""} affichée{filteredTrips.length !== 1 ? "s" : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <Select value={createdFilter} onValueChange={(v) => setCreatedFilter(v as CreatedFilter)}>
              <SelectTrigger className="h-9 w-[140px] rounded-full bg-secondary border-0">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes dates</SelectItem>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
                <SelectItem value="90d">90 derniers jours</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
              <SelectTrigger className="h-9 w-[160px] rounded-full bg-secondary border-0">
                <SelectValue placeholder="Tri" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="departure">Départ le plus proche</SelectItem>
                <SelectItem value="newest">Plus récentes</SelectItem>
                <SelectItem value="oldest">Plus anciennes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center text-sm text-destructive">
          Impossible de charger les offres.
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/20 px-6 py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground/60" />
          <p className="mt-4 font-medium text-foreground">Aucune offre ne correspond</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Modifiez les filtres ou créez une nouvelle offre pour commencer.
          </p>
          {can("trips", "create") && (
            <Button className="mt-6 rounded-full" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Créer une offre
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTrips.map((t) => (
            <TripListCard
              key={t.id}
              trip={t}
              reservationCount={reservationCounts.get(t.id) ?? 0}
              tripDetailPath={paths.tripDetail}
              canInscribe={can("reservations", "create")}
              canDelete={can("trips", "delete")}
              onInscribe={() => navigate({ to: paths.inscriptions, search: { trip: t.id } })}
              onDelete={(e) => handleDelete(t, e)}
            />
          ))}
        </div>
      )}

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

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent = "muted",
}: {
  label: string;
  value: number;
  icon: typeof Package;
  accent?: "forest" | "success" | "warning" | "muted";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5",
        accent === "forest" && "border-forest/20 bg-forest/5",
        accent === "success" && "border-emerald-200/80 bg-emerald-50/40",
        accent === "warning" && value > 0 && "border-amber-200/80 bg-amber-50/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className={cn("h-4 w-4 shrink-0", accent === "forest" ? "text-forest" : "text-muted-foreground")} />
      </div>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
