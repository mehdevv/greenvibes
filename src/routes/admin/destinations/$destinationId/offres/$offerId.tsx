import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  useGetDestinationById,
  useGetOfferById,
  useListSessionsByOfferAdmin,
  useCreateSession,
  useDeleteSession,
  useUpdateSession,
} from "@/api";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { availabilityColor, availabilityLabel, formatPrice } from "@/lib/constants";
import { toast } from "sonner";
import type { SessionStatus } from "@/api/types";
import { Users } from "lucide-react";

const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  open: "Ouverte",
  full: "Complète",
  cancelled: "Annulée",
};

export const Route = createFileRoute("/admin/destinations/$destinationId/offres/$offerId")({
  component: OfferSessionsPage,
});

function OfferSessionsPage() {
  const { destinationId, offerId } = Route.useParams();
  const { canWrite } = useAuth();
  const { data: destination } = useGetDestinationById(destinationId);
  const { data: offer } = useGetOfferById(offerId);
  const { data: sessions, isLoading } = useListSessionsByOfferAdmin(offerId);
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();
  const updateSession = useUpdateSession();

  const [sessionDate, setSessionDate] = useState("");
  const [capacity, setCapacity] = useState(12);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSession.mutateAsync({ offerId, sessionDate, capacity });
      toast.success("Session créée");
      setSessionDate("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const toggleFull = async (sessionId: string, currentStatus: SessionStatus, isFull: boolean) => {
    try {
      await updateSession.mutateAsync({
        id: sessionId,
        status: isFull ? "open" : "full",
      });
      toast.success(isFull ? "Session rouverte" : "Session marquée complète");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs
        items={[
          { label: "Destinations", to: "/admin/destinations" },
          {
            label: destination?.title ?? "…",
            to: "/admin/destinations/$destinationId",
            params: { destinationId },
          },
          { label: offer?.title ?? "…" },
        ]}
      />

      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">{offer?.title ?? "Offre"}</h1>
        {offer && (
          <p className="mt-1 text-sm text-muted-foreground">
            {formatPrice(offer.priceDzd)} DA · {offer.durationLabel}
          </p>
        )}
      </div>

      {canWrite && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ajouter une session</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
              <div>
                <Label>Date de départ</Label>
                <Input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Capacité</Label>
                <Input
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                />
              </div>
              <Button type="submit" disabled={createSession.isPending}>
                Ajouter
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sessions & départs</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : (sessions ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune session planifiée.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Places</th>
                  <th className="pb-3 pr-4">Remplissage</th>
                  <th className="pb-3 pr-4">Statut</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(sessions ?? []).map((s) => {
                  const remaining = s.remainingSeats ?? s.capacity - s.bookedCount;
                  const fillPct = s.capacity > 0 ? (s.bookedCount / s.capacity) * 100 : 0;
                  const isNaturallyFull = remaining <= 0 || s.status === "full";

                  return (
                    <tr key={s.id} className="border-b border-border/60">
                      <td className="py-3 pr-4 font-medium">{s.sessionDate}</td>
                      <td className="py-3 pr-4">
                        {s.bookedCount}/{s.capacity} ({availabilityLabel(remaining)})
                      </td>
                      <td className="py-3 pr-4">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-secondary">
                          <div
                            className={`h-full ${availabilityColor(remaining, s.capacity)}`}
                            style={{ width: `${fillPct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={
                            isNaturallyFull
                              ? "rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800"
                              : "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                          }
                        >
                          {SESSION_STATUS_LABELS[s.status]}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link
                              to="/admin/destinations/$destinationId/offres/$offerId/sessions/$sessionId"
                              params={{ destinationId, offerId, sessionId: s.id }}
                            >
                              <Users className="mr-1 h-4 w-4" />
                              Participants ({s.bookedCount})
                            </Link>
                          </Button>
                          {canWrite && s.status !== "cancelled" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleFull(s.id, s.status, isNaturallyFull)}
                            >
                              {isNaturallyFull ? "Rouvrir" : "Marquer complète"}
                            </Button>
                          )}
                          {canWrite && s.bookedCount === 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={async () => {
                                try {
                                  await deleteSession.mutateAsync(s.id);
                                  toast.success("Session supprimée");
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
