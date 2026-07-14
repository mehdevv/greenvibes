import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useListAllTripsAdmin, useListReservations, useReservationsRealtime } from "@/api";
import type { Reservation, Trip } from "@/api/types";
import { TripFormDialog } from "@/components/admin/trip-form-dialog";
import {
  TripReservationSummary,
  TripReservationsPanel,
} from "@/components/admin/trip-reservations-panel";
import { useAuth } from "@/lib/auth";
import {
  tripAvailabilityBarColor,
  tripAvailabilityLabel,
  tripSpotsRemaining,
} from "@/lib/availability";
import { formatPrice } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  MapPin,
  Pencil,
  Plus,
  Search,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/admin/trips")({
  component: AdminTripsPage,
});

type Filter = "all" | "active" | "inactive" | "full" | "available";

function groupByTrip(reservations: Reservation[]) {
  const map = new Map<string, Reservation[]>();
  for (const r of reservations) {
    const list = map.get(r.tripId) ?? [];
    list.push(r);
    map.set(r.tripId, list);
  }
  return map;
}

function AdminTripsPage() {
  const { canWrite } = useAuth();
  const { data: trips, isLoading, isError } = useListAllTripsAdmin();
  const { data: allReservations = [] } = useListReservations();
  useReservationsRealtime();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const reservationsByTrip = useMemo(() => groupByTrip(allReservations), [allReservations]);

  const stats = useMemo(() => {
    const list = trips ?? [];
    const active = list.filter((t) => t.active).length;
    const totalCapacity = list.reduce((s, t) => s + t.capacity, 0);
    const totalTaken = list.reduce((s, t) => s + t.spotsTaken, 0);
    const pending = allReservations.filter((r) => r.status === "waitlisted").length;
    return {
      offers: list.length,
      active,
      reservations: allReservations.length,
      pending,
      fillRate: totalCapacity > 0 ? Math.round((totalTaken / totalCapacity) * 100) : 0,
    };
  }, [trips, allReservations]);

  const filteredTrips = useMemo(() => {
    let list = trips ?? [];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.meetingPoint.toLowerCase().includes(q) ||
          t.duration.toLowerCase().includes(q),
      );
    }
    switch (filter) {
      case "active":
        return list.filter((t) => t.active);
      case "inactive":
        return list.filter((t) => !t.active);
      case "full":
        return list.filter((t) => tripSpotsRemaining(t.capacity, t.spotsTaken) <= 0);
      case "available":
        return list.filter((t) => tripSpotsRemaining(t.capacity, t.spotsTaken) > 0);
      default:
        return list;
    }
  }, [trips, search, filter]);

  const openCreate = () => {
    setEditingTrip(null);
    setDialogOpen(true);
  };

  const openEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setDialogOpen(true);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "Toutes" },
    { id: "active", label: "Actives" },
    { id: "available", label: "Places libres" },
    { id: "full", label: "Complètes" },
    { id: "inactive", label: "Inactives" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Offres &amp; voyages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez vos sorties, places et réservations au même endroit.
          </p>
        </div>
        {canWrite && (
          <Button className="gap-2 rounded-full" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nouvelle offre
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatPill label="Offres" value={stats.offers} sub={`${stats.active} actives`} />
        <StatPill label="Réservations" value={stats.reservations} sub={`${stats.pending} en attente`} />
        <StatPill label="Remplissage" value={`${stats.fillRate}%`} sub="global" />
        <StatPill
          label="Places prises"
          value={trips?.reduce((s, t) => s + t.spotsTaken, 0) ?? 0}
          sub={`sur ${trips?.reduce((s, t) => s + t.capacity, 0) ?? 0}`}
        />
      </div>

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
                "rounded-full px-3 py-1.5 text-xs font-medium transition",
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

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">
            Impossible de charger les offres.
          </CardContent>
        </Card>
      ) : filteredTrips.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <p className="text-muted-foreground">Aucune offre ne correspond à votre recherche.</p>
            {canWrite && (
              <Button className="mt-4 gap-2" variant="outline" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Créer une offre
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTrips.map((t) => {
            const remaining = tripSpotsRemaining(t.capacity, t.spotsTaken);
            const fillPercent =
              t.capacity > 0 ? Math.min(100, Math.round((t.spotsTaken / t.capacity) * 100)) : 0;
            const tripReservations = reservationsByTrip.get(t.id) ?? [];
            const isExpanded = expandedId === t.id;

            return (
              <Card
                key={t.id}
                className={cn(
                  "overflow-hidden transition-shadow",
                  isExpanded && "ring-1 ring-forest/20 shadow-md",
                )}
              >
                <CardContent className="p-0">
                  <div className="flex gap-0 sm:gap-4">
                    {t.photoUrl && (
                      <div className="hidden w-28 shrink-0 sm:block md:w-36">
                        <img
                          src={t.photoUrl}
                          alt=""
                          className="h-full min-h-[120px] w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="min-w-0 flex-1 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => toggleExpand(t.id)}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-display text-lg font-semibold text-foreground">
                              {t.title}
                            </h2>
                            <Badge variant={t.active ? "default" : "secondary"}>
                              {t.active ? "Actif" : "Inactif"}
                            </Badge>
                            {remaining <= 0 && (
                              <Badge variant="destructive" className="text-[10px]">
                                Complet
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatPrice(t.price)} DA · {t.duration}
                          </p>
                          {t.meetingPoint && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {t.meetingPoint}
                            </p>
                          )}
                          <div className="mt-2">
                            <TripReservationSummary reservations={tripReservations} />
                          </div>
                        </button>

                        <div className="flex shrink-0 items-center gap-1">
                          {canWrite && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(t)}
                              aria-label="Modifier"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleExpand(t.id)}
                            aria-label={isExpanded ? "Replier" : "Voir réservations"}
                          >
                            <ChevronDown
                              className={cn("h-4 w-4 transition", isExpanded && "rotate-180")}
                            />
                          </Button>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="mt-3 w-full text-left"
                        onClick={() => toggleExpand(t.id)}
                      >
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium text-forest">
                            <Users className="h-3.5 w-3.5" />
                            {t.spotsTaken}/{t.capacity} · {tripAvailabilityLabel(remaining, t.capacity)}
                          </span>
                          <span>{isExpanded ? "Replier" : "Voir réservations"}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              tripAvailabilityBarColor(remaining, t.capacity),
                            )}
                            style={{ width: `${fillPercent}%` }}
                          />
                        </div>
                      </button>

                      <TripReservationsPanel
                        trip={t}
                        open={isExpanded}
                        preloadedReservations={tripReservations}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <TripFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        trip={editingTrip}
      />
    </div>
  );
}

function StatPill({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-display text-2xl font-bold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}
