import { HeroCard, HeroContainer, HeroMediaFrame } from "@/components/public/hero-ui";
import { Skeleton } from "@/components/ui/skeleton";

export function ReservationPageSkeleton() {
  return (
    <HeroContainer
      className="max-w-3xl pb-16 pt-24 md:pt-28"
      aria-busy="true"
      aria-label="Chargement de la réservation"
    >
      <HeroMediaFrame decor={false} className="relative">
        <Skeleton className="aspect-[4/3] w-full rounded-3xl sm:aspect-[16/10]" />
        <Skeleton className="absolute right-4 top-4 h-7 w-28 rounded-full" />
      </HeroMediaFrame>

      <Skeleton className="mt-8 h-9 w-4/5 max-w-lg" />
      <Skeleton className="mt-3 h-5 w-48" />
      <Skeleton className="mt-2 h-5 w-64" />

      <HeroCard className="mt-6 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-40" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="mt-4 h-2.5 w-full rounded-full" />
      </HeroCard>

      <div className="mt-6 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      <Skeleton className="mt-4 h-4 w-3/4" />

      <ul className="mt-4 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i}>
            <Skeleton className="h-4 w-2/3" />
          </li>
        ))}
      </ul>

      <HeroCard className="mt-10 p-6">
        <Skeleton className="h-7 w-48" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
        <Skeleton className="mt-6 h-12 w-full rounded-xl" />
      </HeroCard>
    </HeroContainer>
  );
}
