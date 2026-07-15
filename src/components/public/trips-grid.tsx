import { useListTrips, useTripsRealtime } from "@/api";
import { EditableBlockHeader } from "@/components/admin/editable-text";
import { TripCardV2 } from "@/components/public/trip-card-v2";
import {
  HeroContainer,
  HorizontalScroll,
  HorizontalScrollItem,
} from "@/components/public/hero-ui";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";

export function TripsGrid() {
  useTripsRealtime();
  const { data: trips, isLoading } = useListTrips();

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
          autoScrollInterval={0}
          showDots={false}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <HorizontalScrollItem key={i}>
              <Skeleton className="h-[460px] w-full rounded-3xl" />
            </HorizontalScrollItem>
          ))}
        </HorizontalScroll>
      ) : (trips?.length ?? 0) > 0 ? (
        <div className="mt-10">
          <HorizontalScroll
            aria-label="Liste des voyages"
            itemCount={trips?.length ?? 0}
            autoScrollInterval={0}
          >
            {(trips ?? []).map((trip) => (
              <HorizontalScrollItem key={trip.id}>
                <TripCardV2 trip={trip} horizontal />
              </HorizontalScrollItem>
            ))}
          </HorizontalScroll>
          <p className="mt-4 flex items-center justify-center gap-1 text-sm text-muted-foreground md:hidden">
            Glisse pour voir plus
            <ChevronRight className="h-4 w-4" />
          </p>
        </div>
      ) : (
        <HeroContainer className="mt-12 text-center text-muted-foreground">
          Aucune sortie pour le moment — reviens bientôt ou contacte-nous directement.
        </HeroContainer>
      )}
    </section>
  );
}
