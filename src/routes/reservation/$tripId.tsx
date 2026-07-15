import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCreateReservation, useGetTrip, useTripsRealtime } from "@/api";
import { PublicLayout } from "@/components/layout/public-layout";
import {
  formatPrice,
  tripAvailabilityBarColor,
  tripAvailabilityLabel,
  tripSpotsRemaining,
} from "@/lib/constants";
import {
  HeroBadge,
  HeroButton,
  HeroCard,
  HeroContainer,
  HeroInput,
  HeroLead,
  HeroMediaFrame,
  HeroTitle,
} from "@/components/public/hero-ui";
import { ReservationPageSkeleton } from "@/components/public/reservation-page-skeleton";
import { SuggestedTrips } from "@/components/public/suggested-trips";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ReservationReceipt } from "@/components/public/reservation-receipt";
import { ReservationSuccessModal } from "@/components/public/reservation-success-modal";
import type { ReservationReceiptData } from "@/lib/reservation-receipt";
import { formatDepartureCountdown, formatDepartureDate, isTripPublicVisible } from "@/lib/trip-dates";
import { isValidPhone } from "@/lib/phone";
import { preloadImage } from "@/lib/preload-images";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reservation/$tripId")({
  component: ReservationPage,
});

function ReservationPage() {
  const { tripId } = Route.useParams();
  useTripsRealtime();
  const { data: trip, isLoading } = useGetTrip(tripId);
  const createReservation = useCreateReservation();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    location: "",
  });
  const [waitlist, setWaitlist] = useState({ firstName: "", lastName: "", phone: "" });
  const [success, setSuccess] = useState<ReservationReceiptData | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setPageReady(false);
      return;
    }

    if (!trip || !isTripPublicVisible(trip)) {
      setPageReady(true);
      return;
    }

    const url = trip.photoUrl?.trim();
    if (!url) {
      setPageReady(true);
      return;
    }

    let cancelled = false;
    preloadImage(url).then(() => {
      if (!cancelled) setPageReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [isLoading, trip]);

  const saveSuccess = (data: ReservationReceiptData) => {
    setSuccess(data);
    setSuccessModalOpen(true);
  };

  const showSkeleton =
    !pageReady && (isLoading || !trip || Boolean(trip && isTripPublicVisible(trip)));

  if (showSkeleton) {
    return (
      <PublicLayout>
        <ReservationPageSkeleton />
      </PublicLayout>
    );
  }

  if (!trip || !isTripPublicVisible(trip)) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-3xl px-6 pb-16 pt-24 text-center">
          <HeroTitle as="h1" className="text-forest">Voyage introuvable</HeroTitle>
          <HeroLead className="mt-3">
            Cette offre n&apos;est plus disponible (date passée ou retirée du site).
          </HeroLead>
        </div>
      </PublicLayout>
    );
  }

  const remaining = tripSpotsRemaining(trip.capacity, trip.spotsTaken);
  const full = remaining <= 0;
  const fillPct = trip.capacity > 0 ? ((trip.capacity - remaining) / trip.capacity) * 100 : 100;
  const countdown = formatDepartureCountdown(trip);
  const departureLabel = formatDepartureDate(trip);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(form.phone)) {
      toast.error("Numéro de téléphone invalide (9 chiffres minimum).");
      return;
    }
    try {
      const result = await createReservation.mutateAsync({
        tripId: trip.id,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        location: form.location,
      });
      saveSuccess({
        bookingRef: result.bookingRef,
        status: result.status,
        tripTitle: trip.title,
        tripDuration: trip.duration,
        tripPrice: trip.price,
        tripMeetingPoint: trip.meetingPoint,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        location: form.location,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Réservation échouée");
    }
  };

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(waitlist.phone)) {
      toast.error("Numéro de téléphone invalide (9 chiffres minimum).");
      return;
    }
    try {
      const result = await createReservation.mutateAsync({
        tripId: trip.id,
        firstName: waitlist.firstName,
        lastName: waitlist.lastName,
        phone: waitlist.phone,
        location: "Liste d'attente",
      });
      saveSuccess({
        bookingRef: result.bookingRef,
        status: "waitlisted",
        tripTitle: trip.title,
        tripDuration: trip.duration,
        tripPrice: trip.price,
        tripMeetingPoint: trip.meetingPoint,
        firstName: waitlist.firstName,
        lastName: waitlist.lastName,
        phone: waitlist.phone,
        location: "Liste d'attente",
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <PublicLayout>
      <HeroContainer
        className={cn(
          "max-w-3xl pb-16 pt-24 md:pt-28",
          "animate-in fade-in-0 duration-300",
        )}
      >
        <HeroMediaFrame decor={false} className="relative">
          {trip.photoUrl ? (
            <img
              src={trip.photoUrl}
              alt={trip.title}
              className="w-full object-contain"
              decoding="async"
            />
          ) : null}
          <HeroBadge
            variant={full ? "danger" : "mint"}
            className="absolute right-4 top-4 text-sm"
          >
            {tripAvailabilityLabel(remaining, trip.capacity)}
          </HeroBadge>
        </HeroMediaFrame>

        <HeroTitle as="h1" className="mt-8 text-forest">
          {trip.title}
        </HeroTitle>
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          {trip.duration} · {formatPrice(trip.price)} DA
        </p>
        {countdown && (
          <p className="mt-2 text-sm font-semibold text-forest">
            {countdown}
            {departureLabel && (
              <span className="font-normal text-muted-foreground"> · {departureLabel}</span>
            )}
          </p>
        )}

        <HeroCard className="mt-6 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Places disponibles
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-forest">
                {full ? (
                  "Complet"
                ) : (
                  <>
                    {remaining} place{remaining > 1 ? "s" : ""}{" "}
                    <span className="text-lg font-semibold text-muted-foreground">
                      sur {trip.capacity}
                    </span>
                  </>
                )}
              </p>
            </div>
            {!full && (
              <p className="text-sm font-medium text-leaf">
                {tripAvailabilityLabel(remaining, trip.capacity)}
              </p>
            )}
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-sand">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                tripAvailabilityBarColor(remaining, trip.capacity),
              )}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </HeroCard>

        <HeroLead className="mt-6">{trip.description}</HeroLead>

        {trip.meetingPoint && (
          <HeroLead className="mt-4 text-sm">
            <span className="font-semibold text-forest">Rendez-vous :</span> {trip.meetingPoint}
          </HeroLead>
        )}

        {trip.includes.length > 0 && (
          <ul className="mt-4 list-inside list-disc text-sm text-muted-foreground">
            {trip.includes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}

        {success ? (
          <>
            <ReservationSuccessModal
              open={successModalOpen}
              bookingRef={success.bookingRef}
              isWaitlist={success.status === "waitlisted"}
              onClose={() => setSuccessModalOpen(false)}
            />
            {!successModalOpen && <ReservationReceipt data={success} />}
          </>
        ) : full ? (
          <HeroCard className="mt-10 p-6">
            <form onSubmit={handleWaitlist} className="space-y-4">
              <HeroTitle as="h3" className="text-forest">Complet — liste d&apos;attente</HeroTitle>
              <HeroLead className="text-sm">Laisse ton nom et ton numéro, on te rappelle si une place se libère.</HeroLead>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Prénom</Label>
                  <HeroInput
                    required
                    value={waitlist.firstName}
                    onChange={(e) => setWaitlist({ ...waitlist, firstName: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Nom</Label>
                  <HeroInput
                    required
                    value={waitlist.lastName}
                    onChange={(e) => setWaitlist({ ...waitlist, lastName: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Téléphone</Label>
                <HeroInput
                  required
                  value={waitlist.phone}
                  onChange={(e) => setWaitlist({ ...waitlist, phone: e.target.value })}
                  className="mt-1"
                />
              </div>
              <HeroButton
                type="submit"
                variant="accent"
                size="md"
                disabled={createReservation.isPending}
                className="w-full"
              >
                Rejoindre la liste d&apos;attente
              </HeroButton>
            </form>
          </HeroCard>
        ) : (
          <HeroCard className="mt-10 p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <HeroTitle as="h3" className="text-forest">Réserver ma place</HeroTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Prénom</Label>
                  <HeroInput
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Nom</Label>
                  <HeroInput
                    required
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Téléphone</Label>
                <HeroInput
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Adresse</Label>
                <Textarea
                  required
                  rows={2}
                  placeholder="Ex. 12 rue des pins, Béjaïa"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="mt-1 resize-none"
                  autoComplete="street-address"
                />
              </div>
              <HeroButton
                type="submit"
                variant="accent"
                size="md"
                disabled={createReservation.isPending}
                className="w-full"
              >
                {createReservation.isPending ? "Envoi..." : "Confirmer ma réservation"}
              </HeroButton>
            </form>
          </HeroCard>
        )}
      </HeroContainer>

      <SuggestedTrips excludeTripId={trip.id} />
    </PublicLayout>
  );
}
