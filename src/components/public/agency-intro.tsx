import { Link } from "@tanstack/react-router";
import { Leaf, Sparkles, Users } from "lucide-react";
import { PLACEHOLDER_IMAGES, DEFAULT_OFFRES_SEARCH } from "@/lib/constants";
import { MotionSection, Reveal, Stagger, StaggerItem } from "@/components/motion";

const vibes = [
  {
    icon: Sparkles,
    title: "Fun d'abord",
    desc: "On part pour se défouler, rire et créer des souvenirs — pas pour cocher des cases.",
  },
  {
    icon: Users,
    title: "Petits groupes",
    desc: "Ambiance conviviale, guides locaux, et une place pour chacun.",
  },
  {
    icon: Leaf,
    title: "Nature & vibes",
    desc: "Mer, montagne, sentiers — l'Algérie en mode escapade, depuis Béjaïa.",
  },
];

export function AgencyIntro() {
  return (
    <MotionSection className="relative overflow-hidden px-6 py-16 md:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklab,var(--mint)_80%,transparent),transparent_55%),radial-gradient(ellipse_at_bottom_left,color-mix(in_oklab,var(--sun)_25%,transparent),transparent_50%)]"
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal variant="fadeLeft">
          <div className="relative">
            <img
              src={PLACEHOLDER_IMAGES.team}
              alt="L'équipe GreenVibes"
              className="aspect-square w-full rounded-3xl object-cover shadow-elevated"
            />
            <div className="absolute -bottom-4 -right-2 rounded-2xl bg-forest px-5 py-3 text-sm font-semibold text-primary-foreground shadow-elevated sm:right-4">
              Basés à Béjaïa
            </div>
          </div>
        </Reveal>

        <Reveal variant="fadeRight" delay={0.08} className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-leaf">
            L&apos;agence
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-forest md:text-4xl">
            GreenVibes, c&apos;est simple :{" "}
            <span className="text-leaf">on sort, on kiffe.</span>
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Agence de sorties et d&apos;escapades en Algérie. On organise des expériences fun,
            accessibles et bien cadrées — vous choisissez la sortie, vous réservez en deux
            minutes, on s&apos;occupe du reste.
          </p>

          <Stagger className="grid gap-4 sm:grid-cols-3">
            {vibes.map((v) => (
              <StaggerItem key={v.title}>
                <div className="h-full">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-mint text-forest">
                    <v.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-display text-base font-semibold text-forest">
                    {v.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/offres"
              search={DEFAULT_OFFRES_SEARCH}
              className="inline-flex rounded-full bg-forest px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-leaf"
            >
              Voir les sorties
            </Link>
            <Link
              to="/a-propos"
              className="inline-flex rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-forest transition hover:border-leaf/40"
            >
              Qui on est
            </Link>
          </div>
        </Reveal>
      </div>
    </MotionSection>
  );
}
