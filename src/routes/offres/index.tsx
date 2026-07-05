import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/public-layout";
import { useListPublishedOffers, useListPublishedDestinations } from "@/api";
import { resolveCoverImage } from "@/lib/supabase";
import { PLACEHOLDER_IMAGES, formatPrice, DEFAULT_OFFRES_SEARCH } from "@/lib/constants";
import {
  parseOffresSearch,
  filterAndSortOffers,
  describeActiveFilters,
  countActiveFilters,
} from "@/lib/offres-search";
import { OffersFiltersPanel } from "@/components/public/offers-filters-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import { PageIntro } from "@/components/public/page-intro";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";

export const Route = createFileRoute("/offres/")({
  component: OffersPage,
  validateSearch: (search: Record<string, unknown>) => parseOffresSearch(search),
});

function OffersPage() {
  const search = Route.useSearch();
  const { data: offers, isLoading } = useListPublishedOffers();
  const { data: destinations } = useListPublishedDestinations();

  const filtered = filterAndSortOffers(offers ?? [], search);
  const activeDestination = destinations?.find((d) => d.slug === search.destination);
  const activeFilterLabels = describeActiveFilters(search, activeDestination?.title);
  const activeCount = countActiveFilters(search);

  return (
    <PublicLayout>
      <PageIntro
        title="Nos offres"
        description={
          activeFilterLabels.length > 0
            ? `Circuits filtrés : ${activeFilterLabels.join(" · ")}.`
            : "Parcourez nos circuits et séjours. Affinez avec les filtres pour trouver le départ idéal."
        }
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(260px,300px)_1fr] lg:items-start">
        <Reveal>
          <OffersFiltersPanel search={search} layout="sidebar" />
        </Reveal>

        <div>
          <Reveal delay={0.05}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                {isLoading ? (
                  "Chargement..."
                ) : (
                  <>
                    <span className="font-semibold text-foreground">{filtered.length}</span> circuit
                    {filtered.length !== 1 ? "s" : ""} trouvé{filtered.length !== 1 ? "s" : ""}
                    {activeCount > 0 && ` · ${activeCount} filtre${activeCount > 1 ? "s" : ""} actif${activeCount > 1 ? "s" : ""}`}
                  </>
                )}
              </span>
            </div>
          </Reveal>

          {isLoading ? (
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-96 rounded-md" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-secondary/50 p-10 text-center">
              <p className="font-display text-lg font-bold text-foreground">Aucune offre pour ces filtres</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Élargissez le budget, changez la durée ou réinitialisez les filtres.
              </p>
              <Link
                to="/offres"
                search={DEFAULT_OFFRES_SEARCH}
                className="mt-4 inline-flex items-center gap-2 rounded-[4px] bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Voir toutes les offres
              </Link>
            </div>
          ) : (
            <Stagger className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {filtered.map((o) => (
                <StaggerItem key={o.id}>
                  <div
                    className={`flex h-full flex-col overflow-hidden rounded-md border transition ${
                      o.isFeatured
                        ? "border-transparent bg-primary text-primary-foreground shadow-elevated"
                        : "border-border bg-card hover:shadow-soft"
                    }`}
                  >
                    <img
                      src={resolveCoverImage(o.coverImage, PLACEHOLDER_IMAGES.gouraya)}
                      alt={o.title}
                      className="aspect-video w-full object-cover"
                    />
                    <div className="flex flex-1 flex-col p-6">
                      {o.destination?.title && (
                        <span
                          className={`text-xs font-semibold uppercase tracking-wider ${o.isFeatured ? "text-primary-foreground/80" : "text-primary"}`}
                        >
                          {o.destination.title}
                        </span>
                      )}
                      <h2 className="mt-1 font-display text-xl font-bold">{o.title}</h2>
                      <p
                        className={`mt-2 flex-1 line-clamp-3 text-sm ${o.isFeatured ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                      >
                        {o.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium capitalize opacity-80">
                        <span>{o.durationLabel}</span>
                        <span>·</span>
                        <span>{o.offerType}</span>
                      </div>
                      <div className="mt-4 font-display text-2xl font-light">
                        {formatPrice(o.priceDzd)}{" "}
                        <span className="text-sm font-normal">DA / pers.</span>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Link
                          to="/offres/$slug"
                          params={{ slug: o.slug }}
                          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-[4px] px-5 py-3 text-sm font-semibold ${
                            o.isFeatured
                              ? "bg-primary-foreground/15 text-primary-foreground"
                              : "border border-border"
                          }`}
                        >
                          Détails
                        </Link>
                        <Link
                          to="/offres/$slug"
                          params={{ slug: o.slug }}
                          hash="reserver"
                          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-[4px] px-5 py-3 text-sm font-semibold ${
                            o.isFeatured
                              ? "bg-primary-foreground text-foreground"
                              : "bg-primary text-primary-foreground"
                          }`}
                        >
                          Réserver <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
