import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useListGalleryItems, useCreateGalleryItem, useDeleteGalleryItem } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/admin/image-upload";
import { useAuth } from "@/lib/auth";
import { PLACEHOLDER_IMAGES } from "@/lib/constants";
import { resolveCoverImage } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/galerie")({
  component: AdminGalleryPage,
});

function AdminGalleryPage() {
  const { canWrite } = useAuth();
  const { data: items, isLoading } = useListGalleryItems();
  const createItem = useCreateGalleryItem();
  const deleteItem = useDeleteGalleryItem();
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      toast.error("Téléversez une image avant d'ajouter");
      return;
    }
    try {
      await createItem.mutateAsync({
        title,
        storagePath: imageUrl,
        sortOrder: (items?.length ?? 0) + 1,
      });
      toast.success("Image ajoutée");
      setTitle("");
      setImageUrl("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-foreground">Galerie</h1>

      {canWrite && (
        <Card>
          <CardHeader><CardTitle>Ajouter une image</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Titre</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="md:col-span-2">
                <ImageUpload
                  label="Image"
                  value={imageUrl}
                  onChange={setImageUrl}
                />
              </div>
              <div>
                <Button type="submit" className="" disabled={createItem.isPending || !imageUrl}>
                  Ajouter
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(items ?? []).map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <img
                src={resolveCoverImage(item.storagePath, PLACEHOLDER_IMAGES.hero)}
                alt={item.title}
                className="aspect-[4/3] w-full object-cover"
              />
              <CardContent className="flex items-center justify-between p-4">
                <span className="text-sm font-medium">{item.title}</span>
                {canWrite && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={async () => {
                      try {
                        await deleteItem.mutateAsync(item.id);
                        toast.success("Image supprimée");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Erreur");
                      }
                    }}
                  >
                    Supprimer
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
