import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useListSessionsByOffer, useCreateBooking } from "@/api";
import type { Offer } from "@/api/types";
import {
  formatPrice,
  availabilityLabel,
  availabilityColor,
  FLOATING_NAV_STICKY,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { easeOut } from "@/lib/motion";

const STEPS = ["Date & places", "Vos informations", "Confirmation"];

type OfferBookingPanelProps = {
  offer: Offer;
  className?: string;
};

export function OfferBookingPanel({ offer, className }: OfferBookingPanelProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [participants, setParticipants] = useState(2);
  const [guest, setGuest] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialRequests: "",
  });

  const { data: sessions, isLoading: sessionsLoading } = useListSessionsByOffer(offer.id);
  const selectedSession = sessions?.find((s) => s.id === selectedSessionId);
  const maxParticipants = selectedSession
    ? (selectedSession.remainingSeats ??
      Math.max(0, selectedSession.capacity - selectedSession.bookedCount))
    : undefined;
  const createBooking = useCreateBooking();

  const canGoStep1 = Boolean(selectedSessionId);
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
    <aside
      id="reserver"
      className={cn(
        "scroll-mt-28 rounded-md border border-border bg-card p-6 shadow-soft sm:p-8 lg:sticky lg:self-start",
        FLOATING_NAV_STICKY,
        className,
      )}
    >
      <div className="border-b border-border pb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-leaf">Réservation</p>
        <div className="mt-2 font-display text-3xl font-light text-forest">
          {formatPrice(offer.priceDzd)}{" "}
          <span className="text-base font-normal text-muted-foreground">DA / pers.</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{offer.durationLabel}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-medium",
              i <= step ? "bg-mint text-forest" : "bg-secondary text-muted-foreground",
            )}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-forest text-[10px] text-primary-foreground">
              {i < step ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={easeOut}
          >
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold text-forest">Choisissez une date</h2>
                <div>
                  <Label>Participants</Label>
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
                {sessionsLoading ? (
                  <p className="text-sm text-muted-foreground">Chargement des dates...</p>
                ) : (
                  <div className="grid max-h-64 gap-2 overflow-y-auto pr-1">
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
                            "rounded-md border p-3 text-left text-sm transition",
                            !canBook && "cursor-not-allowed opacity-50",
                            selectedSessionId === s.id
                              ? "border-leaf bg-mint/30"
                              : "border-border hover:border-leaf/50",
                          )}
                        >
                          <div className="font-semibold text-forest">
                            {new Date(s.sessionDate).toLocaleDateString("fr-FR", {
                              weekday: "short",
                              day: "numeric",
                              month: "long",
                            })}
                          </div>
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                              <div
                                className={cn("h-full", availabilityColor(remaining, s.capacity))}
                                style={{
                                  width: `${((s.capacity - remaining) / s.capacity) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-[10px] font-medium">{availabilityLabel(remaining)}</span>
                          </div>
                        </button>
                      );
                    })}
                    {(sessions ?? []).length === 0 && (
                      <p className="text-sm text-muted-foreground">Aucune date disponible pour le moment.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold text-forest">Vos informations</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Prénom</Label>
                    <Input
                      value={guest.firstName}
                      onChange={(e) => setGuest({ ...guest, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Nom</Label>
                    <Input
                      value={guest.lastName}
                      onChange={(e) => setGuest({ ...guest, lastName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={guest.email}
                      onChange={(e) => setGuest({ ...guest, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Téléphone</Label>
                    <Input
                      value={guest.phone}
                      onChange={(e) => setGuest({ ...guest, phone: e.target.value })}
                      required
                    />
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

            {step === 2 && selectedSession && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold text-forest">Récapitulatif</h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4 border-b border-border pb-2">
                    <dt className="text-muted-foreground">Circuit</dt>
                    <dd className="text-right font-medium">{offer.title}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-border pb-2">
                    <dt className="text-muted-foreground">Date</dt>
                    <dd className="text-right font-medium">
                      {new Date(selectedSession.sessionDate).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-border pb-2">
                    <dt className="text-muted-foreground">Participants</dt>
                    <dd className="font-medium">{participants}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-border pb-2">
                    <dt className="text-muted-foreground">Contact</dt>
                    <dd className="text-right font-medium">
                      {guest.firstName} {guest.lastName}
                      <br />
                      <span className="text-muted-foreground">{guest.email}</span>
                    </dd>
                  </div>
                  {guest.specialRequests && (
                    <div className="flex justify-between gap-4 border-b border-border pb-2">
                      <dt className="text-muted-foreground">Demandes</dt>
                      <dd className="max-w-[60%] text-right text-xs">{guest.specialRequests}</dd>
                    </div>
                  )}
                  <div className="flex justify-between pt-1">
                    <dt className="font-display font-bold text-forest">Total</dt>
                    <dd className="font-display text-xl font-bold text-forest">
                      {formatPrice(offer.priceDzd * participants)} DA
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

        <div className="mt-6 flex justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
          >
            <ChevronLeft className="h-4 w-4" /> Précédent
          </Button>
          {step < 2 && (
            <Button
              type="button"
              size="sm"
              className=""
              disabled={
                (step === 0 && !canGoStep1) ||
                (step === 1 && !canSubmit)
              }
              onClick={() => setStep((s) => s + 1)}
            >
              Suivant <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
