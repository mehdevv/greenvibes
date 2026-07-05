import { cn } from "@/lib/utils";

type Overlay = "light" | "mint" | "forest";

const overlayClasses: Record<Overlay, string> = {
  light: "bg-gradient-to-b from-background/92 via-background/85 to-background/95",
  mint: "bg-gradient-to-b from-mint/85 via-background/85 to-secondary/90",
  forest: "bg-gradient-to-b from-inverse/85 via-inverse/80 to-inverse/90",
};

export function SectionBackdrop({
  image,
  overlay = "light",
  className,
  imageClassName,
}: {
  image: string;
  overlay?: Overlay;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)} aria-hidden>
      <img
        src={image}
        alt=""
        loading="lazy"
        className={cn("h-full w-full object-cover", imageClassName)}
      />
      <div className={cn("absolute inset-0", overlayClasses[overlay])} />
    </div>
  );
}
