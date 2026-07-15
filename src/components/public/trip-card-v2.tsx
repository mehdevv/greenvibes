import { Link } from "@tanstack/react-router";
import type { Trip } from "@/api/types";
import {
  formatPrice,
  tripAvailabilityBarColor,
  tripSpotsRemaining,
} from "@/lib/constants";
import { formatDepartureCountdown, formatDepartureDate } from "@/lib/trip-dates";
import {
  HeroBadge,
  HeroCard,
  HeroLead,
  HeroTitle,
  heroBtnClasses,
} from "@/components/public/hero-ui";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

type TripCardProps = {
  trip: Trip;
  featured?: boolean;
  horizontal?: boolean;
};

export function TripCardV2({ trip, horizontal }: TripCardProps) {
  const remaining = tripSpotsRemaining(trip.capacity, trip.spotsTaken);
  const full = remaining <= 0;
  const fillPct = trip.capacity > 0 ? ((trip.capacity - remaining) / trip.capacity) * 100 : 100;
  const countdown = formatDepartureCountdown(trip);
  const departureLabel = formatDepartureDate(trip);

  return (
    <HeroCard
      className={cn(
        "group flex h-full flex-col transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lg",
        horizontal && "min-h-[440px]",
      )}
    >
      <div className={cn("relative overflow-hidden", horizontal ? "aspect-[4/3]" : "aspect-[16/10]")}>
        <img
          src={trip.photoUrl ?? ""}
          alt={trip.title}
          className="h-full w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-105"
          loading="lazy"
        />
        <HeroBadge variant="white" className="absolute left-4 top-4">
          {trip.duration}
        </HeroBadge>
        <HeroBadge
          variant={full ? "danger" : remaining <= Math.max(2, Math.floor(trip.capacity * 0.25)) ? "white" : "mint"}
          className={cn(
            "absolute right-4 top-4",
            !full && remaining <= Math.max(2, Math.floor(trip.capacity * 0.25)) && "bg-orange-100 text-orange-800",
          )}
        >
          {full
            ? "Complet"
            : `${remaining} place${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}`}
        </HeroBadge>
      </div>

      <div className={cn("flex flex-1 flex-col", horizontal ? "p-5" : "p-6")}>
        <HeroTitle as="h3" className={cn("text-forest", horizontal ? "text-lg" : "text-xl")}>
          {trip.title}
        </HeroTitle>

        {countdown && (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-forest">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{countdown}</span>
            {departureLabel && (
              <span className="font-normal text-muted-foreground">· {departureLabel}</span>
            )}
          </p>
        )}

        <HeroLead className={cn("mt-2 flex-1", horizontal ? "line-clamp-2 text-sm" : "line-clamp-3")}>
          {trip.description}
        </HeroLead>

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-border/50 pt-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">À partir de</p>
            <p className="font-display text-2xl font-bold text-forest">{formatPrice(trip.price)} DA</p>
          </div>
          {!full && (
            <p className="text-sm font-medium text-leaf">
              {remaining} place{remaining > 1 ? "s" : ""} dispo
            </p>
          )}
        </div>

        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-sand">
            <div
              className={cn("h-full rounded-full transition-all", tripAvailabilityBarColor(remaining, trip.capacity))}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>

        {trip.slug ? (
          <Link
            to="/r/$slug"
            params={{ slug: trip.slug }}
            className={cn(
              heroBtnClasses(full ? "outline" : "accent", { full: true, size: "md" }),
              "mt-6 py-3.5",
            )}
          >
            {full ? "Liste d'attente" : "Réserver"}
          </Link>
        ) : (
          <Link
            to="/reservation/$tripId"
            params={{ tripId: trip.id }}
            className={cn(
              heroBtnClasses(full ? "outline" : "accent", { full: true, size: "md" }),
              "mt-6 py-3.5",
            )}
          >
            {full ? "Liste d'attente" : "Réserver"}
          </Link>
        )}
      </div>
    </HeroCard>
  );
}
