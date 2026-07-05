import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PublicLayout } from "@/components/layout/public-layout";
import {
  useListPublishedOffers,
  useListSessionsByOffer,
  useCreateBooking,
} from "@/api";
import { resolveCoverImage } from "@/lib/supabase";
import { formatPrice, availabilityLabel, availabilityColor, FLOATING_NAV_OFFSET, PLACEHOLDER_IMAGES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion";
import { easeOut } from "@/lib/motion";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/reservation/")({
  component: ReservationPage,
  validateSearch: (search: Record<string, unknown>) => ({
    offer: (search.offer as string) || "",
    session: (search.session as string) || "",
  }),
  beforeLoad: ({ search }) => {
    if (search.offer) {
      throw redirect({
        to: "/offres/$slug",
        params: { slug: search.offer },
        hash: "reserver",
      });
    }
  },
});

const STEPS = ["Choisir l'offre", "Date & places", "Vos informations", "Confirmation"];

function ReservationPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [step, setStep] = useState(search.offer ? 1 : 0);
  const [selectedOfferSlug, setSelectedOfferSlug] = useState(search.offer);
  const [selectedSessionId, setSelectedSessionId] = useState(search.session);
  const [participants, setParticipants] = useState(2);
  const [guest, setGuest] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialRequests: "",
  });

  const { data: offers, isLoading: offersLoading, isError: offersError } = useListPublishedOffers();
  const selectedOffer = offers?.find((o) => o.slug === selectedOfferSlug);
  const { data: sessions } = useListSessionsByOffer(selectedOffer?.id);
  const selectedSession = sessions?.find((s) => s.id === selectedSessionId);
  const maxParticipants = selectedSession
    ? (selectedSession.remainingSeats ??
      Math.max(0, selectedSession.capacity - selectedSession.bookedCount))
    : undefined;
  const createBooking = useCreateBooking();

  const canGoStep2 = Boolean(selectedOfferSlug);
  const canGoStep3 = Boolean(selectedSessionId);
  const canSubmit =
    guest.firstName && guest.lastName && guest.email && guest.phone && participants > 0;

  const handleConfirm = async () => {
    if (!selectedSessionId) return;
    try {
      const result = await createBooking.mutateAsync({
        sessionId: selectedSessionId,
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email,
        phone: guest.phone,
        participants,
        specialRequests: guest.specialRequests || undefined,
      });
      toast.success("Réservation confirmée !");
      navigate({
        to: "/reservation/confirmation/$ref",
        params: { ref: result.bookingRef },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Réservation échouée");
    }
  };

  return (
    <PublicLayout>
      <div className={cn("mx-auto max-w-4xl px-6 pb-16", FLOATING_NAV_OFFSET)}>
        <Reveal>
          <h1 className="font-display text-4xl font-light text-forest">Réservation</h1>
          <p className="mt-2 text-muted-foreground">Réservez votre circuit en 4 étapes simples.</p>
        </Reveal>

        <Reveal delay={0.08}>
        <div className="mt-10 flex flex-wrap gap-2">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={cn(
                "flex items-center gap-2 rounded-[4px] px-4 py-2 text-sm font-medium",
                i <= step ? "bg-mint text-forest" : "bg-secondary text-muted-foreground",
              )}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest text-xs text-primary-foreground">
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          ))}
        </div>
        </Reveal>

        <Card className="mt-8 overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={easeOut}
              >
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-bold text-forest">Sélectionnez une offre</h2>
                {offersLoading ? (
                  <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-28 rounded-md" />
                    ))}
                  </div>
                ) : offersError ? (
                  <p className="text-sm text-destructive">
                    Impossible de charger les offres. Vérifiez votre connexion et réessayez.
                  </p>
                ) : (offers ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucune offre disponible pour le moment.{" "}
                    <a href="/offres" className="font-medium text-forest underline">
                      Voir toutes les offres
                    </a>
                  </p>
                ) : (
                <div className="grid gap-4">
                  {(offers ?? []).map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setSelectedOfferSlug(o.slug)}
                      className={cn(
                        "flex gap-4 rounded-md border p-4 text-left transition",
                        selectedOfferSlug === o.slug
                          ? "border-leaf bg-mint/30"
                          : "border-border hover:border-leaf/50",
                      )}
                    >
                      <img
                        src={resolveCoverImage(o.coverImage, PLACEHOLDER_IMAGES.gouraya)}
                        alt=""
                        className="h-20 w-20 rounded-xl object-cover"
                      />
                      <div>
                        <div className="font-semibold text-forest">{o.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatPrice(o.priceDzd)} DA · {o.durationLabel}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                )}
              </div>
            )}

            {step === 1 && selectedOffer && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-bold text-forest">
                  Choisissez une date — {selectedOffer.title}
                </h2>
                <div>
                  <Label>Nombre de participants</Label>
                  <Input
                    type="number"
                    min={1}
                    max={maxParticipants}
                    value={participants}
                    onChange={(e) => setParticipants(Number(e.target.value))}
                    className="mt-1 max-w-[120px]"
                  />
                  {maxParticipants !== undefined && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Jusqu&apos;à {maxParticipants} place{maxParticipants > 1 ? "s" : ""} sur ce départ
                    </p>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(sessions ?? []).map((s) => {
                    const remaining = s.remainingSeats ?? s.capacity - s.bookedCount;
                    const canBook = remaining >= participants;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        disabled={!canBook}
                        onClick={() => setSelectedSessionId(s.id)}
                        className={cn(
                          "rounded-md border p-4 text-left transition",
                          !canBook && "cursor-not-allowed opacity-50",
                          selectedSessionId === s.id
                            ? "border-leaf bg-mint/30"
                            : "border-border hover:border-leaf/50",
                        )}
                      >
                        <div className="font-semibold text-forest">
                          {new Date(s.sessionDate).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                            <div
                              className={cn("h-full", availabilityColor(remaining, s.capacity))}
                              style={{
                                width: `${((s.capacity - remaining) / s.capacity) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium">{availabilityLabel(remaining)}</span>
                        </div>
                      </button>
                    );
                  })}
                  {(sessions ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucune session disponible pour cette offre.</p>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-bold text-forest">Vos informations</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Prénom</Label>
                    <Input value={guest.firstName} onChange={(e) => setGuest({ ...guest, firstName: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Nom</Label>
                    <Input value={guest.lastName} onChange={(e) => setGuest({ ...guest, lastName: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <Input value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <Label>Demandes spéciales (optionnel)</Label>
                  <Textarea
                    value={guest.specialRequests}
                    onChange={(e) => setGuest({ ...guest, specialRequests: e.target.value })}
                    rows={3}
                    placeholder="Régime alimentaire, accessibilité..."
                  />
                </div>
              </div>
            )}

            {step === 3 && selectedOffer && selectedSession && (
              <div className="space-y-6">
                <h2 className="font-display text-xl font-bold text-forest">Récapitulatif</h2>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-border pb-2">
                    <dt className="text-muted-foreground">Circuit</dt>
                    <dd className="font-medium">{selectedOffer.title}</dd>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <dt className="text-muted-foreground">Date</dt>
                    <dd className="font-medium">
                      {new Date(selectedSession.sessionDate).toLocaleDateString("fr-FR")}
                    </dd>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <dt className="text-muted-foreground">Participants</dt>
                    <dd className="font-medium">{participants}</dd>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <dt className="text-muted-foreground">Contact</dt>
                    <dd className="font-medium">
                      {guest.firstName} {guest.lastName}
                      <br />
                      {guest.email}
                    </dd>
                  </div>
                  <div className="flex justify-between pt-2">
                    <dt className="font-display text-lg font-bold text-forest">Total</dt>
                    <dd className="font-display text-2xl font-bold text-forest">
                      {formatPrice(selectedOffer.priceDzd * participants)} DA
                    </dd>
                  </div>
                </dl>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleConfirm}
                  disabled={!canSubmit || createBooking.isPending}
                >
                  {createBooking.isPending ? "Confirmation..." : "Confirmer la réservation"}
                </Button>
              </div>
            )}

              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex justify-between">
              <Button
                variant="ghost"
                disabled={step === 0}
                onClick={() => setStep((s) => s - 1)}
              >
                <ChevronLeft className="h-4 w-4" /> Précédent
              </Button>
              {step < 3 && (
                <Button
                  className=""
                  disabled={
                    (step === 0 && !canGoStep2) ||
                    (step === 1 && !canGoStep3) ||
                    (step === 2 && !canSubmit)
                  }
                  onClick={() => setStep((s) => s + 1)}
                >
                  Suivant <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
