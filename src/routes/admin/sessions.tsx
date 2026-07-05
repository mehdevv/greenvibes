import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  useListAllSessions,
  useListAllOffers,
  useCreateSession,
  useDeleteSession,
} from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { availabilityColor, availabilityLabel } from "@/lib/constants";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/sessions")({
  component: AdminSessionsPage,
});

function AdminSessionsPage() {
  const { canWrite } = useAuth();
  const { data: sessions, isLoading } = useListAllSessions();
  const { data: offers } = useListAllOffers();
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();
  const [offerId, setOfferId] = useState("");
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

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-foreground">Sessions & disponibilités</h1>

      {canWrite && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ajouter une session</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
              <div>
                <Label>Offre</Label>
                <Select value={offerId} onValueChange={setOfferId}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(offers ?? []).map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} required />
              </div>
              <div>
                <Label>Capacité</Label>
                <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
              </div>
              <Button type="submit" className="" disabled={!offerId || createSession.isPending}>
                Ajouter
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Calendrier des départs</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Offre</th>
                  <th className="pb-3 pr-4">Places</th>
                  <th className="pb-3 pr-4">Remplissage</th>
                  <th className="pb-3 pr-4">Statut</th>
                  {canWrite && <th className="pb-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {(sessions ?? []).map((s) => {
                  const remaining = s.remainingSeats ?? s.capacity - s.bookedCount;
                  const fillPct = s.capacity > 0 ? (s.bookedCount / s.capacity) * 100 : 0;
                  return (
                    <tr key={s.id} className="border-b border-border/60">
                      <td className="py-3 pr-4 font-medium">{s.sessionDate}</td>
                      <td className="py-3 pr-4">{s.offer?.title ?? "—"}</td>
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
                      <td className="py-3 pr-4">{s.status}</td>
                      {canWrite && (
                        <td className="py-3">
                          {s.bookedCount === 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
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
                        </td>
                      )}
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
