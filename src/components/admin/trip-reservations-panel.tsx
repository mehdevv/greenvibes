import { useMemo, useState } from "react";
import type { Reservation, ReservationStatus, Trip } from "@/api/types";
import {
  reservationStatusLabel,
  useListReservationsByTrip,
  useUpdateReservationStatus,
} from "@/api";
import { useUpdateTripCapacity } from "@/api/trips";
import { useAuth } from "@/lib/auth";
import {
  tripAvailabilityBarColor,
  tripAvailabilityLabel,
  tripSpotsRemaining,
} from "@/lib/availability";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MessageCircle, Phone, Plus } from "lucide-react";

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("fr-DZ", { dateStyle: "short", timeStyle: "short" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

const STATUS_STYLES: Record<ReservationStatus, string> = {
  confirmed: "bg-emerald-100 text-emerald-800",
  waitlisted: "bg-amber-100 text-amber-800",
  cancelled: "bg-gray-100 text-gray-600 line-through",
};

type TripReservationsPanelProps = {
  trip: Trip;
  open: boolean;
  preloadedReservations?: Reservation[];
};

export function TripReservationsPanel({
  trip,
  open,
  preloadedReservations,
}: TripReservationsPanelProps) {
  const { canWrite } = useAuth();
  const [extraPlaces, setExtraPlaces] = useState("2");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">("all");

  const shouldFetch = open && !preloadedReservations;
  const { data: fetched, isLoading } = useListReservationsByTrip(shouldFetch ? trip.id : "");
  const reservations = preloadedReservations ?? fetched ?? [];

  const updateStatus = useUpdateReservationStatus();
  const updateCapacity = useUpdateTripCapacity();

  const remaining = tripSpotsRemaining(trip.capacity, trip.spotsTaken);
  const fillPercent =
    trip.capacity > 0 ? Math.min(100, Math.round((trip.spotsTaken / trip.capacity) * 100)) : 0;

  const counts = useMemo(
    () => ({
      confirmed: reservations.filter((r) => r.status === "confirmed").length,
      waitlisted: reservations.filter((r) => r.status === "waitlisted").length,
      cancelled: reservations.filter((r) => r.status === "cancelled").length,
    }),
    [reservations],
  );

  const filtered = useMemo(
    () =>
      statusFilter === "all"
        ? reservations
        : reservations.filter((r) => r.status === statusFilter),
    [reservations, statusFilter],
  );

  const handleAddPlaces = async (add: number) => {
    if (add < 1) return;
    try {
      await updateCapacity.mutateAsync({ id: trip.id, capacity: trip.capacity + add });
      toast.success(`+${add} place(s)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  if (!open) return null;

  return (
    <div className="mt-4 space-y-4 border-t border-border/60 pt-4">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-secondary/50 to-background p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-[180px] flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Remplissage
            </p>
            <p className="mt-1 font-display text-3xl font-bold text-forest">
              {trip.spotsTaken}
              <span className="text-lg font-normal text-muted-foreground">/{trip.capacity}</span>
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {tripAvailabilityLabel(remaining, trip.capacity)}
            </p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-border">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  tripAvailabilityBarColor(remaining, trip.capacity),
                )}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-center">
            {(
              [
                ["confirmed", counts.confirmed, "Confirmées"],
                ["waitlisted", counts.waitlisted, "Réservées"],
                ["cancelled", counts.cancelled, "Annulées"],
              ] as const
            ).map(([key, n, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
                className={cn(
                  "min-w-[72px] rounded-xl border px-3 py-2 transition",
                  statusFilter === key
                    ? "border-forest bg-forest/10 ring-1 ring-forest/30"
                    : "border-border bg-card hover:bg-secondary/60",
                )}
              >
                <div className="text-lg font-bold text-foreground">{n}</div>
                <div className="text-[10px] text-muted-foreground">{label}</div>
              </button>
            ))}
          </div>
        </div>

        {canWrite && (
          <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-border/50 pt-4">
            <span className="text-xs font-medium text-muted-foreground">Ajouter des places :</span>
            {[2, 5, 10].map((n) => (
              <Button
                key={n}
                type="button"
                size="sm"
                variant="secondary"
                disabled={updateCapacity.isPending}
                onClick={() => handleAddPlaces(n)}
              >
                +{n}
              </Button>
            ))}
            <div className="flex items-end gap-1.5">
              <div>
                <Label htmlFor={`add-${trip.id}`} className="sr-only">
                  Places personnalisées
                </Label>
                <Input
                  id={`add-${trip.id}`}
                  type="number"
                  min={1}
                  className="h-8 w-16"
                  value={extraPlaces}
                  onChange={(e) => setExtraPlaces(e.target.value)}
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 gap-1"
                disabled={updateCapacity.isPending}
                onClick={() => handleAddPlaces(Number(extraPlaces) || 0)}
              >
                <Plus className="h-3.5 w-3.5" />
                OK
              </Button>
            </div>
          </div>
        )}
      </div>

      {isLoading && !preloadedReservations ? (
        <p className="text-sm text-muted-foreground">Chargement des réservations…</p>
      ) : !reservations.length ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          Aucune réservation pour cette offre.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          Aucune réservation avec ce filtre.
          <button
            type="button"
            className="ml-1 text-forest underline"
            onClick={() => setStatusFilter("all")}
          >
            Tout afficher
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-forest">{r.bookingRef}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase sm:hidden",
                      STATUS_STYLES[r.status],
                    )}
                  >
                    {reservationStatusLabel(r.status)}
                  </span>
                </div>
                <p className="mt-1 font-medium text-foreground">
                  {r.firstName} {r.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{r.location}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 gap-1.5" asChild>
                  <a href={`tel:${r.phone}`}>
                    <Phone className="h-3.5 w-3.5" />
                    Appeler
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="h-8 gap-1.5" asChild>
                  <a
                    href={`https://wa.me/${r.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Bonjour ${r.firstName}, concernant votre réservation ${r.bookingRef} — GreenVibes`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    WhatsApp
                  </a>
                </Button>
                {canWrite ? (
                  <Select
                    value={r.status}
                    onValueChange={async (v) => {
                      try {
                        await updateStatus.mutateAsync({
                          id: r.id,
                          status: v as ReservationStatus,
                        });
                        toast.success("Statut mis à jour");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Erreur");
                      }
                    }}
                  >
                    <SelectTrigger className="hidden h-8 w-[130px] sm:flex">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="waitlisted">Réservée</SelectItem>
                      <SelectItem value="confirmed">Confirmée</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span
                    className={cn(
                      "hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline",
                      STATUS_STYLES[r.status],
                    )}
                  >
                    {reservationStatusLabel(r.status)}
                  </span>
                )}
              </div>

              {canWrite && (
                <div className="w-full sm:hidden">
                  <Select
                    value={r.status}
                    onValueChange={async (v) => {
                      try {
                        await updateStatus.mutateAsync({
                          id: r.id,
                          status: v as ReservationStatus,
                        });
                        toast.success("Statut mis à jour");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Erreur");
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="waitlisted">Réservée</SelectItem>
                      <SelectItem value="confirmed">Confirmée</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Compact summary for collapsed trip card header */
export function TripReservationSummary({
  reservations,
}: {
  reservations: Reservation[];
}) {
  const confirmed = reservations.filter((r) => r.status === "confirmed").length;
  const waitlisted = reservations.filter((r) => r.status === "waitlisted").length;

  if (!reservations.length) {
    return <span className="text-xs text-muted-foreground">0 réservation</span>;
  }

  return (
    <span className="text-xs text-muted-foreground">
      {reservations.length} réservation{reservations.length > 1 ? "s" : ""}
      {(confirmed > 0 || waitlisted > 0) && (
        <>
          {" "}
          ·{" "}
          {confirmed > 0 && (
            <span className="text-emerald-700">{confirmed} confirmée{confirmed > 1 ? "s" : ""}</span>
          )}
          {confirmed > 0 && waitlisted > 0 && ", "}
          {waitlisted > 0 && (
            <span className="text-amber-700">{waitlisted} en attente</span>
          )}
        </>
      )}
    </span>
  );
}
