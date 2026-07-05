import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/public-layout";
import { useGetBookingByRef } from "@/api";
import { formatPrice, DEFAULT_OFFRES_SEARCH, FLOATING_NAV_OFFSET } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reservation/confirmation/$ref")({
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { ref } = Route.useParams();
  const { data: booking, isLoading } = useGetBookingByRef(ref);

  if (isLoading) {
    return (
      <PublicLayout>
        <Skeleton className={cn("mx-auto h-64 max-w-lg rounded-md", FLOATING_NAV_OFFSET)} />
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <Reveal className={cn("mx-auto max-w-lg px-6 pb-16 text-center", FLOATING_NAV_OFFSET)}>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
          <CheckCircle className="h-8 w-8 text-foreground" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-light text-foreground">
          Réservation confirmée !
        </h1>
        <p className="mt-3 text-muted-foreground">
          Merci {booking?.firstName}. Votre place est sécurisée. Un email de confirmation vous sera
          envoyé si la messagerie est configurée.
        </p>

        <Card className="mt-8 text-left">
          <CardContent className="space-y-3 p-6 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Référence</span>
              <span className="font-mono font-bold text-foreground">{ref}</span>
            </div>
            {booking && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Circuit</span>
                  <span className="font-medium">{booking.session?.offer?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{booking.session?.sessionDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Participants</span>
                  <span>{booking.participants}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-display text-lg font-bold text-foreground">
                    {formatPrice(booking.totalPriceDzd)} DA
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="">
            <Link to="/">
              Retour à l&apos;accueil
            </Link>
          </Button>
          <Button asChild variant="outline" className="">
            <Link to="/offres" search={DEFAULT_OFFRES_SEARCH}>
              Explorer d&apos;autres offres <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Reveal>
    </PublicLayout>
  );
}
