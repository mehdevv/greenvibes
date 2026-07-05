import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/public-layout";
import { PLACEHOLDER_IMAGES, DEFAULT_OFFRES_SEARCH, FLOATING_NAV_OFFSET } from "@/lib/constants";
import { Star } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/a-propos")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <PublicLayout>
      <div className={cn("mx-auto max-w-7xl px-6 pb-16", FLOATING_NAV_OFFSET)}>
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-widest text-leaf">À propos</span>
          <h1 className="mt-3 font-display text-4xl font-light text-forest md:text-5xl">
            Locaux, passionnés, <span className=" font-normal">responsables</span>.
          </h1>
        </Reveal>

        <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal variant="fadeLeft">
            <img
              src={PLACEHOLDER_IMAGES.team}
              alt="L'équipe GreenVibes"
              className="w-full rounded-lg object-cover shadow-elevated"
            />
          </Reveal>
          <Reveal variant="fadeRight" delay={0.1} className="space-y-5 text-muted-foreground leading-relaxed">
            <p>
              Basés à Béjaïa, nous avons créé GreenVibes pour faire découvrir l&apos;Algérie autrement : un
              tourisme lent, respectueux et profondément humain. Chaque circuit soutient des producteurs,
              artisans et guides locaux, où que vous voyagiez dans le pays.
            </p>
            <p>
              Notre équipe de guides certifiés accompagne vos escapades à travers l&apos;Algérie — côte,
              montagne, sud et villes historiques. Nous adaptons chaque départ à la taille et aux besoins
              de votre groupe.
            </p>
          </Reveal>
        </div>

        <Stagger className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            ["Tourisme durable", "Partenaires locaux, faible empreinte."],
            ["Groupes flexibles", "Particuliers, familles ou grands groupes."],
            ["Guides certifiés", "Experts du terrain, partout en Algérie."],
            ["Support 7j/7", "Disponibles avant, pendant, après."],
          ].map(([title, desc]) => (
            <StaggerItem key={title}>
              <div className="h-full rounded-md border border-border bg-card p-6">
                <div className="font-display font-bold text-forest">{title}</div>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal className="mt-16 rounded-lg bg-secondary p-8 md:p-12" delay={0.1}>
          <div className="flex items-center gap-1 text-sun">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-current" />
            ))}
          </div>
          <blockquote className="mt-4 max-w-2xl font-display text-xl font-medium text-forest">
            &ldquo;Une équipe passionnée qui fait découvrir l&apos;Algérie autrement.&rdquo;
          </blockquote>
          <p className="mt-2 text-sm text-muted-foreground">Yasmine · Voyageuse, Alger</p>
        </Reveal>

        <Reveal className="mt-12 text-center" delay={0.15}>
          <Link
            to="/offres"
            search={DEFAULT_OFFRES_SEARCH}
            className="inline-flex rounded-[4px] bg-forest px-8 py-4 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
          >
            Réserver votre prochaine aventure
          </Link>
        </Reveal>
      </div>
    </PublicLayout>
  );
}
