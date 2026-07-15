import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  CreditCard,
  Headphones,
  MapPin,
  Mountain,
  Waves,
  Camera,
  Compass,
  Leaf,
  Users,
  Clock,
  ShieldCheck,
  Star,
  ChevronDown,
} from "lucide-react";
import { useListPublishedPosts, useListGalleryItems } from "@/api";
import { SectionHeader } from "./section-header";
import {
  DEFAULT_OFFRES_SEARCH,
  FLOATING_NAV_STICKY,
  PLACEHOLDER_IMAGES,
} from "@/lib/constants";
import { resolveCoverImage } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { easeOut } from "@/lib/motion";
import { MotionSection, Reveal, SectionBackdrop, Stagger, StaggerItem } from "@/components/motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import reservationDisponibilite from "@/assets/reservation-disponibilite.png";
import circuitsGuide from "@/assets/circuits-guide.png";
import paiementSecurise from "@/assets/paiement-securise.png";
import accompagnement from "@/assets/accompagnement.png";
import { LoadingImage } from "@/components/ui/media-loader";

const experiences = [
  {
    icon: Waves,
    title: "Mer & criques",
    desc: "Côtes méditerranéennes, plages secrètes et snorkeling en petit groupe.",
    image: PLACEHOLDER_IMAGES.tichy,
    filter: "mer",
  },
  {
    icon: Mountain,
    title: "Montagne & sentiers",
    desc: "Randonnées panoramiques, sommets et forêts — de l'Atlas au Tell.",
    image: PLACEHOLDER_IMAGES.gouraya,
    filter: "montagne",
  },
  {
    icon: Compass,
    title: "Aventure",
    desc: "Gorges, canyons et sensations pour les curieux, partout en Algérie.",
    image: PLACEHOLDER_IMAGES.kherrata,
    filter: "aventure",
  },
  {
    icon: Camera,
    title: "Culture & authenticité",
    desc: "Patrimoine, artisanat local et rencontres humaines authentiques.",
    image: PLACEHOLDER_IMAGES.corniche,
    filter: "culture",
  },
];

const bookingSteps = [
  {
    step: "01",
    title: "Choisissez votre circuit",
    desc: "Parcourez nos offres : journée, week-end ou séjour. Filtrez par type, durée et budget.",
    link: { to: "/offres" as const, search: DEFAULT_OFFRES_SEARCH },
    linkLabel: "Voir les offres",
  },
  {
    step: "02",
    title: "Vérifiez les disponibilités",
    desc: "Calendrier en temps réel avec places restantes. Vert, orange ou complet — tout est transparent.",
    link: { to: "/offres" as const, search: DEFAULT_OFFRES_SEARCH },
    linkLabel: "Voir les offres",
  },
  {
    step: "03",
    title: "Confirmez vos informations",
    desc: "Nom, contact, nombre de participants et demandes spéciales. Confirmation en moins de 2 minutes.",
    link: { to: "/offres" as const, search: DEFAULT_OFFRES_SEARCH },
    linkLabel: "Commencer",
  },
  {
    step: "04",
    title: "Recevez votre référence",
    desc: "Numéro de dossier unique GV-… et récapitulatif par email. Notre équipe reste joignable 7j/7.",
    link: { to: "/contact" as const },
    linkLabel: "Nous contacter",
  },
];

const serviceBlocks = [
  {
    icon: CalendarCheck,
    image: reservationDisponibilite,
    title: "Réservation & disponibilités",
    subtitle: "Temps réel",
    points: [
      "Calendrier des départs mis à jour en direct",
      "Compteur de places par session",
      "Blocage instantané à la confirmation",
      "Liste d'attente (bientôt)",
    ],
  },
  {
    icon: MapPin,
    image: circuitsGuide,
    title: "Circuits & guides",
    subtitle: "100 % locaux",
    points: [
      "Itinéraires conçus par des guides locaux",
      "Guides certifiés et francophones",
      "Groupes adaptés à chaque circuit",
      "Programmes téléchargeables",
    ],
  },
  {
    icon: CreditCard,
    image: paiementSecurise,
    title: "Paiement sécurisé",
    subtitle: "Algérie",
    points: [
      "Chargily, CIB, eDahabia (à venir)",
      "Acompte ou paiement sur place",
      "Facture et reçu par email",
      "Annulation selon conditions",
    ],
  },
  {
    icon: Headphones,
    image: accompagnement,
    title: "Accompagnement",
    subtitle: "Avant & après",
    points: [
      "Support WhatsApp et téléphone",
      "Conseils météo et équipement",
      "Assistance le jour du départ",
      "Enquête satisfaction post-voyage",
    ],
  },
];

const testimonials = [
  {
    name: "Yasmine B.",
    city: "Alger",
    text: "Une équipe passionnée — notre circuit côtier en Algérie était magique.",
    rating: 5,
  },
  {
    name: "Karim M.",
    city: "Constantine",
    text: "Réservation simple, guide excellent, petit groupe — exactement ce qu'on cherchait pour un week-end.",
    rating: 5,
  },
  {
    name: "Sophie L.",
    city: "Lyon",
    text: "Première fois en Algérie et GreenVibes nous a fait découvrir le pays autrement. Inoubliable.",
    rating: 5,
  },
];

const values = [
  { icon: Leaf, title: "Tourisme durable", desc: "Partenaires locaux, faible empreinte, respect des sites." },
  { icon: Users, title: "Groupes flexibles", desc: "Particuliers, familles ou grands groupes — nous adaptons chaque départ." },
  { icon: ShieldCheck, title: "Sécurité", desc: "Guides formés, véhicules contrôlés, assurance incluse." },
  { icon: Clock, title: "Réactivité", desc: "Confirmation rapide et équipe disponible 7j/7." },
];

const faqs = [
  {
    q: "Comment réserver un circuit ?",
    a: "Choisissez une offre, sélectionnez une date disponible sur le calendrier, remplissez le formulaire et confirmez. Vous recevez immédiatement un numéro de référence.",
  },
  {
    q: "Puis-je annuler ma réservation ?",
    a: "Oui, selon nos conditions générales. Contactez-nous au moins 48h avant le départ pour toute modification ou annulation.",
  },
  {
    q: "Quelle est la taille des groupes ?",
    a: "La taille du groupe dépend du circuit et de la date choisie. Les places disponibles sont indiquées en direct lors de la réservation.",
  },
  {
    q: "Les circuits sont-ils adaptés aux familles ?",
    a: "De nombreux itinéraires conviennent aux familles. Précisez l'âge des enfants lors de la réservation pour un conseil personnalisé.",
  },
  {
    q: "Comment payer ?",
    a: "Le paiement en ligne via Chargily, CIB et eDahabia arrive bientôt. En attendant, nous confirmons votre place et le règlement se fait selon les modalités indiquées à la réservation.",
  },
];

export function ExperienceCategories() {
  return (
    <MotionSection className="border-y border-border bg-card py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Expériences"
          title={
            <>
              Quatre façons de vivre l&apos;<span className=" font-normal">Algérie</span>
            </>
          }
          description="Mer, sommets, gorges ou patrimoine — composez votre évasion où que vous alliez en Algérie."
        />
        <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {experiences.map((exp) => (
            <StaggerItem key={exp.title}>
              <Link
                to="/offres"
                search={{ ...DEFAULT_OFFRES_SEARCH, type: exp.filter }}
                className="group relative block overflow-hidden rounded-md border border-border bg-background shadow-soft transition hover:shadow-elevated"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <LoadingImage
                    src={exp.image}
                    alt=""
                    containerClassName="h-full w-full"
                    className="object-cover transition duration-500 group-hover:scale-105"
                    loaderLabel="Chargement…"
                  />
                </div>
                <div className="p-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-mint text-forest">
                    <exp.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-forest">{exp.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{exp.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-leaf">
                    Explorer <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </MotionSection>
  );
}

function BookingStepCard({
  item,
  index,
}: {
  item: (typeof bookingSteps)[number];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40, y: 24 }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ ...easeOut, delay: index * 0.1 }}
      className={cn(
        "group relative flex gap-5 rounded-md border border-border bg-card p-6 shadow-soft transition-colors",
        "hover:border-leaf/40 hover:shadow-elevated",
        index === 1 && "lg:ml-6",
        index === 2 && "lg:ml-12",
        index === 3 && "lg:ml-[4.5rem]",
      )}
    >
      <span className="font-display text-3xl font-light text-mint">{item.step}</span>
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-lg font-bold text-forest">{item.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
        <Link
          to={item.link.to}
          {...("search" in item.link ? { search: item.link.search } : {})}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-leaf transition group-hover:gap-2 hover:text-forest"
        >
          {item.linkLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="relative py-20 md:py-28">
      <SectionBackdrop image={PLACEHOLDER_IMAGES.gouraya} overlay="light" imageClassName="object-top" />
      <div className="relative mx-auto grid max-w-7xl items-start gap-12 px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-20">
        <div className={cn("z-10 self-start py-4 lg:sticky", FLOATING_NAV_STICKY)}>
          <SectionHeader
            eyebrow="Réservation"
            title="Réservez en 4 étapes simples"
            description="De l'inspiration à la confirmation, tout est pensé pour vous faire gagner du temps — sans surprise sur les places disponibles."
          />
        </div>

        <div className="relative flex flex-col gap-6 lg:gap-10 lg:pb-32 lg:pt-4">
          <div
            className="pointer-events-none absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-leaf/50 via-leaf/20 to-transparent lg:block"
            aria-hidden
          />
          {bookingSteps.map((item, i) => (
            <BookingStepCard key={item.step} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ServicesDetailed() {
  return (
    <MotionSection id="services-detail" className="bg-secondary py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Fonctionnalités"
          title="Tout ce dont vous avez besoin, au même endroit"
          description="Réservation, circuits, paiement et accompagnement — une plateforme complète pour préparer votre voyage sereinement."
          align="center"
          className="mx-auto"
        />

        <Stagger className="mt-16 grid gap-6 md:grid-cols-2">
          {serviceBlocks.map((block) => (
            <StaggerItem key={block.title}>
              <article className="group flex h-full flex-col overflow-hidden rounded-md border border-border bg-card shadow-soft transition hover:shadow-elevated sm:flex-row">
                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-mint text-forest">
                      <block.icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-display text-xl font-bold text-forest">{block.title}</h3>
                  </div>
                  <ul className="mt-5 space-y-3">
                    {block.points.map((point) => (
                      <li key={point} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-mint/30 via-secondary to-sand/50 px-4 py-6 sm:w-[42%] sm:px-5 sm:py-8">
                  <span className="absolute right-4 top-4 rounded-[4px] bg-card/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-forest shadow-sm backdrop-blur">
                    {block.subtitle}
                  </span>
                  <LoadingImage
                    src={block.image}
                    alt={block.title}
                    loading="lazy"
                    containerClassName="h-full w-full"
                    className="max-h-44 object-contain transition duration-500 group-hover:scale-[1.02] sm:max-h-56"
                    loaderLabel="Chargement…"
                  />
                </div>
              </article>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal className="mt-12 flex flex-wrap justify-center gap-3" delay={0.1}>
          <Link
            to="/offres"
            search={DEFAULT_OFFRES_SEARCH}
            className="inline-flex items-center gap-2 rounded-[4px] bg-forest px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-95"
          >
            Voir les offres & réserver <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-[4px] border border-border bg-card px-6 py-3.5 text-sm font-semibold text-forest transition hover:bg-mint/30"
          >
            Poser une question
          </Link>
        </Reveal>
      </div>
    </MotionSection>
  );
}

export function TestimonialsSection() {
  return (
    <MotionSection className="relative overflow-hidden py-20 md:py-24">
      <SectionBackdrop image={PLACEHOLDER_IMAGES.corniche} overlay="light" />
      <div className="relative mx-auto max-w-7xl px-6">
      <SectionHeader
        eyebrow="Avis voyageurs"
        title="Ils ont découvert l'Algérie avec nous"
        align="center"
        className="mx-auto"
      />
      <Stagger className="mt-14 grid gap-6 md:grid-cols-3">
        {testimonials.map((t) => (
          <StaggerItem key={t.name}>
            <blockquote className="flex h-full flex-col rounded-md border border-border bg-card p-7 shadow-soft">
            <div className="flex gap-0.5 text-sun">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
              &ldquo;{t.text}&rdquo;
            </p>
            <footer className="mt-6 border-t border-border pt-4">
              <div className="font-semibold text-forest">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.city}</div>
            </footer>
            </blockquote>
          </StaggerItem>
        ))}
      </Stagger>
      </div>
    </MotionSection>
  );
}

export function ValuesSection() {
  return (
    <MotionSection className="border-t border-border bg-mint/30 py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Nos engagements"
          title="Voyager autrement, voyager responsable"
          description="GreenVibes, c'est une promesse : faire découvrir l'Algérie tout en la protégeant."
          align="center"
          className="mx-auto"
        />
        <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <StaggerItem key={v.title}>
              <div className="rounded-md border border-border/60 bg-card/80 p-6 text-center backdrop-blur">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-mint text-forest">
                <v.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display font-bold text-forest">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </MotionSection>
  );
}

export function GalleryPreview() {
  const { data: items } = useListGalleryItems();
  const preview = (items ?? []).slice(0, 5);
  const fallback = [
    { id: "1", title: "Baie", storagePath: PLACEHOLDER_IMAGES.hero },
    { id: "2", title: "Gouraya", storagePath: PLACEHOLDER_IMAGES.gouraya },
    { id: "3", title: "Tichy", storagePath: PLACEHOLDER_IMAGES.tichy },
    { id: "4", title: "Montagne", storagePath: PLACEHOLDER_IMAGES.kherrata },
    { id: "5", title: "Équipe", storagePath: PLACEHOLDER_IMAGES.team },
  ];
  const slides = preview.length >= 3 ? preview : fallback;

  return (
    <MotionSection className="bg-forest py-20 text-primary-foreground md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-mint">Galerie</span>
            <h2 className="mt-3 font-display text-3xl font-light text-primary-foreground md:text-4xl">
              L&apos;Algérie en images
            </h2>
          </div>
          <Link
            to="/galerie"
            className="inline-flex items-center gap-2 rounded-[4px] border border-primary-foreground/30 px-5 py-2.5 text-sm font-semibold transition hover:bg-primary-foreground/10"
          >
            Voir toute la galerie <ArrowRight className="h-4 w-4" />
          </Link>
          </div>
        </Reveal>
        <Stagger className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2 md:gap-4">
          {slides.slice(0, 5).map((item, i) => (
            <StaggerItem
              key={item.id}
              className={cn(
                i === 0 && "col-span-2 row-span-2",
              )}
            >
              <Link
                to="/galerie"
                className={cn(
                  "group relative block overflow-hidden rounded-md md:rounded-md",
                  i === 0 && "aspect-square md:aspect-auto md:min-h-[280px]",
                  i > 0 && "aspect-[4/3]",
                )}
              >
              <LoadingImage
                src={resolveCoverImage(item.storagePath, PLACEHOLDER_IMAGES.hero)}
                alt={item.title}
                containerClassName="h-full w-full"
                className="object-cover transition duration-500 group-hover:scale-105"
                loaderLabel="Chargement…"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/70 to-transparent opacity-0 transition group-hover:opacity-100" />
              <span className="absolute bottom-3 left-3 text-sm font-medium opacity-0 transition group-hover:opacity-100">
                {item.title}
              </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </MotionSection>
  );
}

export function BlogPreview() {
  const { data: posts } = useListPublishedPosts();
  const list = (posts ?? []).slice(0, 3);

  if (list.length === 0) return null;

  return (
    <MotionSection className="mx-auto max-w-7xl px-6 py-20 md:py-24">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeader eyebrow="Blog" title="Actualités & inspirations" />
          <Link to="/blog" className="text-sm font-semibold text-forest hover:underline">
            Tous les articles →
          </Link>
        </div>
      </Reveal>
      <Stagger className="mt-10 grid gap-6 md:grid-cols-3">
        {list.map((post) => (
          <StaggerItem key={post.id}>
            <Link
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="group block overflow-hidden rounded-md border border-border bg-card transition hover:shadow-elevated"
            >
            <LoadingImage
              src={resolveCoverImage(post.coverImage, PLACEHOLDER_IMAGES.hero)}
              alt=""
              containerClassName="aspect-video w-full"
              className="object-cover transition group-hover:scale-105"
              loaderLabel="Chargement…"
            />
            <div className="p-5">
              <time className="text-xs text-muted-foreground">
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString("fr-FR")
                  : ""}
              </time>
              <h3 className="mt-2 font-display font-bold text-forest group-hover:text-leaf">
                {post.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
            </div>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </MotionSection>
  );
}

export function FaqSection() {
  return (
    <MotionSection id="faq" className="relative overflow-hidden py-20 md:py-24">
      <SectionBackdrop image={PLACEHOLDER_IMAGES.tichy} overlay="mint" />
      <div className="relative mx-auto max-w-3xl px-6">
        <SectionHeader
          eyebrow="FAQ"
          title="Questions fréquentes"
          description="Tout ce qu'il faut savoir avant de réserver votre prochaine escapade."
          align="center"
          className="mx-auto"
        />
        <Reveal delay={0.1}>
          <Accordion type="single" collapsible className="mt-12">
            {faqs.map((faq, i) => (
              <AccordionItem key={faq.q} value={`faq-${i}`} className="border-border">
                <AccordionTrigger className="text-left font-display font-semibold text-forest hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
        <Reveal className="mt-8 text-center" delay={0.15}>
          <Link to="/contact" className="inline-flex items-center gap-2 text-sm font-semibold text-forest">
            Une autre question ? Écrivez-nous <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
          </Link>
        </Reveal>
      </div>
    </MotionSection>
  );
}
