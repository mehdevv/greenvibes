import { useEffect, useRef, useState } from "react";
import type { Trip } from "@/api/types";
import { useCreateReservation } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isValidPhone } from "@/lib/phone";
import { tripSpotsRemaining } from "@/lib/availability";
import { cn } from "@/lib/utils";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

const emptyForm = {
  firstName: "",
  lastName: "",
  phone: "",
  location: "",
};

type ReservationQuickFormProps = {
  trip: Trip | null;
  onCreated?: (bookingRef: string) => void;
  className?: string;
};

export function ReservationQuickForm({ trip, onCreated, className }: ReservationQuickFormProps) {
  const createReservation = useCreateReservation();
  const [form, setForm] = useState(emptyForm);
  const firstNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(emptyForm);
    if (trip) {
      window.setTimeout(() => firstNameRef.current?.focus(), 50);
    }
  }, [trip?.id]);

  if (!trip) {
    return (
      <div className={cn("rounded-xl border border-dashed border-border bg-secondary/20 p-8 text-center", className)}>
        <p className="text-sm text-muted-foreground">Sélectionnez une offre pour inscrire un client.</p>
      </div>
    );
  }

  const remaining = tripSpotsRemaining(trip.capacity, trip.spotsTaken);
  const full = remaining <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("Prénom et nom requis.");
      return;
    }
    if (!isValidPhone(form.phone)) {
      toast.error("Numéro de téléphone invalide (9 chiffres minimum).");
      return;
    }
    if (!full && !form.location.trim()) {
      toast.error("L'adresse est requise.");
      return;
    }

    try {
      const result = await createReservation.mutateAsync({
        tripId: trip.id,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        location: full ? "Liste d'attente" : form.location.trim(),
      });
      toast.success(
        result.status === "confirmed"
          ? `Inscrit — réf. ${result.bookingRef}`
          : `Liste d'attente — réf. ${result.bookingRef}`,
      );
      setForm(emptyForm);
      onCreated?.(result.bookingRef);
      firstNameRef.current?.focus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Inscription échouée");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("rounded-xl border border-border bg-card p-4 shadow-sm md:p-5", className)}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-forest" />
          <h2 className="font-display text-lg font-semibold text-foreground">Nouvelle inscription</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {full ? (
            <span className="font-medium text-amber-700">Complet — liste d&apos;attente</span>
          ) : (
            <>
              <span className="font-medium text-forest">{remaining}</span> place{remaining > 1 ? "s" : ""} restante
              {remaining > 1 ? "s" : ""}
            </>
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="rq-first">Prénom *</Label>
          <Input
            ref={firstNameRef}
            id="rq-first"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            placeholder="Prénom"
            className="mt-1.5 h-12 text-base"
            autoComplete="given-name"
            enterKeyHint="next"
          />
        </div>
        <div>
          <Label htmlFor="rq-last">Nom *</Label>
          <Input
            id="rq-last"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            placeholder="Nom"
            className="mt-1.5 h-12 text-base"
            autoComplete="family-name"
            enterKeyHint="next"
          />
        </div>
        <div>
          <Label htmlFor="rq-phone">Téléphone *</Label>
          <Input
            id="rq-phone"
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="05XX XX XX XX"
            className="mt-1.5 h-12 text-base"
            autoComplete="tel"
            enterKeyHint="next"
          />
        </div>
      </div>

      {!full && (
        <div className="mt-4">
          <Label htmlFor="rq-address">Adresse *</Label>
          <Textarea
            id="rq-address"
            rows={2}
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Ex. 12 rue des pins, Béjaïa"
            className="mt-1.5 min-h-[4.5rem] resize-none text-base"
            autoComplete="street-address"
            enterKeyHint="done"
          />
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          disabled={createReservation.isPending}
          className="h-12 flex-1 gap-2 text-base sm:flex-none"
        >
          {createReservation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {full ? "Ajouter en liste d'attente" : "Inscrire le client"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 text-base"
          onClick={() => {
            setForm(emptyForm);
            firstNameRef.current?.focus();
          }}
        >
          Effacer
        </Button>
      </div>
    </form>
  );
}
