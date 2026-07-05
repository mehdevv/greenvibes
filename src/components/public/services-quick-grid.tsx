import { Link } from "@tanstack/react-router";
import { CalendarCheck, MapPin, CreditCard, Headphones, ArrowRight } from "lucide-react";
import { SectionHeader } from "./section-header";
import { DEFAULT_OFFRES_SEARCH } from "@/lib/constants";
import { MotionSection, Reveal, Stagger, StaggerItem } from "@/components/motion";

const services = [
  {
    icon: CalendarCheck,
    title: "Réservation en ligne",
    desc: "Dates et places disponibles en temps réel, confirmation immédiate.",
    href: "/offres",
    search: DEFAULT_OFFRES_SEARCH,
  },
  {
    icon: MapPin,
    title: "Circuits guidés",
    desc: "Mer, montagne, culture et aventure avec guides locaux certifiés.",
    href: "/destinations",
  },
  {
    icon: CreditCard,
    title: "Paiement flexible",
    desc: "Confirmation de place rapide, règlement selon modalités claires.",
    href: "/#comment-ca-marche",
  },
  {
    icon: Headphones,
    title: "Accompagnement 7j/7",
    desc: "Une équipe joignable avant, pendant et après votre voyage.",
    href: "/contact",
  },
] as const;

export function ServicesQuickGrid() {
  return (
    <MotionSection id="services" className="bg-secondary py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeader
              eyebrow="Nos services"
              title="Tout ce qu'il faut pour voyager sereinement"
              description="Comme sur les grandes plateformes de voyage : découvrez l'Algérie, réservez et voyagez sereinement."
            />
            <a
              href="/#services-detail"
              className="inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:underline"
            >
              En savoir plus <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </Reveal>

        <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => {
            const Icon = s.icon;
            const content = (
              <article className="group flex h-full flex-col rounded-md border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated">
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-secondary text-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-base font-bold text-foreground">{s.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Découvrir <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </article>
            );

            return (
              <StaggerItem key={s.title}>
                {"search" in s ? (
                  <Link to={s.href} search={s.search} className="block h-full">
                    {content}
                  </Link>
                ) : s.href.startsWith("/#") ? (
                  <a href={s.href} className="block h-full">
                    {content}
                  </a>
                ) : (
                  <Link to={s.href} className="block h-full">
                    {content}
                  </Link>
                )}
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </MotionSection>
  );
}
