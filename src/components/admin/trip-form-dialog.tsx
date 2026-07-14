import { useEffect, useState } from "react";
import type { Trip } from "@/api/types";
import { useCreateTrip, useGetTrip, useUpdateTrip } from "@/api";
import { ImageUpload } from "@/components/admin/image-upload";
import { TripMediaUpload } from "@/components/admin/trip-media-upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type TripFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip?: Trip | null;
};

const emptyForm = {
  title: "",
  description: "",
  meetingPoint: "",
  includes: "",
  price: "",
  duration: "",
  capacity: "12",
  departureDate: "",
  photoUrl: "",
  active: true,
};

export function TripFormDialog({ open, onOpenChange, trip }: TripFormDialogProps) {
  const createTrip = useCreateTrip();
  const updateTrip = useUpdateTrip();
  const [form, setForm] = useState(emptyForm);
  const [savedTripId, setSavedTripId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (trip) {
      setSavedTripId(trip.id);
      setForm({
        title: trip.title,
        description: trip.description,
        meetingPoint: trip.meetingPoint,
        includes: trip.includes.join(", "),
        price: String(trip.price),
        duration: trip.duration,
        capacity: String(trip.capacity),
        departureDate: trip.departureDate ?? "",
        photoUrl: trip.photoUrl ?? "",
        active: trip.active && !trip.archived,
      });
    } else {
      setSavedTripId(null);
      setForm(emptyForm);
    }
  }, [open, trip]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Le titre est requis.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description,
      meetingPoint: form.meetingPoint,
      includes: form.includes.split(",").map((s) => s.trim()).filter(Boolean),
      price: Number(form.price) || 0,
      duration: form.duration,
      capacity: Math.max(1, Number(form.capacity) || 1),
      departureDate: form.departureDate || null,
      photoUrl: form.photoUrl || null,
      active: form.active,
    };

    try {
      if (trip) {
        await updateTrip.mutateAsync({ id: trip.id, ...payload });
        toast.success("Offre mise à jour");
      } else {
        const created = await createTrip.mutateAsync(payload);
        setSavedTripId(created.id);
        toast.success("Offre créée — vous pouvez ajouter des photos/vidéos");
        return;
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const pending = createTrip.isPending || updateTrip.isPending;
  const mediaTripId = trip?.id ?? savedTripId ?? "";
  const { data: liveTrip } = useGetTrip(mediaTripId);
  const currentMedia = liveTrip?.media ?? trip?.media ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{trip ? "Modifier l'offre" : "Nouvelle offre"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div>
            <Label htmlFor="trip-title">Titre *</Label>
            <Input
              id="trip-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex. Randonnée Gouraya"
            />
          </div>
          <div>
            <Label htmlFor="trip-desc">Description</Label>
            <Textarea
              id="trip-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="trip-price">Prix (DA)</Label>
              <Input
                id="trip-price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="trip-duration">Durée</Label>
              <Input
                id="trip-duration"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="Journée / 2 jours"
              />
            </div>
            <div>
              <Label htmlFor="trip-capacity">Places</Label>
              <Input
                id="trip-capacity"
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="trip-departure">Date de départ</Label>
              <Input
                id="trip-departure"
                type="date"
                value={form.departureDate}
                onChange={(e) => setForm({ ...form, departureDate: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="trip-meeting">Point de rendez-vous</Label>
              <Input
                id="trip-meeting"
                value={form.meetingPoint}
                onChange={(e) => setForm({ ...form, meetingPoint: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="trip-includes">Inclus (virgules)</Label>
            <Input
              id="trip-includes"
              value={form.includes}
              onChange={(e) => setForm({ ...form, includes: e.target.value })}
              placeholder="Transport, guide, déjeuner"
            />
          </div>

          <ImageUpload
            label="Image de couverture"
            value={form.photoUrl}
            onChange={(url) => setForm({ ...form, photoUrl: url })}
          />

          {mediaTripId && (
            <TripMediaUpload tripId={mediaTripId} media={currentMedia} />
          )}

          <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 px-4 py-3">
            <Switch
              id="trip-active"
              checked={form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
            />
            <Label htmlFor="trip-active" className="cursor-pointer">
              Visible sur le site public
            </Label>
          </div>
          {trip?.archived && (
            <p className="text-xs text-amber-700">
              Cette offre est archivée (date de départ dépassée). Réactivez-la en modifiant la date ou
              le statut.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {savedTripId && !trip ? "Fermer" : "Annuler"}
          </Button>
          <Button onClick={handleSave} disabled={pending}>
            {pending ? "Enregistrement…" : trip ? "Enregistrer" : savedTripId ? "Mettre à jour" : "Créer l'offre"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
