import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useListAllTripsAdmin, useReservationsRealtime, useTripsRealtime } from "@/api";
import type { Trip } from "@/api/types";
import { ReservationQuickForm } from "@/components/admin/reservation-quick-form";
import { TripSheetsManager } from "@/components/admin/trip-sheets-manager";
import { useAuth } from "@/lib/auth";
import { useWorkspacePaths } from "@/lib/workspace-paths";
import { tripSpotsRemaining } from "@/lib/availability";
import { formatDepartureDate } from "@/lib/trip-dates";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ExternalLink, Search } from "lucide-react";

export const Route = createFileRoute("/admin/inscriptions")({
  validateSearch: (search: Record<string, unknown>) => ({
    trip: typeof search.trip === "string" ? search.trip : undefined,
  }),
  component: AdminInscriptionsRoute,
});

function AdminInscriptionsRoute() {
  const { trip } = Route.useSearch();
  return <InscriptionsPage tripIdFromUrl={trip} />;
}

export function InscriptionsPage({ tripIdFromUrl }: { tripIdFromUrl?: string }) {
  const paths = useWorkspacePaths();
  const navigate = useNavigate();
  const { can } = useAuth();
  const { data: trips, isLoading } = useListAllTripsAdmin();
  useTripsRealtime();
  useReservationsRealtime();

  const [search, setSearch] = useState("");
  const [selectedTripId, setSelectedTripId] = useState<string | null>(tripIdFromUrl ?? null);

  const sortedTrips = useMemo(() => {
    const list = [...(trips ?? [])];
    list.sort((a, b) => {
      const aActive = a.active && !a.archived ? 1 : 0;
      const bActive = b.active && !b.archived ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [trips]);

  const filteredTrips = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedTrips;
    return sortedTrips.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.slug?.toLowerCase().includes(q) ?? false) ||
        t.meetingPoint.toLowerCase().includes(q),
    );
  }, [sortedTrips, search]);

  const selectedTrip = useMemo(
    () => trips?.find((t) => t.id === selectedTripId) ?? null,
    [trips, selectedTripId],
  );

  useEffect(() => {
    if (tripIdFromUrl && tripIdFromUrl !== selectedTripId) {
      setSelectedTripId(tripIdFromUrl);
    }
  }, [tripIdFromUrl, selectedTripId]);

  useEffect(() => {
    if (!selectedTripId && filteredTrips.length > 0) {
      const preferred = tripIdFromUrl ?? filteredTrips[0].id;
      setSelectedTripId(preferred);
    }
  }, [filteredTrips, selectedTripId, tripIdFromUrl]);

  const selectTrip = (trip: Trip) => {
    setSelectedTripId(trip.id);
    navigate({ to: paths.inscriptions, search: { trip: trip.id }, replace: true });
  };

  if (!can("reservations", "create")) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <p className="text-muted-foreground">Accès en lecture seule — inscription non autorisée.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-4 md:gap-5">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">Inscriptions clients</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choisissez une offre, inscrivez un client et suivez son statut sur place.
        </p>
      </div>

      {/* Mobile: trip picker */}
      <div className="space-y-2 lg:hidden">
        <label className="text-sm font-medium text-foreground">Offre</label>
        {isLoading ? (
          <Skeleton className="h-12 w-full rounded-xl" />
        ) : (
          <Select
            value={selectedTripId ?? undefined}
            onValueChange={(id) => {
              const trip = filteredTrips.find((t) => t.id === id);
              if (trip) selectTrip(trip);
            }}
          >
            <SelectTrigger className="h-12 w-full text-base">
              <SelectValue placeholder="Choisir une offre…" />
            </SelectTrigger>
            <SelectContent>
              {filteredTrips.map((t) => {
                const remaining = tripSpotsRemaining(t.capacity, t.spotsTaken);
                return (
                  <SelectItem key={t.id} value={t.id} className="py-3">
                    <span className="line-clamp-1">{t.title}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({t.spotsTaken}/{t.capacity}
                      {remaining <= 0 ? " — complet" : ""})
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filtrer les offres…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 pl-9"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <aside className="hidden w-full shrink-0 flex-col rounded-xl border border-border bg-card lg:flex lg:w-72 xl:w-80">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une offre…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="max-h-none flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredTrips.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">Aucune offre trouvée.</p>
            ) : (
              <ul className="space-y-1">
                {filteredTrips.map((t) => {
                  const remaining = tripSpotsRemaining(t.capacity, t.spotsTaken);
                  const selected = t.id === selectedTripId;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => selectTrip(t)}
                        className={cn(
                          "w-full rounded-lg px-3 py-2.5 text-left transition",
                          selected
                            ? "bg-forest text-white shadow-sm"
                            : "hover:bg-secondary/80",
                        )}
                      >
                        <p className="font-medium line-clamp-2">{t.title}</p>
                        <div
                          className={cn(
                            "mt-1 flex flex-wrap items-center gap-1.5 text-xs",
                            selected ? "text-white/85" : "text-muted-foreground",
                          )}
                        >
                          <span>
                            {t.spotsTaken}/{t.capacity} places
                          </span>
                          {t.departureDate && (
                            <>
                              <span>·</span>
                              <span>{formatDepartureDate(t) ?? t.departureDate}</span>
                            </>
                          )}
                          {remaining <= 0 && (
                            <Badge
                              variant="destructive"
                              className={cn("h-5 px-1.5 text-[10px]", selected && "bg-white/20 text-white")}
                            >
                              Complet
                            </Badge>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {selectedTrip && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3 md:bg-transparent md:p-0 md:border-0">
              <div className="min-w-0">
                <h2 className="font-display text-lg font-semibold text-foreground md:text-xl">{selectedTrip.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedTrip.spotsTaken}/{selectedTrip.capacity} inscrits
                  {selectedTrip.departureDate && (
                    <> · {formatDepartureDate(selectedTrip) ?? selectedTrip.departureDate}</>
                  )}
                </p>
              </div>
              <Link
                to={paths.tripDetail}
                params={{ tripId: selectedTrip.id }}
                className="inline-flex items-center gap-1.5 text-sm text-forest hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Gérer l&apos;offre
              </Link>
            </div>
          )}

          <ReservationQuickForm trip={selectedTrip} />

          {selectedTrip ? (
            <div className="flex min-h-[320px] flex-1 flex-col rounded-xl border border-border bg-card p-3 md:min-h-[480px] md:p-5">
              <h3 className="mb-3 font-semibold text-foreground">Participants &amp; statuts</h3>
              <TripSheetsManager trip={selectedTrip} />
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border p-12 text-sm text-muted-foreground">
              Sélectionnez une offre pour voir les participants.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
