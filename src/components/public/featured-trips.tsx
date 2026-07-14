import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Pause, Play } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { useListPublishedOffers } from "@/api";
import { TripCard } from "@/components/public/trip-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/motion";
import { DEFAULT_OFFRES_SEARCH } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function FeaturedTrips() {
  const { data: offers, isLoading } = useListPublishedOffers();
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [manual, setManual] = useState(false);

  const featured = (offers ?? [])
    .filter((o) => o.isFeatured)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const list =
    featured.length > 0
      ? featured
      : [...(offers ?? [])].sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 6);

  const loop = list.length > 0 ? [...list, ...list, ...list] : [];

  useEffect(() => {
    if (reduceMotion || manual || paused || list.length === 0) return;
    const el = trackRef.current;
    if (!el) return;

    let raf = 0;
    let last = performance.now();
    const speed = 0.035;

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      el.scrollLeft += speed * dt;
      const half = el.scrollWidth / 3;
      if (half > 0 && el.scrollLeft >= half * 2) {
        el.scrollLeft -= half;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion, manual, paused, list.length]);

  return (
    <section id="sorties" className="shopify-section scroll-mt-20 bg-secondary">
      <div className="shopify-container">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div className="max-w-2xl">
              <p className="shopify-eyebrow">Sorties du moment</p>
              <h2 className="shopify-display mt-3 text-3xl sm:text-4xl md:text-[2.75rem]">
                Choisissez votre prochaine aventure
              </h2>
              <p className="shopify-body mt-4">
                Parcourez nos escapades — mer, montagne, culture. Cliquez pour réserver en quelques
                clics.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setManual((m) => !m);
                  setPaused(false);
                }}
                className="btn-pill-outline text-sm"
                aria-pressed={manual}
              >
                {manual ? (
                  <Play className="h-3.5 w-3.5 text-forest" />
                ) : (
                  <Pause className="h-3.5 w-3.5" />
                )}
                {manual ? "Reprendre" : "Pause"}
              </button>
              <Link to="/offres" search={DEFAULT_OFFRES_SEARCH} className="btn-pill-primary text-sm">
                Toutes les sorties <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>

      {isLoading ? (
        <div className="shopify-container mt-12 flex gap-5 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[420px] w-[min(85vw,320px)] shrink-0 rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="shopify-container mt-12 text-center text-muted-foreground">
          Les prochaines sorties arrivent bientôt.
        </p>
      ) : (
        <div
          ref={trackRef}
          className="mt-12 flex gap-5 overflow-x-auto px-6 pb-4 md:px-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))]"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          {loop.map((offer, i) => (
            <div
              key={`${offer.id}-${i}`}
              className="w-[min(85vw,300px)] shrink-0 sm:w-[320px]"
            >
              <TripCard offer={offer} accentIndex={i} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
