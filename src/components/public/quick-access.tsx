import { Link } from "@tanstack/react-router";
import {
  MapPin,
  Compass,
  CalendarCheck,
  Camera,
  BookOpen,
  MessageCircle,
} from "lucide-react";
import { DEFAULT_OFFRES_SEARCH } from "@/lib/constants";
import { cn } from "@/lib/utils";

const items = [
  {
    label: "Destinations",
    icon: MapPin,
    to: "/destinations" as const,
  },
  {
    label: "Circuits",
    icon: Compass,
    to: "/offres" as const,
    search: DEFAULT_OFFRES_SEARCH,
  },
  {
    label: "Réserver",
    icon: CalendarCheck,
    to: "/offres" as const,
    search: DEFAULT_OFFRES_SEARCH,
  },
  {
    label: "Contact",
    icon: MessageCircle,
    to: "/contact" as const,
  },
  {
    label: "Galerie",
    icon: Camera,
    to: "/galerie" as const,
  },
  {
    label: "Blog",
    icon: BookOpen,
    to: "/blog" as const,
  },
] as const;

type QuickAccessBarProps = {
  className?: string;
  variant?: "default" | "hero";
};

export function QuickAccessBar({ className, variant = "default" }: QuickAccessBarProps) {
  const isHero = variant === "hero";

  return (
    <section
      aria-label="Accès rapide"
      className={cn(
        isHero
          ? "mx-4 mb-4 rounded-2xl border border-white/12 bg-forest/35 px-4 py-3 backdrop-blur-xl sm:mx-6 sm:mb-5"
          : "border-b border-border bg-card/80 backdrop-blur-sm",
        className,
      )}
    >
      <div className={cn("mx-auto max-w-7xl", !isHero && "px-4 py-4 sm:px-6")}>
        <div
          className={cn(
            "flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            isHero && "justify-start sm:justify-center",
          )}
        >
          {items.map((item) => {
            const Icon = item.icon;

            const cardClass = cn(
              "group flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 transition",
              isHero
                ? "min-w-0 border-white/12 bg-white/8 text-white hover:border-white/25 hover:bg-white/14"
                : "min-w-[140px] border-border bg-background hover:border-leaf/50 hover:shadow-soft sm:min-w-[152px] sm:gap-3 sm:py-2.5",
            );

            const inner = (
              <>
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] transition",
                    isHero
                      ? "bg-white/12 text-white group-hover:bg-white group-hover:text-forest"
                      : "rounded-xl bg-mint text-forest group-hover:bg-forest group-hover:text-primary-foreground sm:h-10 sm:w-10",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </span>
                <span
                  className={cn(
                    "whitespace-nowrap text-sm font-semibold",
                    isHero ? "text-white" : "text-forest",
                  )}
                >
                  {item.label}
                </span>
              </>
            );

            return (
              <Link
                key={item.label}
                to={item.to}
                {...("search" in item && item.search ? { search: item.search } : {})}
                className={cardClass}
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
