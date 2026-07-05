import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useListPublishedDestinations } from "@/api";
import { HeroExperienceBadges, HeroLivingLayer } from "@/components/public/hero-living-layer";
import { heroItem, heroStagger } from "@/lib/motion";
import { offresSearchForUrl } from "@/lib/offres-search";
import {
  DURATION_FILTER_OPTIONS,
  EXPERIENCE_FILTER_OPTIONS,
  GUEST_FILTER_OPTIONS,
  PRICE_FILTER_OPTIONS,
  SORT_FILTER_OPTIONS,
} from "@/lib/offres-search";
import heroNatureVideo from "@/assets/Algerian nature 🌲🇩🇿 - zack ohm (1080p).mp4";
import { useEffect, useRef } from "react";

const EXPERIENCE_TYPES = EXPERIENCE_FILTER_OPTIONS.map((o) => ({
  value: o.value || "all",
  label: o.label,
}));

export function HeroSection() {
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const { data: destinations } = useListPublishedDestinations();

  const [destination, setDestination] = useState("all");
  const [experience, setExperience] = useState("all");
  const [duration, setDuration] = useState("all");
  const [priceMax, setPriceMax] = useState("all");
  const [sort, setSort] = useState("featured");
  const [guests, setGuests] = useState("2");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reduceMotion) {
      video.pause();
      return;
    }
    video.play().catch(() => {});
  }, [reduceMotion]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const guestCount = Math.min(20, Math.max(1, Number(guests) || 2));
    navigate({
      to: "/offres",
      search: offresSearchForUrl({
        destination: destination === "all" ? "" : destination,
        guests: guestCount,
        type: experience === "all" ? "" : experience,
        duration: duration === "all" ? "" : duration,
        priceMax: priceMax === "all" ? "" : priceMax,
        sort: sort === "featured" ? "" : sort,
      }),
    });
  };

  return (
    <section className="relative isolate -mt-16 flex min-h-[min(100dvh,900px)] flex-col overflow-hidden pt-16">
      <div className="absolute inset-0 bg-forest" aria-hidden>
        <video
          ref={videoRef}
          autoPlay={!reduceMotion}
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full scale-105 object-cover opacity-[0.42]"
        >
          <source src={heroNatureVideo} type="video/mp4" />
        </video>
      </div>
      <div
        className="absolute inset-0 bg-gradient-to-r from-forest/94 via-forest/78 to-forest/45"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-forest/90 via-transparent to-forest/20"
        aria-hidden
      />

      <HeroLivingLayer reduceMotion={reduceMotion} />

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-24 sm:px-10 md:px-14 lg:px-16 xl:px-20">
        <div className="mx-auto grid w-full max-w-full items-center gap-8 lg:w-fit lg:grid-cols-[auto_minmax(400px,460px)] lg:gap-10 xl:gap-12">
          <motion.div
            className="min-w-0"
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
            variants={heroStagger}
          >
            <motion.h1
              variants={heroItem}
              className="max-w-xl text-balance text-[clamp(1.875rem,3.5vw,3rem)] font-light leading-[1.12] tracking-tight text-white lg:max-w-2xl"
            >
              Respirez l&apos;Algérie,{" "}
              <span className="text-mint">vivez l&apos;aventure</span>
            </motion.h1>

            <motion.p
              variants={heroItem}
              className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-white/90 sm:text-lg"
            >
              Circuits authentiques et séjours à travers tout le pays — mer, montagne, désert et
              patrimoine.{" "}
              <span className="text-white/80">
                Réservez en ligne · places en direct · guides locaux passionnés.
              </span>
            </motion.p>

            <HeroExperienceBadges reduceMotion={reduceMotion} />
          </motion.div>

          <motion.div
            className="relative z-20 min-w-0"
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
            variants={heroStagger}
          >
            <motion.form
              variants={heroItem}
              onSubmit={handleSearch}
              className="relative w-full rounded-lg bg-white/95 p-6 shadow-elevated ring-1 ring-white/50 backdrop-blur-sm sm:p-8"
            >
              <p className="flex items-center gap-2.5 text-base font-semibold text-forest">
                <Search className="h-5 w-5" aria-hidden />
                Rechercher un circuit
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2.5 sm:col-span-2">
                  <Label htmlFor="hero-destination" className="text-sm font-medium">
                    Destination
                  </Label>
                  <Select value={destination} onValueChange={setDestination}>
                    <SelectTrigger id="hero-destination" className="h-11 bg-background text-base">
                      <SelectValue placeholder="Choisir une destination" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les destinations</SelectItem>
                      {(destinations ?? []).map((d) => (
                        <SelectItem key={d.id} value={d.slug}>
                          {d.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="hero-experience" className="text-sm font-medium">
                    Expérience
                  </Label>
                  <Select value={experience} onValueChange={setExperience}>
                    <SelectTrigger id="hero-experience" className="h-11 bg-background text-base">
                      <SelectValue placeholder="Type d'expérience" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="hero-duration" className="text-sm font-medium">
                    Durée
                  </Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger id="hero-duration" className="h-11 bg-background text-base">
                      <SelectValue placeholder="Toute durée" />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_FILTER_OPTIONS.map((t) => (
                        <SelectItem key={t.value || "all"} value={t.value || "all"}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="hero-budget" className="text-sm font-medium">
                    Budget max.
                  </Label>
                  <Select value={priceMax} onValueChange={setPriceMax}>
                    <SelectTrigger id="hero-budget" className="h-11 bg-background text-base">
                      <SelectValue placeholder="Tout budget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tout budget</SelectItem>
                      {PRICE_FILTER_OPTIONS.filter((p) => p.value).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="hero-guests" className="text-sm font-medium">
                    Voyageurs
                  </Label>
                  <Select value={guests} onValueChange={setGuests}>
                    <SelectTrigger id="hero-guests" className="h-11 bg-background text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GUEST_FILTER_OPTIONS.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} voyageur{n > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="hero-sort" className="text-sm font-medium">
                    Trier par
                  </Label>
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger id="hero-sort" className="h-11 bg-background text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_FILTER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" size="lg" className="mt-6 h-12 w-full text-base">
                Voir les circuits disponibles
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
