import { createFileRoute, Link } from "@tanstack/react-router";
import { useListAllOffers, useDeleteOffer } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/constants";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/offres/")({
  component: AdminOffersPage,
});

function AdminOffersPage() {
  const { canWrite } = useAuth();
  const { data: offers, isLoading } = useListAllOffers();
  const deleteOffer = useDeleteOffer();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-foreground">Offres</h1>
        {canWrite && (
          <Button asChild className="">
            <Link to="/admin/offres/nouveau">
              <Plus className="h-4 w-4" /> Nouvelle offre
            </Link>
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : (
        <div className="grid gap-4">
          {(offers ?? []).map((o) => (
            <Card key={o.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <div className="font-display font-bold text-foreground">{o.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatPrice(o.priceDzd)} DA · {o.durationLabel} · {o.isActive ? "Active" : "Inactive"}
                  </div>
                </div>
                {canWrite && (
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to="/admin/offres/$id" params={{ id: o.id }}>
                        <Pencil className="h-4 w-4" /> Modifier
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={async () => {
                        if (!confirm("Supprimer cette offre ?")) return;
                        try {
                          await deleteOffer.mutateAsync(o.id);
                          toast.success("Offre supprimée");
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Erreur");
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
