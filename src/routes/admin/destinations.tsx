import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  useListAllDestinations,
  useCreateDestination,
  useUpdateDestination,
  useDeleteDestination,
} from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/admin/image-upload";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/destinations")({
  component: AdminDestinationsPage,
});

function AdminDestinationsPage() {
  const { canWrite } = useAuth();
  const { data: destinations, isLoading } = useListAllDestinations();
  const createDestination = useCreateDestination();
  const updateDestination = useUpdateDestination();
  const deleteDestination = useDeleteDestination();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    tag: "",
    description: "",
    coverImage: "",
    isPublished: true,
    sortOrder: 0,
  });

  const resetForm = () => {
    setForm({ slug: "", title: "", tag: "", description: "", coverImage: "", isPublished: true, sortOrder: 0 });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDestination.mutateAsync({ id: editingId, ...form, latitude: null, longitude: null });
        toast.success("Destination mise à jour");
      } else {
        await createDestination.mutateAsync({ ...form, latitude: null, longitude: null });
        toast.success("Destination créée");
      }
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-foreground">Destinations</h1>
        {canWrite && (
          <Button className="" onClick={() => { setShowForm(true); setEditingId(null); }}>
            Nouvelle destination
          </Button>
        )}
      </div>

      {(showForm || editingId) && canWrite && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Modifier" : "Nouvelle destination"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Titre</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
              </div>
              <div>
                <Label>Tag</Label>
                <Input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <ImageUpload
                  label="Image de couverture"
                  value={form.coverImage}
                  onChange={(coverImage) => setForm({ ...form, coverImage })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isPublished} onCheckedChange={(v) => setForm({ ...form, isPublished: v })} />
                <Label>Publiée</Label>
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" className="">
                  {editingId ? "Enregistrer" : "Créer"}
                </Button>
                <Button type="button" variant="ghost" onClick={resetForm}>Annuler</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : (
        <div className="grid gap-4">
          {(destinations ?? []).map((d) => (
            <Card key={d.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <div className="font-display font-bold text-foreground">{d.title}</div>
                  <div className="text-sm text-muted-foreground">
                    /{d.slug} · {d.tag} · {d.isPublished ? "Publiée" : "Brouillon"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="default" size="sm">
                    <Link
                      to="/admin/destinations/$destinationId"
                      params={{ destinationId: d.id }}
                    >
                      Offres & sessions
                    </Link>
                  </Button>
                  {canWrite && (
                    <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingId(d.id);
                        setShowForm(true);
                        setForm({
                          slug: d.slug,
                          title: d.title,
                          tag: d.tag,
                          description: d.description,
                          coverImage: d.coverImage ?? "",
                          isPublished: d.isPublished,
                          sortOrder: d.sortOrder,
                        });
                      }}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={async () => {
                        if (!confirm("Supprimer cette destination ?")) return;
                        try {
                          await deleteDestination.mutateAsync(d.id);
                          toast.success("Destination supprimée");
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Erreur");
                        }
                      }}
                    >
                      Supprimer
                    </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
