import { useState } from "react";
import type { Trip } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  copyTripShareLink,
  getTripSharePath,
  getTripShareUrl,
  normalizeTripSlug,
} from "@/lib/trip-slug";
import { cn } from "@/lib/utils";
import { Check, Copy, ExternalLink, Link2 } from "lucide-react";
import { toast } from "sonner";

type TripShareLinkProps = {
  trip: Pick<Trip, "id" | "slug" | "title">;
  slugValue?: string;
  onSlugChange?: (slug: string) => void;
  editable?: boolean;
  compact?: boolean;
  className?: string;
};

export function TripShareLink({
  trip,
  slugValue,
  onSlugChange,
  editable = false,
  compact = false,
  className,
}: TripShareLinkProps) {
  const [copied, setCopied] = useState(false);
  const previewTrip = {
    id: trip.id,
    slug: slugValue !== undefined ? normalizeTripSlug(slugValue) || null : trip.slug,
  };
  const shareUrl = getTripShareUrl(previewTrip);
  const sharePath = getTripSharePath(previewTrip);

  const handleCopy = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      await copyTripShareLink(previewTrip);
      setCopied(true);
      toast.success("Lien copié — prêt pour les réseaux sociaux !");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le lien.");
    }
  };

  if (compact) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("gap-1.5", className)}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleCopy}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        Copier le lien
      </Button>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border bg-secondary/30 p-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-forest" />
          <div>
            <p className="text-sm font-semibold text-foreground">Lien court pour les réseaux</p>
            <p className="text-xs text-muted-foreground">Partagez cette URL sur Instagram, WhatsApp, Facebook…</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" className="gap-1.5" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copié !" : "Copier le lien"}
          </Button>
          <Button type="button" size="sm" variant="outline" className="gap-1.5" asChild>
            <a href={sharePath} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Ouvrir
            </a>
          </Button>
        </div>
      </div>

      {editable && onSlugChange && (
        <div className="mt-4">
          <Label htmlFor={`trip-slug-${trip.id}`}>Lien personnalisé</Label>
          <div className="mt-1 flex items-center gap-2">
            <span className="shrink-0 text-sm text-muted-foreground">/r/</span>
            <Input
              id={`trip-slug-${trip.id}`}
              value={slugValue ?? trip.slug ?? ""}
              onChange={(e) => onSlugChange(normalizeTripSlug(e.target.value))}
              placeholder={normalizeTripSlug(trip.title) || "mon-voyage"}
              className="font-mono text-sm"
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Lettres minuscules, chiffres et tirets uniquement. Enregistrez pour appliquer.
          </p>
        </div>
      )}

      <div className="mt-3 rounded-lg border border-border/70 bg-background px-3 py-2">
        <p className="break-all font-mono text-sm text-forest">{shareUrl}</p>
      </div>
    </div>
  );
}
