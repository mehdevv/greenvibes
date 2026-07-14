import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HeroButton } from "@/components/public/hero-ui";
import { AGENCY_CONTACT } from "@/lib/constants";

type ReservationSuccessModalProps = {
  open: boolean;
  bookingRef: string;
  isWaitlist?: boolean;
  onClose: () => void;
};

function SuccessCheckmark() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  return (
    <motion.div
      className="relative mx-auto h-28 w-28"
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
    >
      <motion.div
        className="absolute inset-0 rounded-full bg-emerald-200/60"
        initial={{ scale: 0.8, opacity: 0.8 }}
        animate={{ scale: 1.6, opacity: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-0 rounded-full bg-emerald-100"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.05, type: "spring", stiffness: 300, damping: 20 }}
      />
      <motion.svg
        viewBox="0 0 52 52"
        className="absolute inset-0 m-auto h-16 w-16 text-emerald-600"
        initial="hidden"
        animate="visible"
      >
        <motion.circle
          cx="26"
          cy="26"
          r="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          variants={{
            hidden: { pathLength: 0, opacity: 0 },
            visible: { pathLength: 1, opacity: 1 },
          }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
        <motion.path
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14 27l7 7 16-16"
          variants={{
            hidden: { pathLength: 0, opacity: 0 },
            visible: { pathLength: 1, opacity: 1 },
          }}
          transition={{ duration: 0.35, delay: 0.35, ease: "easeOut" }}
        />
      </motion.svg>
    </motion.div>
  );
}

export function ReservationSuccessModal({
  open,
  bookingRef,
  isWaitlist,
  onClose,
}: ReservationSuccessModalProps) {
  const [phase, setPhase] = useState<"animating" | "dialog">("animating");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) {
      setPhase("animating");
      return;
    }
    if (reduceMotion) {
      setPhase("dialog");
      return;
    }
    const timer = window.setTimeout(() => setPhase("dialog"), 1200);
    return () => window.clearTimeout(timer);
  }, [open, reduceMotion]);

  return (
    <>
      {open && phase === "animating" && (
        <motion.div
          className="fixed inset-0 z-[250] flex items-center justify-center bg-background/90 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="text-center">
            <SuccessCheckmark />
            <motion.p
              className="mt-6 font-display text-xl font-semibold text-forest"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {isWaitlist ? "Inscription enregistrée !" : "Réservation envoyée !"}
            </motion.p>
          </div>
        </motion.div>
      )}

      <Dialog open={open && phase === "dialog"} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-md rounded-3xl border-border/60 sm:rounded-3xl">
          <DialogHeader className="items-center text-center">
            <SuccessCheckmark />
            <DialogTitle className="mt-4 font-display text-2xl text-forest">
              {isWaitlist ? "Tu es sur la liste d'attente" : "Merci pour ta réservation !"}
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed text-muted-foreground">
              {isWaitlist ? (
                <>
                  Référence <strong className="text-forest">{bookingRef}</strong>. L&apos;équipe
                  GreenVibes te contactera sous <strong className="text-forest">24 à 48 h</strong>{" "}
                  si une place se libère.
                </>
              ) : (
                <>
                  Référence <strong className="text-forest">{bookingRef}</strong>. L&apos;équipe
                  GreenVibes t&apos;appellera sous <strong className="text-forest">24 à 48 h</strong>{" "}
                  pour confirmer les détails de ta sortie.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center gap-2 rounded-2xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0 text-forest" />
            <span>
              Garde ton téléphone allumé — nous joignons au{" "}
              <strong className="text-forest">{AGENCY_CONTACT.phoneDisplay}</strong>
            </span>
          </div>

          <HeroButton type="button" variant="accent" size="md" className="w-full" onClick={onClose}>
            Compris, merci !
          </HeroButton>
        </DialogContent>
      </Dialog>
    </>
  );
}
