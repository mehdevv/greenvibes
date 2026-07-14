import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useListAllTripsAdmin, useCreateTrip, useUpdateTrip } from "@/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/trips")({
  component: AdminTripsPage,
});

function AdminTripsPage() {
  const { canWrite } = useAuth();
  const { data: trips, refetch } = useListAllTripsAdmin();
  const createTrip = useCreateTrip();
  const updateTrip = useUpdateTrip();
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    meetingPoint: "",
    includes: "",
    price: "",
    duration: "",
    capacity: "12",
    active: true,
  });

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      meetingPoint: "",
      includes: "",
      price: "",
      duration: "",
      capacity: "12",
      active: true,
    });
    setEditingId(null);
  };

  const loadTrip = (id: string) => {
    const t = trips?.find((x) => x.id === id);
    if (!t) return;
    setEditingId(id);
    setForm({
      title: t.title,
      description: t.description,
      meetingPoint: t.meetingPoint,
      includes: t.includes.join(", "),
      price: String(t.price),
      duration: t.duration,
      capacity: String(t.capacity),
      active: t.active,
    });
  };

  const handleSave = async () => {
    const payload = {
      title: form.title,
      description: form.description,
      meetingPoint: form.meetingPoint,
      includes: form.includes.split(",").map((s) => s.trim()).filter(Boolean),
      price: Number(form.price),
      duration: form.duration,
      capacity: Number(form.capacity),
      active: form.active,
    };
    try {
      if (editingId) {
        await updateTrip.mutateAsync({ id: editingId, ...payload });
        toast.success("Voyage mis à jour");
      } else {
        await createTrip.mutateAsync(payload);
        toast.success("Voyage créé");
      }
      resetForm();
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Voyages</h1>
        <p className="text-sm text-muted-foreground">Gérer les sorties affichées sur la page d&apos;accueil</p>
      </div>

      {canWrite && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Modifier le voyage" : "Nouveau voyage"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Titre</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div>
              <Label>Prix (DA)</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <Label>Durée</Label>
              <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            </div>
            <div>
              <Label>Capacité</Label>
              <Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </div>
            <div>
              <Label>Point de rendez-vous</Label>
              <Input value={form.meetingPoint} onChange={(e) => setForm({ ...form, meetingPoint: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Inclus (séparés par des virgules)</Label>
              <Input value={form.includes} onChange={(e) => setForm({ ...form, includes: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label>Actif</Label>
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button onClick={handleSave} disabled={createTrip.isPending || updateTrip.isPending}>
                {editingId ? "Enregistrer" : "Créer"}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {(trips ?? []).map((t) => (
          <Card key={t.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <p className="font-semibold">{t.title}</p>
                <p className="text-sm text-muted-foreground">
                  {t.spotsTaken}/{t.capacity} places · {t.duration} · {t.active ? "Actif" : "Inactif"}
                </p>
              </div>
              {canWrite && (
                <Button variant="outline" size="sm" onClick={() => loadTrip(t.id)}>
                  Modifier
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
