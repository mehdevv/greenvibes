import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PublicLayout } from "@/components/layout/public-layout";
import { useListPublishedDestinations, useListPublishedOffers } from "@/api";
import { resolveCoverImage } from "@/lib/supabase";
import { PLACEHOLDER_IMAGES, DEFAULT_OFFRES_SEARCH, destinationCoverFallback } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, MapPin } from "lucide-react";
import { PageIntro } from "@/components/public/page-intro";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/destinations/")({
  component: DestinationsPage,
});

function DestinationsPage() {
  const { data: destinations, isLoading } = useListPublishedDestinations();
  const { data: offers } = useListPublishedOffers();
  const [filter, setFilter] = useState("all");

  const tags = ["all", ...new Set((destinations ?? []).map((d) => d.tag))];
  const filtered =
    filter === "all" ? destinations : destinations?.filter((d) => d.tag === filter);

  const offerCount = (destinationId: string) =>
    (offers ?? []).filter((o) => o.destinationId === destinationId).length;

  return (
    <PublicLayout>
      <PageIntro
        title="Destinations"
        description="Explorez nos destinations à travers l'Algérie — de la mer aux montagnes, du nord au sud."
      >
        <Reveal delay={0.1}>
          <div className="mt-8 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setFilter(tag)}
                className={cn(
                  "rounded-[4px] px-4 py-2 text-sm font-medium transition",
                  filter === tag
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-secondary",
                )}
              >
                {tag === "all" ? "Toutes" : tag}
              </button>
            ))}
          </div>
        </Reveal>

        {isLoading ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-md" />
            ))}
          </div>
        ) : (
          <Stagger className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(filtered ?? []).map((d) => {
              const circuits = offerCount(d.id);
              return (
              <StaggerItem key={d.id}>
                <article className="group flex h-full flex-col overflow-hidden rounded-md border border-border bg-card shadow-soft transition hover:shadow-elevated">
                  <Link
                    to="/destinations/$slug"
                    params={{ slug: d.slug }}
                    className="block overflow-hidden"
                  >
                    <img
                      src={resolveCoverImage(d.coverImage, destinationCoverFallback(d.slug))}
                      alt={d.title}
                      className="aspect-[4/3] w-full object-cover transition group-hover:scale-105"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">{d.tag}</span>
                      {circuits > 0 && (
                        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                          {circuits} circuit{circuits > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <Link to="/destinations/$slug" params={{ slug: d.slug }}>
                      <h2 className="mt-2 font-display text-xl font-bold text-foreground transition group-hover:text-primary">
                        {d.title}
                      </h2>
                    </Link>
                    <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">{d.description}</p>
                    <div className="mt-4 flex gap-2">
                      <Link
                        to="/destinations/$slug"
                        params={{ slug: d.slug }}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-[4px] border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary"
                      >
                        <MapPin className="h-3.5 w-3.5" /> Découvrir
                      </Link>
                      {circuits > 0 && (
                        <Link
                          to="/offres"
                          search={{ ...DEFAULT_OFFRES_SEARCH, destination: d.slug }}
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-[4px] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
                        >
                          Circuits <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </PageIntro>
    </PublicLayout>
  );
}
