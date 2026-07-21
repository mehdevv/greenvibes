import { useEffect } from "react";
import { useListTrips, useTripsRealtime } from "@/api";
import { EditableBlockHeader } from "@/components/admin/editable-text";
import { TripCardV2 } from "@/components/public/trip-card-v2";
import {
  HeroContainer,
  HorizontalScroll,
  HorizontalScrollItem,
} from "@/components/public/hero-ui";
import { preloadImages } from "@/lib/preload-images";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";

export function TripsGrid() {
  useTripsRealtime();
  const { data: trips, isLoading } = useListTrips();

  useEffect(() => {
    if (!trips?.length) return;
    preloadImages(trips.map((t) => t.photoUrl));
  }, [trips]);

  if (!isLoading && !(trips?.length ?? 0)) return null;

  return (
    <section
      id="voyages"
      className="scroll-mt-24 rounded-b-3xl bg-sand pb-20 pt-10 md:rounded-b-[2.5rem] md:pb-28 md:pt-14 lg:rounded-b-[3rem] lg:pb-32"
    >
      <HeroContainer>
        <EditableBlockHeader
          showChevron
          title="Voyages à découvrir"
          titleKey="trips.title"
        />
      </HeroContainer>

      {isLoading ? (
        <HorizontalScroll
          className="mt-10"
          aria-label="Chargement des voyages"
          showDots={false}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <HorizontalScrollItem key={i}>
              <Skeleton className="h-[460px] w-full rounded-3xl" />
            </HorizontalScrollItem>
          ))}
        </HorizontalScroll>
      ) : (
        <div className="mt-10">
          <HorizontalScroll aria-label="Liste des voyages" showDots={false}>
            {(trips ?? []).map((trip) => (
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
