import { Download, Printer } from "lucide-react";
import { AGENCY_CONTACT, formatPrice } from "@/lib/constants";
import { downloadReservationReceipt, printReservationReceipt } from "@/lib/reservation-receipt";
import type { ReservationReceiptData } from "@/lib/reservation-receipt";
import { HeroButton, HeroCard, HeroLead, HeroTitle } from "@/components/public/hero-ui";

type ReservationReceiptProps = {
  data: ReservationReceiptData;
};

export function ReservationReceipt({ data }: ReservationReceiptProps) {
  const isWaitlist = data.status === "waitlisted";

  return (
    <HeroCard tone="sand" className="mt-10 p-6 md:p-8">
      <div id="reservation-receipt" className="text-left">
        <HeroTitle as="h3" className="text-center text-forest">
          {isWaitlist ? "Liste d'attente enregistrée" : "Réservation confirmée"}
        </HeroTitle>
        <HeroLead className="mt-2 text-center">
          Référence : <strong className="text-forest">{data.bookingRef}</strong>
        </HeroLead>
        <HeroLead className="mt-2 text-center text-sm">
          {isWaitlist
            ? "On te contacte sous 24 à 48 h si une place se libère."
            : "L'équipe GreenVibes t'appellera sous 24 à 48 h pour confirmer les détails."}
        </HeroLead>

        <dl className="mt-6 space-y-3 rounded-2xl bg-white/80 p-4 text-sm ring-1 ring-border/40">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Sortie</dt>
            <dd className="text-right font-medium text-forest">{data.tripTitle}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Durée</dt>
            <dd className="font-medium">{data.tripDuration}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Prix</dt>
            <dd className="font-medium">{formatPrice(data.tripPrice)} DA</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Voyageur</dt>
            <dd className="text-right font-medium">
              {data.firstName} {data.lastName}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Téléphone</dt>
            <dd className="font-medium">{data.phone}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Localisation</dt>
            <dd className="text-right font-medium">{data.location}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Statut</dt>
            <dd className="font-medium capitalize">
              {isWaitlist ? "Liste d'attente" : "Confirmée"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <HeroButton
          type="button"
          variant="accent"
          size="md"
          icon={Download}
          className="flex-1"
          onClick={() => downloadReservationReceipt(data)}
        >
          Télécharger le PDF
        </HeroButton>
        <HeroButton
          type="button"
          variant="outline"
          size="md"
          icon={Printer}
          className="flex-1"
          onClick={() => printReservationReceipt(data)}
        >
          Imprimer
        </HeroButton>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Questions ? {AGENCY_CONTACT.phoneDisplay} · WhatsApp disponible
      </p>
    </HeroCard>
  );
}
