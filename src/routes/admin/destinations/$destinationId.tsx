import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useGetDestinationById,
  useListOffersByDestination,
  useDeleteOffer,
} from "@/api";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/constants";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/destinations/$destinationId")({
  component: DestinationHubPage,
});

function DestinationHubPage() {
  const { destinationId } = Route.useParams();
  const { canWrite } = useAuth();
  const { data: destination, isLoading } = useGetDestinationById(destinationId);
  const { data: offers } = useListOffersByDestination(destinationId);
  const deleteOffer = useDeleteOffer();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement...</p>;
  }

  if (!destination) {
    return <p className="text-sm text-destructive">Destination introuvable.</p>;
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs
        items={[
          { label: "Destinations", to: "/admin/destinations" },
          { label: destination.title },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">{destination.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {destination.tag} · {destination.isPublished ? "Publiée" : "Brouillon"}
          </p>
        </div>
        {canWrite && (
          <Button asChild>
            <Link
              to="/admin/offres/nouveau"
              search={{ destinationId }}
            >
              <Plus className="h-4 w-4" /> Nouvelle offre
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {(offers ?? []).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              <Package className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Aucune offre pour cette destination.</p>
              {canWrite && (
                <Button asChild size="sm">
                  <Link to="/admin/offres/nouveau" search={{ destinationId }}>
                    Créer une offre
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          (offers ?? []).map((o) => (
            <Card key={o.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <div className="font-display font-bold text-foreground">{o.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatPrice(o.priceDzd)} DA · {o.durationLabel} ·{" "}
                    {o.isActive ? "Active" : "Inactive"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="default" size="sm">
                    <Link
                      to="/admin/destinations/$destinationId/offres/$offerId"
                      params={{ destinationId, offerId: o.id }}
                    >
                      Sessions & participants
                    </Link>
                  </Button>
                  {canWrite && (
                    <>
                      <Button asChild variant="outline" size="sm">
                        <Link to="/admin/offres/$id" params={{ id: o.id }}>
                          <Pencil className="h-4 w-4" />
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
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
