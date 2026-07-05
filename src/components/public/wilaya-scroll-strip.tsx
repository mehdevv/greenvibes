import { Link } from "@tanstack/react-router";
import { useReducedMotion } from "framer-motion";
import { MapPin } from "lucide-react";
import { WILAYAS, type Wilaya } from "@/lib/constants";
import { cn } from "@/lib/utils";

type WilayaScrollStripProps = {
  className?: string;
};

function WilayaItem({ wilaya }: { wilaya: Wilaya }) {
  return (
    <Link
      to="/destinations"
      className="group flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-100"
    >
      <MapPin
        className="h-4 w-4 shrink-0 text-leaf transition group-hover:text-forest"
        aria-hidden
      />
      <span className="whitespace-nowrap text-sm font-medium text-foreground">{wilaya.name}</span>
    </Link>
  );
}

export function WilayaScrollStrip({ className }: WilayaScrollStripProps) {
  const reduceMotion = useReducedMotion();
  const track = reduceMotion ? WILAYAS : [...WILAYAS, ...WILAYAS];

  return (
    <div aria-label="Wilayas" className={cn("relative z-10 bg-background", className)}>
      <div className="relative overflow-hidden py-4 sm:py-5">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent sm:w-12"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent sm:w-12"
          aria-hidden
        />

        <div
          className={cn(
            "flex w-max gap-7 px-8 sm:gap-9 sm:px-12",
            reduceMotion
              ? "min-w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              : "animate-wilaya-marquee",
          )}
        >
          {track.map((wilaya, index) => (
            <WilayaItem key={`${wilaya.slug}-${index}`} wilaya={wilaya} />
          ))}
        </div>
      </div>
    </div>
  );
}
