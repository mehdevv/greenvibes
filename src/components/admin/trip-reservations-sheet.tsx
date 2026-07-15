import { useMemo, useState } from "react";
import type { Reservation, ReservationStatus, Trip } from "@/api/types";
import {
  reservationStatusLabel,
  useDeleteReservation,
  useListReservationsByTrip,
  useUpdateReservationStatus,
} from "@/api";
import { useUpdateTripCapacity } from "@/api/trips";
import { useAuth } from "@/lib/auth";
import {
  downloadTripPassengerList,
  printTripPassengerList,
} from "@/lib/trip-passenger-list";
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
import { Download, MessageCircle, Minus, Phone, Plus, Printer, Search, Trash2 } from "lucide-react";

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
  confirmed: "bg-emerald-50 text-emerald-800",
  waitlisted: "bg-amber-50 text-amber-800",
  cancelled: "bg-gray-50 text-gray-500 line-through",
};

const SHEET_HEAD =
  "sticky top-0 z-20 border border-border bg-[#f1f3f4] px-3 py-2.5 text-left text-sm font-semibold text-foreground shadow-[0_1px_0_0_hsl(var(--border))]";
const SHEET_CELL = "border border-border px-3 py-2.5 text-sm text-foreground align-middle";
const SHEET_ROW_NUM =
  "sticky left-0 z-10 border border-border bg-[#f8f9fa] px-2 py-2.5 text-center text-sm font-medium text-muted-foreground";

type TripReservationsSheetProps = {
  trip: Trip;
};

export function TripReservationsSheet({ trip }: TripReservationsSheetProps) {
  const { can } = useAuth();
  const canResUpdate = can("reservations", "update");
  const canResDelete = can("reservations", "delete");
  const canTripUpdate = can("trips", "update");
  const [placeDelta, setPlaceDelta] = useState("1");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">("all");
  const [search, setSearch] = useState("");

  const { data: reservations = [], isLoading } = useListReservationsByTrip(trip.id);
  const updateStatus = useUpdateReservationStatus();
  const updateCapacity = useUpdateTripCapacity();
  const deleteReservation = useDeleteReservation();

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

  const filtered = useMemo(() => {
    let list = reservations;
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) =>
        r.bookingRef.toLowerCase().includes(q) ||
        r.firstName.toLowerCase().includes(q) ||
        r.lastName.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.location.toLowerCase().includes(q),
    );
  }, [reservations, statusFilter, search]);

  const minCapacity = Math.max(1, trip.spotsTaken);

  const handleAdjustPlaces = async (delta: number) => {
    if (delta === 0) return;
    const next = trip.capacity + delta;
    if (next < minCapacity) {
      toast.error(
        `Minimum ${minCapacity} place(s) — ${trip.spotsTaken} déjà inscrite(s). Annulez des réservations pour réduire davantage.`,
      );
      return;
    }
    try {
      await updateCapacity.mutateAsync({ id: trip.id, capacity: next });
      toast.success(delta > 0 ? `+${delta} place(s)` : `${delta} place(s)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div className="min-w-[200px]">
          <p className="text-sm font-medium text-muted-foreground">Remplissage</p>
          <p className="font-display text-3xl font-bold text-forest">
            {trip.spotsTaken}
            <span className="text-lg font-normal text-muted-foreground"> / {trip.capacity}</span>
          </p>
          <p className="text-sm text-muted-foreground">{tripAvailabilityLabel(remaining, trip.capacity)}</p>
          <div className="mt-2 h-2.5 max-w-xs overflow-hidden rounded-full bg-border">
            <div
              className={cn("h-full rounded-full transition-all", tripAvailabilityBarColor(remaining, trip.capacity))}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
          {canTripUpdate && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-medium text-muted-foreground">Capacité</span>
              {[-10, -5].map((n) => (
                <Button
                  key={n}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-2"
                  disabled={updateCapacity.isPending || trip.capacity + n < minCapacity}
                  onClick={() => handleAdjustPlaces(n)}
                >
                  {n}
                </Button>
              ))}
              <span className="min-w-[2.5rem] text-center text-sm font-semibold text-foreground">
                {trip.capacity}
              </span>
              {[5, 10].map((n) => (
                <Button
                  key={n}
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-8 px-2"
                  disabled={updateCapacity.isPending}
                  onClick={() => handleAdjustPlaces(n)}
                >
                  +{n}
                </Button>
              ))}
              <Input
                type="number"
                min={1}
                className="h-8 w-14"
                value={placeDelta}
                onChange={(e) => setPlaceDelta(e.target.value)}
                aria-label="Nombre de places"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8"
                disabled={updateCapacity.isPending || trip.capacity - (Number(placeDelta) || 0) < minCapacity}
                onClick={() => handleAdjustPlaces(-(Number(placeDelta) || 0))}
                aria-label="Retirer des places"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8"
                disabled={updateCapacity.isPending}
                onClick={() => handleAdjustPlaces(Number(placeDelta) || 0)}
                aria-label="Ajouter des places"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
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
                "min-w-[88px] rounded-lg border px-3 py-2 text-center transition",
                statusFilter === key
                  ? "border-forest bg-forest/10 ring-1 ring-forest/30"
                  : "border-border bg-background hover:bg-secondary/60",
              )}
            >
              <div className="text-lg font-bold">{n}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filtrer les participants…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {can("reservations", "read") && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => downloadTripPassengerList(trip, reservations)}
            >
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => printTripPassengerList(trip, reservations)}
            >
              <Printer className="h-4 w-4" />
              Imprimer
            </Button>
          </div>
        )}
      </div>

      <div className="min-h-[420px] flex-1 overflow-auto rounded-lg border border-border bg-white shadow-inner">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Chargement des participants…</p>
        ) : !reservations.length ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            Aucune réservation pour cette offre.
          </p>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            Aucun participant ne correspond au filtre.
          </p>
        ) : (
          <table className="w-full min-w-[960px] border-collapse">
            <thead>
              <tr>
                <th className={cn(SHEET_HEAD, "sticky left-0 z-30 w-12 text-center")}>#</th>
                <th className={cn(SHEET_HEAD, "min-w-[120px]")}>Référence</th>
                <th className={cn(SHEET_HEAD, "min-w-[120px]")}>Prénom</th>
                <th className={cn(SHEET_HEAD, "min-w-[120px]")}>Nom</th>
                <th className={cn(SHEET_HEAD, "min-w-[130px]")}>Téléphone</th>
                <th className={cn(SHEET_HEAD, "min-w-[180px]")}>Adresse</th>
                <th className={cn(SHEET_HEAD, "min-w-[130px]")}>Statut</th>
                <th className={cn(SHEET_HEAD, "min-w-[150px]")}>Inscrit le</th>
                <th className={cn(SHEET_HEAD, "min-w-[140px]")}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, index) => (
                <SheetRow
                  key={r.id}
                  row={r}
                  index={index}
                  canResUpdate={canResUpdate}
                  canResDelete={canResDelete}
                  onStatusChange={async (status) => {
                    try {
                      await updateStatus.mutateAsync({ id: r.id, status });
                      toast.success("Statut mis à jour");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Erreur");
                    }
                  }}
                  onDelete={async () => {
                    if (!window.confirm(`Supprimer ${r.firstName} ${r.lastName} ?`)) return;
                    try {
                      await deleteReservation.mutateAsync(r.id);
                      toast.success("Participant supprimé");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Erreur");
                    }
                  }}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {filtered.length} participant{filtered.length > 1 ? "s" : ""} affiché
        {filtered.length !== reservations.length ? ` sur ${reservations.length}` : ""}
      </p>
    </div>
  );
}

function SheetRow({
  row,
  index,
  canResUpdate,
  canResDelete,
  onStatusChange,
  onDelete,
}: {
  row: Reservation;
  index: number;
  canResUpdate: boolean;
  canResDelete: boolean;
  onStatusChange: (status: ReservationStatus) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  return (
    <tr className="group hover:bg-[#e8f0fe]/40">
      <td className={SHEET_ROW_NUM}>{index + 1}</td>
      <td className={cn(SHEET_CELL, "font-mono font-medium text-forest")}>{row.bookingRef}</td>
      <td className={cn(SHEET_CELL, "font-medium")}>{row.firstName}</td>
      <td className={cn(SHEET_CELL, "font-medium")}>{row.lastName}</td>
      <td className={SHEET_CELL}>
        <a href={`tel:${row.phone}`} className="hover:text-forest hover:underline">
          {row.phone}
        </a>
      </td>
      <td className={SHEET_CELL}>{row.location}</td>
      <td className={SHEET_CELL}>
        {canResUpdate ? (
          <Select value={row.status} onValueChange={(v) => onStatusChange(v as ReservationStatus)}>
            <SelectTrigger className="h-9 w-full min-w-[120px] border-border bg-background text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="waitlisted">Réservée</SelectItem>
              <SelectItem value="confirmed">Confirmée</SelectItem>
              <SelectItem value="cancelled">Annulée</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <span className={cn("inline-block rounded-md px-2 py-1 text-sm font-medium", STATUS_STYLES[row.status])}>
            {reservationStatusLabel(row.status)}
          </span>
        )}
      </td>
      <td className={cn(SHEET_CELL, "whitespace-nowrap text-muted-foreground")}>
        {formatDate(row.createdAt)}
      </td>
      <td className={SHEET_CELL}>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a href={`tel:${row.phone}`} aria-label="Appeler">
              <Phone className="h-4 w-4" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a
              href={`https://wa.me/${row.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Bonjour ${row.firstName}, concernant votre réservation ${row.bookingRef} — GreenVibes`)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </Button>
          {canResDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              aria-label="Supprimer"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
