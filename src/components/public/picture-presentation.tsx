import { Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Users, Sparkles, Mountain, Waves } from "lucide-react";
import { LOCAL_GALLERY_PHOTOS } from "@/lib/gallery-assets";
import { PLACEHOLDER_IMAGES, DEFAULT_OFFRES_SEARCH } from "@/lib/constants";
import { MotionSection, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { cn } from "@/lib/utils";

const services = [
  {
    n: "01",
    icon: Users,
    title: "Sorties organisées",
    desc: "Ouvertes à tous — ambiance conviviale pour découvrir l'Algérie autrement.",
    image: PLACEHOLDER_IMAGES.tichy,
  },
  {
    n: "02",
    icon: Sparkles,
    title: "Groupes & team building",
    desc: "Entreprises, clubs, amis — une sortie exclusive cadrée pour votre équipe.",
    image: PLACEHOLDER_IMAGES.team,
  },
  {
    n: "03",
    icon: Mountain,
    title: "Nature & aventure",
    desc: "Sentiers, gorges et panoramas — on bouge, on respire, on kiffe.",
    image: PLACEHOLDER_IMAGES.kherrata,
  },
];

const vibes = [
  { label: "Mer", image: PLACEHOLDER_IMAGES.tichy, icon: Waves },
  { label: "Montagne", image: PLACEHOLDER_IMAGES.gouraya, icon: Mountain },
  { label: "Aventure", image: PLACEHOLDER_IMAGES.kherrata, icon: Sparkles },
  { label: "Corniche", image: PLACEHOLDER_IMAGES.corniche, icon: Users },
];

function StickyServiceCard({
  service,
  index,
}: {
  service: (typeof services)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const scale = useTransform(scrollYProgress, [0, 0.4, 1], [0.96, 1, 0.98]);

  return (
    <div
      ref={ref}
      className="sticky top-24"
      style={{ zIndex: index + 1, top: `${5.5 + index * 0.75}rem` }}
    >
      <motion.article
        style={{ y, scale }}
        className="overflow-hidden rounded-3xl bg-card shadow-elevated"
      >
        <div className="relative aspect-[16/9] overflow-hidden md:aspect-[21/9]">
          <img src={service.image} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--dark)]/85 via-[var(--dark)]/30 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
            <span className="text-sm font-medium text-leaf">{service.n}</span>
            <div className="mt-2 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                <service.icon className="h-5 w-5 text-white" />
              </span>
              <h3 className="font-display text-2xl font-normal text-white md:text-3xl">
                {service.title}
              </h3>
            </div>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85 md:text-base">
              {service.desc}
            </p>
          </div>
        </div>
      </motion.article>
    </div>
  );
}

export function PicturePresentation() {
  const reduceMotion = useReducedMotion();
  const [focus, setFocus] = useState(0);
  const [vibeFocus, setVibeFocus] = useState(0);

  const pics = LOCAL_GALLERY_PHOTOS.map((p) => ({ src: p.src, title: p.title }));

  useEffect(() => {
    if (reduceMotion || pics.length === 0) return;
    const id = window.setInterval(() => {
      setFocus((f) => (f + 1) % pics.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [reduceMotion, pics.length]);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setVibeFocus((f) => (f + 1) % vibes.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <>
      <section id="services" className="shopify-section bg-background">
        <div className="shopify-container">
          <Reveal>
            <p className="shopify-eyebrow">Nos services</p>
            <h2 className="shopify-display mt-3 text-3xl sm:text-4xl">
              Des expériences pour chaque envie
            </h2>
            <p className="shopify-body mt-4 max-w-2xl">
              Sorties ouvertes, groupes privés ou aventure en pleine nature — on s&apos;adapte à
              vous.
            </p>
          </Reveal>

          <div className="relative mt-12 space-y-6 pb-[20vh]">
            {services.map((s, i) => (
              <StickyServiceCard key={s.n} service={s} index={i} />
            ))}
          </div>
        </div>
      </section>

      <MotionSection className="shopify-section bg-secondary">
        <div className="shopify-container">
          <Reveal>
            <p className="shopify-eyebrow">Ambiances</p>
            <h2 className="shopify-display mt-3 text-3xl sm:text-4xl">
              Trouvez votre vibe
            </h2>
          </Reveal>
          <Stagger className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
            {vibes.map((v, i) => {
              const active = vibeFocus === i;
              return (
                <StaggerItem key={v.label}>
                  <Link
                    to="/offres"
                    search={DEFAULT_OFFRES_SEARCH}
                    className={cn(
                      "group relative block overflow-hidden rounded-2xl transition duration-500",
                      active ? "shadow-lift ring-2 ring-forest/30" : "shadow-soft opacity-90",
                    )}
                    onMouseEnter={() => setVibeFocus(i)}
                  >
                    <img
                      src={v.image}
                      alt={v.label}
                      className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                    <div
                      className={cn(
                        "absolute inset-0 transition duration-500",
                        active ? "bg-forest/25" : "bg-[var(--dark)]/40",
                      )}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                        <v.icon className="h-5 w-5" />
                      </span>
                      <span className="font-display text-base font-normal md:text-lg">
                        {v.label}
                      </span>
                    </div>
                  </Link>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </MotionSection>

      <MotionSection id="moments" className="shopify-section bg-background">
        <div className="shopify-container">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-8">
              <div className="max-w-2xl">
                <p className="shopify-eyebrow">En images</p>
                <h2 className="shopify-display mt-3 text-3xl sm:text-4xl">
                  Moments capturés sur nos sorties
                </h2>
                <p className="shopify-body mt-4">
                  Un aperçu de l&apos;ambiance GreenVibes — nature, sourires et découvertes.
                </p>
              </div>
              <Link
                to="/galerie"
                className="btn-pill-outline text-sm"
              >
                Toute la galerie <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>

          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
            {pics.map((p, i) => {
              const active = focus === i;
              return (
                <figure
                  key={`${p.title}-${i}`}
                  className={cn(
                    "relative overflow-hidden rounded-2xl bg-card transition duration-500",
                    active ? "z-10 shadow-lift ring-2 ring-forest/20" : "shadow-soft",
                  )}
                  onMouseEnter={() => setFocus(i)}
                >
                  <img
                    src={p.src}
                    alt={p.title}
                    className="aspect-square w-full object-cover transition duration-500"
                  />
                  <figcaption
                    className={cn(
                      "absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-[var(--dark)]/75 to-transparent p-4 text-sm font-medium text-white transition",
                      active ? "opacity-100" : "opacity-80",
                    )}
                  >
                    {p.title}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </MotionSection>
    </>
  );
}
