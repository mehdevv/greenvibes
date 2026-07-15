import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  exportReservationsCsv,
  reservationStatusLabel,
  useCancelReservation,
  useDeleteReservation,
  useListReservations,
  useReservationsRealtime,
  useUpdateReservationStatus,
} from "@/api";
import type { ReservationStatus } from "@/api/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/constants";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reservations")({
  component: AdminReservationsRoute,
});

function AdminReservationsRoute() {
  return <ReservationsPage />;
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("fr-DZ", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ReservationsPage() {
  const { can } = useAuth();
  const canResUpdate = can("reservations", "update");
  const canResDelete = can("reservations", "delete");
  const showResActions = canResUpdate || canResDelete;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReservationStatus | "all">("all");
  useReservationsRealtime();

  const { data: reservations, isLoading, isError, error } = useListReservations({
    search: search || undefined,
    status: status === "all" ? undefined : status,
  });
  const updateStatus = useUpdateReservationStatus();
  const cancelReservation = useCancelReservation();
  const deleteReservation = useDeleteReservation();

  const handleExport = async () => {
    if (!reservations?.length) return;
    const blob = await exportReservationsCsv(reservations);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reservations-greenvibes.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Réservations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Toutes les réservations clients — données en direct.
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={!reservations?.length}>
          Exporter CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Rechercher (nom, téléphone, ville, réf.)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={status} onValueChange={(v) => setStatus(v as ReservationStatus | "all")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="confirmed">Confirmée</SelectItem>
            <SelectItem value="waitlisted">Réservée</SelectItem>
            <SelectItem value="cancelled">Annulée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{reservations?.length ?? 0} réservation(s)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : isError ? (
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Impossible de charger les réservations."}
            </p>
          ) : !reservations?.length ? (
            <p className="text-sm text-muted-foreground">Aucune réservation pour le moment.</p>
          ) : (
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4">Réf.</th>
                  <th className="pb-3 pr-4">Prénom</th>
                  <th className="pb-3 pr-4">Nom</th>
                  <th className="pb-3 pr-4">Téléphone</th>
                  <th className="pb-3 pr-4">Adresse</th>
                  <th className="pb-3 pr-4">Voyage</th>
                  <th className="pb-3 pr-4">Prix</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Statut</th>
                  {showResActions && <th className="pb-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id} className="border-b border-border/60">
                    <td className="py-3 pr-4 font-medium">{r.bookingRef}</td>
                    <td className="py-3 pr-4">{r.firstName}</td>
                    <td className="py-3 pr-4">{r.lastName}</td>
                    <td className="py-3 pr-4">
                      <a href={`tel:${r.phone}`} className="hover:underline">
                        {r.phone}
                      </a>
                    </td>
                    <td className="py-3 pr-4">{r.location}</td>
                    <td className="py-3 pr-4">{r.trip?.title ?? "—"}</td>
                    <td className="py-3 pr-4">
                      {r.trip?.price != null ? `${formatPrice(r.trip.price)} DA` : "—"}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                    <td className="py-3 pr-4">
                      {canResUpdate ? (
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
                          <SelectTrigger className="h-8 w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="confirmed">Confirmée</SelectItem>
                            <SelectItem value="waitlisted">Réservée</SelectItem>
                            <SelectItem value="cancelled">Annulée</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        reservationStatusLabel(r.status)
                      )}
                    </td>
                    {showResActions && (
                      <td className="py-3">
                        <div className="flex gap-1">
                          {canResUpdate && r.status !== "cancelled" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={async () => {
                                try {
                                  await cancelReservation.mutateAsync(r.id);
                                  toast.success("Réservation annulée");
                                } catch (err) {
                                  toast.error(err instanceof Error ? err.message : "Erreur");
                                }
                              }}
                            >
                              Annuler
                            </Button>
                          )}
                          {canResDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={async () => {
                              if (!window.confirm(`Supprimer ${r.firstName} ${r.lastName} ?`)) return;
                              try {
                                await deleteReservation.mutateAsync(r.id);
                                toast.success("Réservation supprimée");
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : "Erreur");
                              }
                            }}
                          >
                            Supprimer
                          </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
