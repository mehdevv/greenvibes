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
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { easeOut } from "@/lib/motion";

const STEPS = ["Vos noms", "Disponibilités"];

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
  });

  const { data: sessions, isLoading: sessionsLoading } = useListSessionsByOffer(offer.id);
  const selectedSession = sessions?.find((s) => s.id === selectedSessionId);
  const maxParticipants = selectedSession
    ? (selectedSession.remainingSeats ??
      Math.max(0, selectedSession.capacity - selectedSession.bookedCount))
    : undefined;
  const createBooking = useCreateBooking();

  const canGoNames =
    Boolean(guest.firstName.trim()) &&
    Boolean(guest.lastName.trim()) &&
    Boolean(guest.email.trim()) &&
    Boolean(guest.phone.trim());
  const canConfirm = canGoNames && Boolean(selectedSessionId) && participants > 0;

  const handleConfirm = async () => {
    if (!selectedSessionId) return;
    try {
      const result = await createBooking.mutateAsync({
        sessionId: selectedSessionId,
        firstName: guest.firstName.trim(),
        lastName: guest.lastName.trim(),
        email: guest.email.trim(),
        phone: guest.phone.trim(),
        participants,
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
        "scroll-mt-28 bg-card p-6 sm:p-8 lg:sticky lg:self-start",
        FLOATING_NAV_STICKY,
        className,
      )}
    >
      <div className="pb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-leaf">Réserver</p>
        <div className="mt-2 font-display text-3xl font-semibold text-forest">
          {formatPrice(offer.priceDzd)}{" "}
          <span className="text-base font-normal text-muted-foreground">DA / pers.</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{offer.durationLabel}</p>
      </div>

      <div className="mt-5 flex gap-2">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium",
              i <= step ? "bg-mint text-forest" : "bg-muted text-muted-foreground",
            )}
          >
            <span className="flex h-5 w-5 items-center justify-center bg-forest text-[10px] text-primary-foreground">
              {i < step ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            {label}
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
                <h2 className="font-display text-lg font-semibold text-forest">
                  Qui part avec vous ?
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Prénom</Label>
                    <Input
                      value={guest.firstName}
                      onChange={(e) => setGuest({ ...guest, firstName: e.target.value })}
                      placeholder="Amine"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label>Nom</Label>
                    <Input
                      value={guest.lastName}
                      onChange={(e) => setGuest({ ...guest, lastName: e.target.value })}
                      placeholder="Benali"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={guest.email}
                      onChange={(e) => setGuest({ ...guest, email: e.target.value })}
                      placeholder="vous@email.com"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Téléphone</Label>
                    <Input
                      value={guest.phone}
                      onChange={(e) => setGuest({ ...guest, phone: e.target.value })}
                      placeholder="05 XX XX XX XX"
                      className="mt-1"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-semibold text-forest">
                  Dates & places
                </h2>
                <div>
                  <Label>Nombre de participants</Label>
                  <Input
                    type="number"
                    min={1}
                    max={maxParticipants ?? 20}
                    value={participants}
                    onChange={(e) => setParticipants(Number(e.target.value))}
                    className="mt-1 max-w-[120px]"
                  />
                  {maxParticipants !== undefined && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Jusqu&apos;à {maxParticipants} place{maxParticipants > 1 ? "s" : ""} sur ce
                      départ
                    </p>
                  )}
                </div>
                {sessionsLoading ? (
                  <p className="text-sm text-muted-foreground">Chargement des dates...</p>
                ) : (
                  <div className="grid max-h-56 gap-2 overflow-y-auto pr-1">
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
                            "bg-muted/60 p-3 text-left text-sm transition",
                            !canBook && "cursor-not-allowed opacity-50",
                            selectedSessionId === s.id
                              ? "bg-mint text-forest"
                              : "hover:bg-muted",
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
                            <div className="h-1 flex-1 overflow-hidden bg-secondary">
                              <div
                                className={cn("h-full", availabilityColor(remaining, s.capacity))}
                                style={{
                                  width: `${((s.capacity - remaining) / s.capacity) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-[10px] font-medium">
                              {availabilityLabel(remaining)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                    {(sessions ?? []).length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Aucune date disponible pour le moment.
                      </p>
                    )}
                  </div>
                )}

                {selectedSession && (
                  <div className="bg-muted/50 p-4 text-sm">
                    <p className="font-medium text-forest">
                      {guest.firstName} {guest.lastName} · {participants} pers.
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {new Date(selectedSession.sessionDate).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                    <p className="mt-2 font-display text-xl font-semibold text-forest">
                      Total {formatPrice(offer.priceDzd * participants)} DA
                    </p>
                  </div>
                )}

                <Button
                  className="w-full rounded-sm"
                  size="lg"
                  onClick={handleConfirm}
                  disabled={!canConfirm || createBooking.isPending}
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
            <ChevronLeft className="h-4 w-4" /> Retour
          </Button>
          {step === 0 && (
            <Button
              type="button"
              size="sm"
              className="rounded-sm"
              disabled={!canGoNames}
              onClick={() => setStep(1)}
            >
              Voir les disponibilités <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
