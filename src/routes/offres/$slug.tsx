import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { PublicLayout } from "@/components/layout/public-layout";
import { useGetOfferBySlug } from "@/api";
import { resolveCoverImage } from "@/lib/supabase";
import {
  PLACEHOLDER_IMAGES,
  DEFAULT_OFFRES_SEARCH,
  FLOATING_NAV_OFFSET,
  formatPrice,
} from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, MapPin, Users, Clock, Tag } from "lucide-react";
import { Reveal } from "@/components/motion";
import { OfferBookingPanel } from "@/components/public/offer-booking-panel";
import { cn } from "@/lib/utils";

const OFFER_TYPE_LABELS: Record<string, string> = {
  mer: "Mer & côte",
  montagne: "Montagne",
  culture: "Culture",
  aventure: "Aventure",
};

export const Route = createFileRoute("/offres/$slug")({
  component: OfferDetailPage,
});

function OfferDetailPage() {
  const { slug } = Route.useParams();
  const { data: offer, isLoading } = useGetOfferBySlug(slug);

  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#reserver") return;
    const timer = window.setTimeout(() => {
      document.getElementById("reserver")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [offer?.id]);

  if (isLoading) {
    return (
      <PublicLayout>
        <Skeleton className={cn("mx-auto h-96 max-w-7xl rounded-md", FLOATING_NAV_OFFSET)} />
      </PublicLayout>
    );
  }

  if (!offer) {
    return (
      <PublicLayout>
        <div className={cn("mx-auto max-w-7xl px-6 pb-24 text-center", FLOATING_NAV_OFFSET)}>
          <h1 className="text-2xl font-bold">Offre introuvable</h1>
          <Link to="/offres" search={DEFAULT_OFFRES_SEARCH} className="mt-4 inline-block text-forest hover:underline">
            Retour aux offres
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="relative h-[40vh] min-h-[280px] overflow-hidden">
        <img
          src={resolveCoverImage(offer.coverImage, PLACEHOLDER_IMAGES.gouraya)}
          alt={offer.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest/85 via-forest/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-7xl px-6 pb-10">
          {offer.destination?.title && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium text-primary-foreground backdrop-blur">
              <MapPin className="h-3 w-3" />
              {offer.destination.title}
            </span>
          )}
          <h1 className="mt-3 font-display text-4xl font-light text-primary-foreground md:text-5xl">
            {offer.title}
          </h1>
          <p className="mt-2 text-primary-foreground/90">{offer.durationLabel}</p>
          <a
            href="#reserver"
            className="mt-5 inline-flex items-center gap-2 rounded-[4px] bg-primary-foreground px-6 py-3 text-sm font-semibold text-forest transition hover:opacity-95"
          >
            Réserver ce circuit
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12">
          <Reveal className="order-2 space-y-8 lg:order-1">
            <section className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Tag, label: "Type", value: OFFER_TYPE_LABELS[offer.offerType] ?? offer.offerType },
                { icon: Clock, label: "Durée", value: offer.durationLabel },
                { icon: Users, label: "Groupe", value: "Selon le départ" },
                {
                  icon: Check,
                  label: "Tarif",
                  value: `${formatPrice(offer.priceDzd)} DA / personne`,
                },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 rounded-md border border-border bg-card p-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mint text-forest">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-forest">{value}</p>
                  </div>
                </div>
              ))}
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-forest">À propos de ce circuit</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{offer.description}</p>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold text-forest">Ce qui est inclus</h2>
              <ul className="mt-4 space-y-3">
                {offer.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint text-forest">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </section>

            {offer.destination?.description && (
              <section className="rounded-md border border-border bg-secondary/40 p-6">
                <h2 className="font-display text-lg font-bold text-forest">
                  Destination — {offer.destination.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {offer.destination.description}
                </p>
              </section>
            )}

            <section className="rounded-md border border-dashed border-leaf/40 bg-mint/10 p-6">
              <h2 className="font-display text-lg font-bold text-forest">Comment réserver</h2>
              <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-bold text-primary-foreground">
                    1
                  </span>
                  Choisissez une date disponible et le nombre de participants dans le panneau à droite.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-bold text-primary-foreground">
                    2
                  </span>
                  Renseignez vos coordonnées et toute demande particulière (régime, accessibilité…).
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-bold text-primary-foreground">
                    3
                  </span>
                  Vérifiez le récapitulatif et confirmez — vous recevrez une référence unique par email.
                </li>
              </ol>
            </section>
          </Reveal>

          <Reveal variant="fadeLeft" delay={0.08} className="order-1 lg:order-2">
            <OfferBookingPanel offer={offer} />
          </Reveal>
        </div>
      </div>
    </PublicLayout>
  );
}
