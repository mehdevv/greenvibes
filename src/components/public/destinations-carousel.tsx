import { Link } from "@tanstack/react-router";
import type { Destination } from "@/api/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { DEFAULT_OFFRES_SEARCH, destinationCoverFallback } from "@/lib/constants";
import { resolveCoverImage } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type DestinationsCarouselProps = {
  destinations: Destination[];
  offerCountByDestination: (destinationId: string) => number;
  className?: string;
};

export function DestinationsCarousel({
  destinations,
  offerCountByDestination,
  className,
}: DestinationsCarouselProps) {
  return (
    <Carousel
      opts={{ align: "start", dragFree: true }}
      className={cn("w-full", className)}
    >
      <CarouselContent className="-ml-4">
        {destinations.map((d) => {
          const circuitCount = offerCountByDestination(d.id);

          return (
            <CarouselItem
              key={d.id}
              className="pl-4 basis-[88%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
            >
              <article className="group relative flex h-[400px] flex-col justify-end overflow-hidden rounded-md shadow-soft ring-1 ring-border/50 transition hover:shadow-elevated md:h-[440px]">
                <img
                  src={resolveCoverImage(d.coverImage, destinationCoverFallback(d.slug))}
                  alt={d.title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/40 to-forest/10" />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-primary-foreground/95 px-3 py-1 text-xs font-medium text-forest shadow-sm">
                    {d.tag}
                  </span>
                  {circuitCount > 0 && (
                    <span className="rounded-[4px] bg-forest/80 px-3 py-1 text-xs font-medium text-primary-foreground backdrop-blur">
                      {circuitCount} circuit{circuitCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="relative z-10 p-6 text-primary-foreground">
                  <h3 className="font-display text-2xl font-light leading-tight text-primary-foreground">
                    {d.title}
                  </h3>
                  {d.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-primary-foreground/85">
                      {d.description}
                    </p>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Link
                      to="/destinations/$slug"
                      params={{ slug: d.slug }}
                      className="flex-1 rounded-[4px] bg-primary-foreground/15 px-4 py-2.5 text-center text-sm font-semibold backdrop-blur transition hover:bg-primary-foreground/25"
                    >
                      Découvrir
                    </Link>
                    {circuitCount > 0 && (
                      <Link
                        to="/offres"
                        search={{ ...DEFAULT_OFFRES_SEARCH, destination: d.slug }}
                        className="flex-1 rounded-[4px] bg-primary-foreground px-4 py-2.5 text-center text-sm font-semibold text-forest transition hover:opacity-95"
                      >
                        Circuits
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            </CarouselItem>
          );
        })}
      </CarouselContent>

      <div className="mt-6 flex items-center justify-end gap-2">
        <CarouselPrevious className="static left-auto top-auto h-10 w-10 translate-x-0 translate-y-0 border-border/60 bg-card/90 shadow-sm hover:bg-card" />
        <CarouselNext className="static right-auto top-auto h-10 w-10 translate-x-0 translate-y-0 border-border/60 bg-card/90 shadow-sm hover:bg-card" />
      </div>
    </Carousel>
  );
}
