import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { Offer } from "@/api/types";
import { resolveCoverImage } from "@/lib/supabase";
import { PLACEHOLDER_IMAGES, formatPrice } from "@/lib/constants";
import { LoadingImage } from "@/components/ui/media-loader";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  mer: "Mer",
  montagne: "Montagne",
  culture: "Culture",
  aventure: "Aventure",
};

const NEW_TRIP_DAYS = 45;

function isNewOffer(createdAt: string): boolean {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs / (1000 * 60 * 60 * 24) <= NEW_TRIP_DAYS;
}

type TripCardProps = {
  offer: Offer;
  className?: string;
  accentIndex?: number;
  showNewBadge?: boolean;
};

export function TripCard({ offer, className, showNewBadge = false }: TripCardProps) {
  const isNew = showNewBadge && !offer.isFeatured && isNewOffer(offer.createdAt);

  return (
    <Link
      to="/offres/$slug"
      params={{ slug: offer.slug }}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift",
        className,
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted sm:aspect-square">
        <LoadingImage
          src={resolveCoverImage(offer.coverImage, PLACEHOLDER_IMAGES.gouraya)}
          alt={offer.title}
          containerClassName="h-full w-full"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          loaderLabel="Chargement de l'image…"
        />
        {offer.isFeatured && (
          <span className="absolute left-4 top-4 rounded-full bg-forest px-3 py-1 text-xs font-medium text-white">
            Coup de cœur
          </span>
        )}
        {isNew && (
          <span className="absolute left-4 top-4 rounded-full bg-leaf px-3 py-1 text-xs font-medium text-white">
            Nouveau
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-leaf">
            {TYPE_LABELS[offer.offerType] ?? offer.offerType} · {offer.durationLabel}
          </p>
          <h3 className="mt-1.5 font-display text-xl font-normal leading-snug text-foreground">
            {offer.title}
          </h3>
        </div>
        <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {offer.description}
        </p>
        <div className="flex items-end justify-between gap-3 border-t border-border pt-4">
          <div>
            <p className="text-xs text-muted-foreground">À partir de</p>
            <p className="font-display text-lg font-medium text-forest">
              {formatPrice(offer.priceDzd)}{" "}
              <span className="text-sm font-normal text-muted-foreground">DA</span>
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1.5 text-sm font-medium text-forest">
            Réserver
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
