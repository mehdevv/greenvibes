import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useGetTripBySlug } from "@/api";
import { PublicLayout } from "@/components/layout/public-layout";
import { isTripPublicVisible } from "@/lib/trip-dates";
import { HeroLead, HeroTitle } from "@/components/public/hero-ui";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/r/$slug")({
  component: TripShortLinkPage,
});

function TripShortLinkPage() {
  const { slug } = Route.useParams();
  const { data: trip, isLoading, isError } = useGetTripBySlug(slug);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-3xl px-6 pb-16 pt-24">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </PublicLayout>
    );
  }

  if (isError || !trip || !isTripPublicVisible(trip)) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-3xl px-6 pb-16 pt-24 text-center">
          <HeroTitle as="h1" className="text-forest">
            Lien introuvable
          </HeroTitle>
          <HeroLead className="mt-3">
            Cette offre n&apos;existe pas ou n&apos;est plus disponible.
          </HeroLead>
        </div>
      </PublicLayout>
    );
  }

  return <Navigate to="/reservation/$tripId" params={{ tripId: trip.id }} replace />;
}
