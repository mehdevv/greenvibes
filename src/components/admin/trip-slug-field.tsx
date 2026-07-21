import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getSiteOrigin,
  getTripSharePath,
  normalizeTripSlug,
  validateTripSlug,
} from "@/lib/trip-slug";
import { cn } from "@/lib/utils";
import { Link2 } from "lucide-react";

type TripSlugFieldProps = {
  id?: string;
  value: string;
  onChange: (slug: string) => void;
  title: string;
  tripId?: string | null;
  className?: string;
};

export function TripSlugField({
  id = "trip-slug",
  value,
  onChange,
  title,
  tripId,
  className,
}: TripSlugFieldProps) {
  const normalized = normalizeTripSlug(value);
  const validationError = value.trim() ? validateTripSlug(value) : null;
  const previewPath = getTripSharePath({
    id: tripId ?? "preview",
    slug: normalized || null,
  });
  const previewUrl = `${getSiteOrigin()}${previewPath}`;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 shrink-0 text-forest" />
        <Label htmlFor={id}>Lien court (slug)</Label>
      </div>
      <div className="flex items-stretch overflow-hidden rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <span className="flex shrink-0 items-center border-r border-input bg-muted/60 px-3 text-sm text-muted-foreground">
          /r/
        </span>
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(normalizeTripSlug(e.target.value))}
          placeholder={normalizeTripSlug(title) || "mon-voyage"}
          className="border-0 font-mono text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-invalid={Boolean(validationError)}
        />
      </div>
      {validationError ? (
        <p className="text-xs text-destructive">{validationError}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Lettres minuscules, chiffres et tirets. Utilisé pour le lien de réservation public.
        </p>
      )}
      {normalized && !validationError && (
        <p className="break-all rounded-lg border border-border/70 bg-secondary/30 px-3 py-2 font-mono text-xs text-forest">
          {previewUrl}
        </p>
      )}
    </div>
  );
}
