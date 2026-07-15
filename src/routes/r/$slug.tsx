import { createFileRoute, redirect } from "@tanstack/react-router";
import { fetchTripBySlug } from "@/api/trips";
import { PublicLayout } from "@/components/layout/public-layout";
import { isTripPublicVisible } from "@/lib/trip-dates";
import { HeroLead, HeroTitle } from "@/components/public/hero-ui";

export const Route = createFileRoute("/r/$slug")({
  beforeLoad: async ({ context, params }) => {
    const trip = await context.queryClient.ensureQueryData({
      queryKey: ["trips", "slug", params.slug],
      queryFn: () => fetchTripBySlug(params.slug),
    });

    if (trip && isTripPublicVisible(trip)) {
      context.queryClient.setQueryData(["trips", trip.id], trip);
      throw redirect({
        to: "/reservation/$tripId",
        params: { tripId: trip.id },
        replace: true,
      });
    }
  },
  component: TripShortLinkNotFound,
});

function TripShortLinkNotFound() {
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
