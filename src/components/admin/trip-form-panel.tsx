import { useEffect, useState } from "react";
import type { Trip } from "@/api/types";
import { useCreateTrip, useGetTrip, useUpdateTrip } from "@/api";
import { ImageUpload } from "@/components/admin/image-upload";
import { TripMediaUpload } from "@/components/admin/trip-media-upload";
import { TripShareLink } from "@/components/admin/trip-share-link";
import { TripSlugField } from "@/components/admin/trip-slug-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { slugifyTripTitle, validateTripSlug } from "@/lib/trip-slug";
import { cn } from "@/lib/utils";
import { Calendar, ImageIcon, MapPin, Settings2, Tag } from "lucide-react";
import { toast } from "sonner";

const emptyForm = {
  title: "",
  slug: "",
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

type TripFormPanelProps = {
  trip?: Trip | null;
  onCreated?: (trip: Trip) => void;
  onSaved?: () => void;
  compact?: boolean;
};

function FormSection({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "space-y-4 rounded-xl border border-border bg-card p-4 md:p-5",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <Icon className="h-4 w-4 text-forest" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export function TripFormPanel({ trip, onCreated, onSaved, compact }: TripFormPanelProps) {
  const createTrip = useCreateTrip();
  const updateTrip = useUpdateTrip();
  const [form, setForm] = useState(emptyForm);
  const [savedTripId, setSavedTripId] = useState<string | null>(trip?.id ?? null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    if (trip) {
      setSavedTripId(trip.id);
      setSlugManuallyEdited(Boolean(trip.slug));
      setForm({
        title: trip.title,
        slug: trip.slug ?? slugifyTripTitle(trip.title),
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
      setSlugManuallyEdited(false);
      setForm(emptyForm);
    }
  }, [trip]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Le titre est requis.");
      return;
    }

    const slugError = validateTripSlug(form.slug || slugifyTripTitle(form.title));
    if (slugError) {
      toast.error(slugError);
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
      slug: form.slug.trim() || null,
    };

    try {
      if (trip) {
        await updateTrip.mutateAsync({ id: trip.id, ...payload });
        toast.success("Offre mise à jour");
        onSaved?.();
      } else {
        const created = await createTrip.mutateAsync(payload);
        setSavedTripId(created.id);
        setSlugManuallyEdited(true);
        toast.success("Offre créée — vous pouvez ajouter des photos/vidéos");
        onCreated?.(created);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const pending = createTrip.isPending || updateTrip.isPending;
  const mediaTripId = trip?.id ?? savedTripId ?? "";
  const { data: liveTrip } = useGetTrip(mediaTripId);
  const currentMedia = liveTrip?.media ?? trip?.media ?? [];
  const currentTrip = liveTrip ?? trip;
  const shareTrip = currentTrip ?? (savedTripId ? { id: savedTripId, slug: form.slug || null, title: form.title } : null);

  return (
    <div className="grid gap-5">
      <FormSection title="Informations générales" icon={Tag}>
        <div>
          <Label htmlFor="trip-title">Titre *</Label>
          <Input
            id="trip-title"
            value={form.title}
            onChange={(e) => {
              const title = e.target.value;
              setForm((prev) => ({
                ...prev,
                title,
                slug: slugManuallyEdited ? prev.slug : slugifyTripTitle(title),
              }));
            }}
            placeholder="Ex. Randonnée Gouraya"
            className="mt-1.5"
          />
        </div>

        <TripSlugField
          value={form.slug}
          onChange={(slug) => {
            setSlugManuallyEdited(true);
            setForm((prev) => ({ ...prev, slug }));
          }}
          title={form.title}
          tripId={savedTripId}
        />

        <div>
          <Label htmlFor="trip-desc">Description</Label>
          <Textarea
            id="trip-desc"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={compact ? 3 : 4}
            placeholder="Décrivez l'expérience, le programme, ce qui rend cette sortie unique…"
            className="mt-1.5"
          />
        </div>
      </FormSection>

      <FormSection title="Détails & tarifs" icon={Calendar}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="trip-price">Prix (DA)</Label>
            <Input
              id="trip-price"
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="3500"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="trip-duration">Durée</Label>
            <Input
              id="trip-duration"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              placeholder="Journée, 2 jours, Demi-journée…"
              className="mt-1.5"
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
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="trip-departure">Date de départ</Label>
            <Input
              id="trip-departure"
              type="date"
              value={form.departureDate}
              onChange={(e) => setForm({ ...form, departureDate: e.target.value })}
              className="mt-1.5"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="trip-meeting" className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Point de rendez-vous
          </Label>
          <Input
            id="trip-meeting"
            value={form.meetingPoint}
            onChange={(e) => setForm({ ...form, meetingPoint: e.target.value })}
            placeholder="Ex. Front de mer, Béjaïa"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="trip-includes">Inclus (séparés par des virgules)</Label>
          <Input
            id="trip-includes"
            value={form.includes}
            onChange={(e) => setForm({ ...form, includes: e.target.value })}
            placeholder="Transport, guide, déjeuner"
            className="mt-1.5"
          />
        </div>
      </FormSection>

      <FormSection title="Médias" icon={ImageIcon}>
        <ImageUpload
          label="Image de couverture"
          value={form.photoUrl}
          onChange={(url) => setForm({ ...form, photoUrl: url })}
        />
        {mediaTripId ? (
          <TripMediaUpload tripId={mediaTripId} media={currentMedia} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Enregistrez l&apos;offre une première fois pour ajouter des photos et vidéos supplémentaires.
          </p>
        )}
      </FormSection>

      <FormSection title="Publication" icon={Settings2}>
        <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-secondary/20 px-4 py-3">
          <Switch
            id="trip-active"
            checked={form.active}
            onCheckedChange={(v) => setForm({ ...form, active: v })}
          />
          <div>
            <Label htmlFor="trip-active" className="cursor-pointer font-medium">
              Visible sur le site public
            </Label>
            <p className="text-xs text-muted-foreground">
              Désactivez pour masquer l&apos;offre sans la supprimer.
            </p>
          </div>
        </div>
        {trip?.archived && (
          <p className="text-sm text-amber-700">
            Cette offre est archivée (date de départ dépassée). Réactivez-la en modifiant la date ou le statut.
          </p>
        )}
      </FormSection>

      {shareTrip && (
        <TripShareLink trip={shareTrip} />
      )}

      <Button onClick={handleSave} disabled={pending} className="w-full sm:w-auto">
        {pending ? "Enregistrement…" : trip ? "Enregistrer les modifications" : "Créer l'offre"}
      </Button>
    </div>
  );
}
