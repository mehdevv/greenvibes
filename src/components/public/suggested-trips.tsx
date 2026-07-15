import { useEffect, useMemo } from "react";
import { useListTrips } from "@/api";
import { TripCardV2 } from "@/components/public/trip-card-v2";
import {
  HeroContainer,
  HeroTitle,
  HorizontalScroll,
  HorizontalScrollItem,
} from "@/components/public/hero-ui";
import { preloadImages } from "@/lib/preload-images";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";

type SuggestedTripsProps = {
  excludeTripId: string;
};

export function SuggestedTrips({ excludeTripId }: SuggestedTripsProps) {
  const { data: trips, isLoading } = useListTrips();

  const suggestions = useMemo(
    () => (trips ?? []).filter((trip) => trip.id !== excludeTripId),
    [trips, excludeTripId],
  );

  useEffect(() => {
    if (!suggestions.length) return;
    preloadImages(suggestions.map((trip) => trip.photoUrl));
  }, [suggestions]);

  if (!isLoading && suggestions.length === 0) return null;

  return (
    <section className="border-t border-border/40 bg-sand pb-20 pt-12 md:pb-24 md:pt-16">
      <HeroContainer>
        <HeroTitle as="h2" className="text-2xl text-forest md:text-3xl">
          Autres voyages à découvrir
        </HeroTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          D&apos;autres sorties qui pourraient te plaire
        </p>
      </HeroContainer>

      {isLoading ? (
        <HorizontalScroll
          className="mt-8"
          aria-label="Chargement des suggestions"
          showDots={false}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <HorizontalScrollItem key={i}>
              <Skeleton className="h-[460px] w-full rounded-3xl" />
            </HorizontalScrollItem>
          ))}
        </HorizontalScroll>
      ) : (
        <div className="mt-8">
          <HorizontalScroll aria-label="Voyages suggérés" showDots={false}>
            {suggestions.map((trip) => (
              <HorizontalScrollItem key={trip.id}>
                <TripCardV2 trip={trip} horizontal eagerImage />
              </HorizontalScrollItem>
            ))}
          </HorizontalScroll>
          <p className="mt-4 flex items-center justify-center gap-1 text-sm text-muted-foreground md:hidden">
            Glisse pour voir plus
            <ChevronRight className="h-4 w-4" />
          </p>
        </div>
      )}
    </section>
  );
}
