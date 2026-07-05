import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  useGetOfferById,
  useUpdateOffer,
  useListAllDestinations,
} from "@/api";
import type { Destination, Offer, OfferType } from "@/api/types";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageUpload } from "@/components/admin/image-upload";
import { DestinationSelect } from "@/components/admin/destination-select";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/offres/$id")({
  component: EditOfferPage,
});

function buildFormState(offer: Offer) {
  return {
    slug: offer.slug,
    title: offer.title,
    description: offer.description,
    priceDzd: offer.priceDzd,
    durationLabel: offer.durationLabel,
    offerType: offer.offerType || "mer",
    destinationId: offer.destinationId ?? "",
    features: offer.features.join("\n"),
    coverImage: offer.coverImage ?? "",
    isActive: offer.isActive,
    isFeatured: offer.isFeatured,
    sortOrder: offer.sortOrder,
  };
}

function EditOfferPage() {
  const { id } = Route.useParams();
  const { data: offer, isLoading: offerLoading } = useGetOfferById(id);
  const { data: destinations, isLoading: destinationsLoading } = useListAllDestinations();

  if (offerLoading || destinationsLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!offer) {
    return <p>Offre introuvable</p>;
  }

  return (
    <OfferEditForm
      key={offer.id}
      id={id}
      offer={offer}
      destinations={destinations ?? []}
    />
  );
}

function OfferEditForm({
  id,
  offer,
  destinations,
}: {
  id: string;
  offer: Offer;
  destinations: Destination[];
}) {
  const { canWrite } = useAuth();
  const updateOffer = useUpdateOffer();
  const [form, setForm] = useState(() => buildFormState(offer));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) {
      toast.error("Compte en lecture seule — modification impossible");
      return;
    }
    try {
      const updated = await updateOffer.mutateAsync({
        id,
        slug: form.slug,
        title: form.title,
        description: form.description,
        priceDzd: form.priceDzd,
        durationLabel: form.durationLabel,
        offerType: form.offerType,
        destinationId: form.destinationId || null,
        features: form.features
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean),
        coverImage: form.coverImage || null,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        sortOrder: form.sortOrder,
      });
      setForm(buildFormState(updated));
      toast.success("Offre mise à jour");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-foreground">Modifier l&apos;offre</h1>
      <Card>
        <CardHeader>
          <CardTitle>{offer.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Titre</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label>Prix (DA)</Label>
              <Input
                type="number"
                value={form.priceDzd}
                onChange={(e) => setForm({ ...form, priceDzd: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Durée</Label>
              <Input
                value={form.durationLabel}
                onChange={(e) => setForm({ ...form, durationLabel: e.target.value })}
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={form.offerType || "mer"}
                onValueChange={(v) => setForm({ ...form, offerType: v as OfferType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mer">Mer</SelectItem>
                  <SelectItem value="montagne">Montagne</SelectItem>
                  <SelectItem value="culture">Culture</SelectItem>
                  <SelectItem value="aventure">Aventure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Destination</Label>
              <DestinationSelect
                value={form.destinationId}
                onChange={(destinationId) => setForm({ ...form, destinationId })}
                destinations={destinations}
                linkedDestination={offer.destination}
                disabled={!canWrite}
              />
            </div>
            <div className="md:col-span-2">
              <ImageUpload
                label="Image de couverture"
                value={form.coverImage}
                onChange={(coverImage) => setForm({ ...form, coverImage })}
                disabled={!canWrite}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Inclus</Label>
              <Textarea
                value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
                rows={4}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
              <Label>Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isFeatured}
                onCheckedChange={(v) => setForm({ ...form, isFeatured: v })}
              />
              <Label>Mise en avant</Label>
            </div>
            <div className="md:col-span-2">
              <Button
                type="submit"
                className=""
                disabled={updateOffer.isPending || !canWrite}
              >
                Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
