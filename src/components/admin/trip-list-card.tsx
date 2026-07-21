import { Link } from "@tanstack/react-router";
import type { Trip } from "@/api/types";
import { TripShareLink } from "@/components/admin/trip-share-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  tripAvailabilityBarColor,
  tripAvailabilityLabel,
  tripSpotsRemaining,
} from "@/lib/availability";
import { formatPrice } from "@/lib/constants";
import { formatDepartureDate } from "@/lib/trip-dates";
import { getTripSharePath } from "@/lib/trip-slug";
import { cn } from "@/lib/utils";
import {
  Calendar,
  ChevronRight,
  ExternalLink,
  MapPin,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

type TripListCardProps = {
  trip: Trip;
  reservationCount: number;
  tripDetailPath: string;
  canInscribe: boolean;
  canDelete: boolean;
  onInscribe: () => void;
  onDelete: (e: React.MouseEvent) => void;
};

export function TripListCard({
  trip,
  reservationCount,
  tripDetailPath,
  canInscribe,
  canDelete,
  onInscribe,
  onDelete,
}: TripListCardProps) {
  const remaining = tripSpotsRemaining(trip.capacity, trip.spotsTaken);
  const fillPercent =
    trip.capacity > 0 ? Math.min(100, Math.round((trip.spotsTaken / trip.capacity) * 100)) : 0;
  const full = remaining <= 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card transition hover:border-forest/20 hover:shadow-sm">
      <Link
        to={tripDetailPath}
        params={{ tripId: trip.id }}
        className="flex gap-4 p-4 sm:p-5"
      >
        {trip.photoUrl ? (
          <img
            src={trip.photoUrl}
            alt=""
            className="h-20 w-20 shrink-0 rounded-xl object-cover sm:h-24 sm:w-24"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-secondary text-xs text-muted-foreground sm:h-24 sm:w-24">
            Aucune image
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground line-clamp-2 sm:text-lg">{trip.title}</h3>
              {trip.slug && (
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">/r/{trip.slug}</p>
              )}
            </div>
            <ChevronRight className="hidden h-5 w-5 shrink-0 text-muted-foreground sm:block" />
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant={trip.archived ? "outline" : trip.active ? "default" : "secondary"}>
              {trip.archived ? "Archivée" : trip.active ? "Active" : "Inactive"}
            </Badge>
            {full && <Badge variant="destructive">Complet</Badge>}
            {!full && remaining <= Math.max(2, Math.floor(trip.capacity * 0.25)) && (
              <Badge variant="outline" className="border-amber-300 text-amber-800">
                Presque complet
              </Badge>
            )}
          </div>

          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium text-foreground">{formatPrice(trip.price)} DA</span>
              <span>· {trip.duration || "Durée —"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {trip.departureDate ? formatDepartureDate(trip) ?? trip.departureDate : "Date à définir"}
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground line-clamp-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {trip.meetingPoint || "Rendez-vous —"}
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-3.5 w-3.5 shrink-0" />
              {reservationCount} réservation{reservationCount !== 1 ? "s" : ""}
            </div>
          </dl>

          <div className="mt-4 max-w-md">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">
                {trip.spotsTaken}/{trip.capacity} places
              </span>
              <span className="text-muted-foreground">{tripAvailabilityLabel(remaining, trip.capacity)}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn("h-full rounded-full transition-all", tripAvailabilityBarColor(remaining, trip.capacity))}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>
        </div>
      </Link>

      <div className="flex flex-wrap items-center gap-2 border-t border-border bg-secondary/20 px-4 py-3 sm:px-5">
        <Button asChild variant="default" size="sm" className="h-9 gap-1.5">
          <Link to={tripDetailPath} params={{ tripId: trip.id }}>
            Gérer
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
        {canInscribe && (
          <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5" onClick={onInscribe}>
            <UserPlus className="h-4 w-4" />
            Inscrire
          </Button>
        )}
        <TripShareLink trip={trip} compact className="h-9" />
        <Button asChild variant="ghost" size="sm" className="h-9 gap-1.5">
          <a href={getTripSharePath(trip)} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Page publique
          </a>
        </Button>
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto h-9 gap-1.5 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
        )}
      </div>
    </article>
  );
}
