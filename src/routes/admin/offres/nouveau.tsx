import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCreateOffer, useListAllDestinations } from "@/api";
import type { OfferType } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/admin/image-upload";
import { DestinationSelect } from "@/components/admin/destination-select";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/offres/nouveau")({
  validateSearch: (search: Record<string, unknown>) => ({
    destinationId: typeof search.destinationId === "string" ? search.destinationId : undefined,
  }),
  component: NewOfferPage,
});

function NewOfferPage() {
  const navigate = useNavigate();
  const { destinationId: presetDestinationId } = Route.useSearch();
  const createOffer = useCreateOffer();
  const { data: destinations, isLoading: destinationsLoading } = useListAllDestinations();
  const [form, setForm] = useState({
    slug: "",
    title: "",
    description: "",
    priceDzd: 3500,
    durationLabel: "Journée",
    offerType: "mer" as OfferType,
    destinationId: presetDestinationId ?? "",
    features: "Guide francophone\nTransport A/R",
    coverImage: "",
    isActive: true,
    isFeatured: false,
    sortOrder: 0,
  });

  useEffect(() => {
    if (presetDestinationId) {
      setForm((f) => ({ ...f, destinationId: presetDestinationId }));
    }
  }, [presetDestinationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const offer = await createOffer.mutateAsync({
        slug: form.slug,
        title: form.title,
        description: form.description,
        priceDzd: form.priceDzd,
        durationLabel: form.durationLabel,
        offerType: form.offerType,
        destinationId: form.destinationId || null,
        features: form.features.split("\n").map((f) => f.trim()).filter(Boolean),
        coverImage: form.coverImage || null,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        sortOrder: form.sortOrder,
      });
      toast.success("Offre créée");
      if (form.destinationId) {
        navigate({
          to: "/admin/destinations/$destinationId/offres/$offerId",
          params: { destinationId: form.destinationId, offerId: offer.id },
        });
      } else {
        navigate({ to: "/admin/offres/$id", params: { id: offer.id } });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-foreground">Nouvelle offre</h1>
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Titre</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <Label>Slug (URL)</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
            </div>
            <div>
              <Label>Prix (DA)</Label>
              <Input type="number" value={form.priceDzd} onChange={(e) => setForm({ ...form, priceDzd: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Durée</Label>
              <Input value={form.durationLabel} onChange={(e) => setForm({ ...form, durationLabel: e.target.value })} />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.offerType} onValueChange={(v) => setForm({ ...form, offerType: v as OfferType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                destinations={destinations ?? []}
                disabled={destinationsLoading}
              />
            </div>
            <div className="md:col-span-2">
              <ImageUpload
                label="Image de couverture"
                value={form.coverImage}
                onChange={(coverImage) => setForm({ ...form, coverImage })}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Inclus (une ligne par élément)</Label>
              <Textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} rows={4} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <Label>Active (visible sur le site)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm({ ...form, isFeatured: v })} />
              <Label>Mise en avant</Label>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="" disabled={createOffer.isPending}>
                Créer l&apos;offre
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
