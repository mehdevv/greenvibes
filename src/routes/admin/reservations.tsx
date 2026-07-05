import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  useListBookings,
  useUpdateBookingStatus,
  useCancelBooking,
  exportBookingsCsv,
} from "@/api";
import type { Booking } from "@/api/types";
import { BookingEditDialog } from "@/components/admin/booking-edit-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/constants";
import { toast } from "sonner";
import type { BookingStatus } from "@/api/types";
import { Pencil } from "lucide-react";

export const Route = createFileRoute("/admin/reservations")({
  component: AdminReservationsPage,
});

function AdminReservationsPage() {
  const { canWrite } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const { data: bookings, isLoading, isError, error } = useListBookings({
    search: search || undefined,
    status: status === "all" ? undefined : status,
  });
  const updateStatus = useUpdateBookingStatus();
  const cancelBooking = useCancelBooking();

  const handleExport = async () => {
    if (!bookings?.length) return;
    const blob = await exportBookingsCsv(bookings);
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
        <h1 className="font-display text-3xl font-bold text-foreground">Réservations</h1>
        <Button variant="outline" onClick={handleExport} disabled={!bookings?.length}>
          Exporter CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Rechercher (nom, email, téléphone, réf.)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onValueChange={(v) => setStatus(v as BookingStatus | "all")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="confirmed">Confirmée</SelectItem>
            <SelectItem value="paid">Payée</SelectItem>
            <SelectItem value="cancelled">Annulée</SelectItem>
            <SelectItem value="completed">Terminée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{bookings?.length ?? 0} réservation(s)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : isError ? (
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Impossible de charger les réservations."}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4">Réf.</th>
                  <th className="pb-3 pr-4">Client</th>
                  <th className="pb-3 pr-4">Téléphone</th>
                  <th className="pb-3 pr-4">Circuit</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Pers.</th>
                  <th className="pb-3 pr-4">Total</th>
                  <th className="pb-3 pr-4">Statut</th>
                  {canWrite && <th className="pb-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {(bookings ?? []).map((b) => (
                  <tr key={b.id} className="border-b border-border/60">
                    <td className="py-3 pr-4 font-medium">{b.bookingRef}</td>
                    <td className="py-3 pr-4">
                      {b.firstName} {b.lastName}
                      <div className="text-xs text-muted-foreground">{b.email}</div>
                    </td>
                    <td className="py-3 pr-4">
                      {b.phone ? (
                        <a href={`tel:${b.phone}`} className="hover:underline">
                          {b.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">{b.session?.offer?.title ?? "—"}</td>
                    <td className="py-3 pr-4">{b.session?.sessionDate ?? "—"}</td>
                    <td className="py-3 pr-4">{b.participants}</td>
                    <td className="py-3 pr-4">{formatPrice(b.totalPriceDzd)} DA</td>
                    <td className="py-3 pr-4">
                      {canWrite ? (
                        <Select
                          value={b.status}
                          onValueChange={async (v) => {
                            try {
                              await updateStatus.mutateAsync({ id: b.id, status: v as BookingStatus });
                              toast.success("Statut mis à jour");
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : "Erreur");
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="confirmed">Confirmée</SelectItem>
                            <SelectItem value="paid">Payée</SelectItem>
                            <SelectItem value="cancelled">Annulée</SelectItem>
                            <SelectItem value="completed">Terminée</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        b.status
                      )}
                    </td>
                    {canWrite && (
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingBooking(b)}
                            aria-label="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {b.status !== "cancelled" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={async () => {
                                try {
                                  await cancelBooking.mutateAsync(b.id);
                                  toast.success("Réservation annulée");
                                } catch (err) {
                                  toast.error(err instanceof Error ? err.message : "Erreur");
                                }
                              }}
                            >
                              Annuler
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

      <BookingEditDialog
        booking={editingBooking}
        open={Boolean(editingBooking)}
        onOpenChange={(open) => {
          if (!open) setEditingBooking(null);
        }}
      />
    </div>
  );
}
