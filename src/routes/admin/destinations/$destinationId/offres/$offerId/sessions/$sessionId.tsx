import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  useGetDestinationById,
  useGetOfferById,
  useGetSession,
  useListBookings,
  useUpdateBookingStatus,
} from "@/api";
import type { Booking, BookingStatus } from "@/api/types";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { BookingEditDialog } from "@/components/admin/booking-edit-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/constants";
import { toast } from "sonner";
import { Pencil, Printer } from "lucide-react";

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: "pending", label: "En attente" },
  { value: "confirmed", label: "Confirmée" },
  { value: "paid", label: "Payée" },
  { value: "cancelled", label: "Annulée" },
  { value: "completed", label: "Terminée" },
];

export const Route = createFileRoute(
  "/admin/destinations/$destinationId/offres/$offerId/sessions/$sessionId",
)({
  component: SessionManifestPage,
});

function SessionManifestPage() {
  const { destinationId, offerId, sessionId } = Route.useParams();
  const { canWrite } = useAuth();
  const { data: destination } = useGetDestinationById(destinationId);
  const { data: offer } = useGetOfferById(offerId);
  const { data: session } = useGetSession(sessionId);
  const { data: bookings, isLoading } = useListBookings({ sessionId });
  const updateStatus = useUpdateBookingStatus();
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  const activeBookings = (bookings ?? []).filter((b) => b.status !== "cancelled");
  const totalParticipants = activeBookings.reduce((sum, b) => sum + b.participants, 0);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      <div className="no-print">
        <AdminBreadcrumbs
          items={[
            { label: "Destinations", to: "/admin/destinations" },
            {
              label: destination?.title ?? "…",
              to: "/admin/destinations/$destinationId",
              params: { destinationId },
            },
            {
              label: offer?.title ?? "…",
              to: "/admin/destinations/$destinationId/offres/$offerId",
              params: { destinationId, offerId },
            },
            { label: session?.sessionDate ?? "Session" },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="print-manifest-header">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Liste des participants
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{destination?.title}</span>
            {" · "}
            {offer?.title}
            {" · "}
            Départ du <span className="font-medium text-foreground">{session?.sessionDate}</span>
          </p>
          {session && (
            <p className="mt-1 text-sm text-muted-foreground">
              {totalParticipants}/{session.capacity} participants confirmés ·{" "}
              {activeBookings.length} réservation(s)
            </p>
          )}
        </div>
        <div className="no-print flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer la liste
          </Button>
        </div>
      </div>

      <Card className="print-manifest-card">
        <CardHeader className="no-print">
          <CardTitle className="text-base">
            {isLoading ? "Chargement..." : `${bookings?.length ?? 0} inscription(s)`}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0 sm:p-6">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Chargement...</p>
          ) : (bookings ?? []).length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Aucun participant pour cette session.</p>
          ) : (
            <table className="w-full text-sm print-manifest-table">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 pb-3 pr-4">#</th>
                  <th className="pb-3 pr-4">Réf.</th>
                  <th className="pb-3 pr-4">Nom</th>
                  <th className="pb-3 pr-4">Téléphone</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Pers.</th>
                  <th className="pb-3 pr-4">Total</th>
                  <th className="pb-3 pr-4">Statut</th>
                  <th className="pb-3 pr-4">Demandes</th>
                  <th className="pb-3 no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(bookings ?? []).map((b, index) => (
                  <tr key={b.id} className="border-b border-border/60">
                    <td className="px-4 py-3 pr-4 text-muted-foreground">{index + 1}</td>
                    <td className="py-3 pr-4 font-medium">{b.bookingRef}</td>
                    <td className="py-3 pr-4">
                      {b.firstName} {b.lastName}
                    </td>
                    <td className="py-3 pr-4">{b.phone || "—"}</td>
                    <td className="py-3 pr-4">{b.email}</td>
                    <td className="py-3 pr-4">{b.participants}</td>
                    <td className="py-3 pr-4">{formatPrice(b.totalPriceDzd)} DA</td>
                    <td className="py-3 pr-4">
                      {canWrite ? (
                        <>
                          <span className="hidden print:inline">
                            {STATUS_OPTIONS.find((o) => o.value === b.status)?.label ?? b.status}
                          </span>
                          <div className="print:hidden">
                            <Select
                              value={b.status}
                              onValueChange={async (v) => {
                                try {
                                  await updateStatus.mutateAsync({
                                    id: b.id,
                                    status: v as BookingStatus,
                                  });
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
                                {STATUS_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      ) : (
                        STATUS_OPTIONS.find((o) => o.value === b.status)?.label ?? b.status
                      )}
                    </td>
                    <td className="max-w-[12rem] py-3 pr-4 text-xs text-muted-foreground">
                      {b.specialRequests || "—"}
                    </td>
                    {canWrite && (
                      <td className="py-3 no-print">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingBooking(b)}
                          aria-label="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="print-manifest-footer">
                <tr className="border-t font-medium">
                  <td colSpan={5} className="px-4 py-3 text-right">
                    Total participants (hors annulés)
                  </td>
                  <td className="py-3">{totalParticipants}</td>
                  <td colSpan={canWrite ? 4 : 3} />
                </tr>
              </tfoot>
            </table>
          )}
        </CardContent>
      </Card>

      <div className="hidden print:block print-manifest-footer text-xs text-muted-foreground">
        GreenVibes Agency · Imprimé le {new Date().toLocaleDateString("fr-FR")}
      </div>

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
