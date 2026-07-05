import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/public-layout";
import { useGetDestinationBySlug, useListPublishedOffers } from "@/api";
import { resolveCoverImage } from "@/lib/supabase";
import { PLACEHOLDER_IMAGES, formatPriceLabel, FLOATING_NAV_OFFSET, destinationCoverFallback } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, MapPin } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/destinations/$slug")({
  component: DestinationDetailPage,
});

function DestinationDetailPage() {
  const { slug } = Route.useParams();
  const { data: destination, isLoading } = useGetDestinationBySlug(slug);
  const { data: offers } = useListPublishedOffers();

  const relatedOffers = (offers ?? []).filter((o) => o.destinationId === destination?.id);

  if (isLoading) {
    return (
      <PublicLayout>
        <Skeleton className={cn("mx-auto h-96 max-w-7xl rounded-md", FLOATING_NAV_OFFSET)} />
      </PublicLayout>
    );
  }

  if (!destination) {
    return (
      <PublicLayout>
        <div className={cn("mx-auto max-w-7xl px-6 pb-24 text-center", FLOATING_NAV_OFFSET)}>
          <h1 className="text-2xl font-bold">Destination introuvable</h1>
          <Link to="/destinations" className="mt-4 inline-block text-foreground hover:underline">
            Retour aux destinations
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const mapUrl =
    destination.latitude && destination.longitude
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${destination.longitude - 0.05}%2C${destination.latitude - 0.05}%2C${destination.longitude + 0.05}%2C${destination.latitude + 0.05}&layer=mapnik&marker=${destination.latitude}%2C${destination.longitude}`
      : null;

  return (
    <PublicLayout>
      <div className="relative h-[50vh] min-h-[320px] overflow-hidden">
        <img
          src={resolveCoverImage(destination.coverImage, destinationCoverFallback(destination.slug))}
          alt={destination.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-inverse/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-7xl px-6 pb-10">
          <span className="rounded-full bg-primary-foreground/20 px-3 py-1 text-xs font-semibold text-primary-foreground backdrop-blur">
            {destination.tag}
          </span>
          <h1 className="mt-3 font-display text-4xl font-light text-primary-foreground md:text-5xl">
            {destination.title}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-3">
          <Reveal className="space-y-8 lg:col-span-2">
            <section>
              <h2 className="font-display text-2xl font-bold text-foreground">À propos</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">{destination.description}</p>
            </section>

            {mapUrl && (
              <section>
                <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Localisation
                </h2>
                <iframe
                  title="Carte"
                  src={mapUrl}
                  className="mt-4 h-64 w-full rounded-md border border-border"
                />
              </section>
            )}
          </Reveal>

          <Reveal variant="fadeLeft" delay={0.1}>
          <aside>
            <h2 className="font-display text-xl font-bold text-foreground">Offres liées</h2>
            <Stagger className="mt-4 space-y-4">
              {relatedOffers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune offre pour le moment.</p>
              ) : (
                relatedOffers.map((o) => (
                  <StaggerItem key={o.id}>
                  <Link
                    to="/offres/$slug"
                    params={{ slug: o.slug }}
                    hash="reserver"
                    className="block rounded-md border border-border bg-card p-4 transition hover:shadow-soft"
                  >
                    <div className="font-semibold text-foreground">{o.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {formatPriceLabel(o.priceDzd)} · {o.durationLabel}
                    </div>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Réserver <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                  </StaggerItem>
                ))
              )}
            </Stagger>
          </aside>
          </Reveal>
        </div>
      </div>
    </PublicLayout>
  );
}
