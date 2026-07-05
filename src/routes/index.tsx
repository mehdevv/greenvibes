import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Phone,
} from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";
import { HeroSection } from "@/components/public/hero-section";
import { WilayaScrollStrip } from "@/components/public/wilaya-scroll-strip";
import { SectionHeader } from "@/components/public/section-header";
import {
  ExperienceCategories,
  HowItWorks,
  ServicesDetailed,
  TestimonialsSection,
  GalleryPreview,
  BlogPreview,
  FaqSection,
} from "@/components/public/home-sections";
import { ServicesQuickGrid } from "@/components/public/services-quick-grid";
import { DestinationsCarousel } from "@/components/public/destinations-carousel";
import { useListPublishedDestinations, useListPublishedOffers } from "@/api";
import {
  PLACEHOLDER_IMAGES,
  DEFAULT_OFFRES_SEARCH,
} from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { MotionSection, Reveal, SectionBackdrop } from "@/components/motion";
import { easeOut, heroItem, heroStagger } from "@/lib/motion";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <PublicLayout>
      <HeroSection />
      <DestinationsSection />
      <ExperienceCategories />
      <ServicesQuickGrid />
      <HowItWorks />
      <ServicesDetailed />
      <TestimonialsSection />
      <GalleryPreview />
      <BlogPreview />
      <FaqSection />
      <CTASection />
    </PublicLayout>
  );
}

function DestinationsSection() {
  const { data: destinations, isLoading } = useListPublishedDestinations();
  const { data: offers } = useListPublishedOffers();

  const offerCountByDestination = (destinationId: string) =>
    (offers ?? []).filter((o) => o.destinationId === destinationId).length;

  return (
    <div className="relative">
      <WilayaScrollStrip className="relative z-10" />

      <div className="relative z-20 mt-1 overflow-hidden rounded-t-[2.75rem] shadow-[0_-12px_40px_rgba(15,42,36,0.06)] sm:rounded-t-[3.5rem] md:rounded-t-[5rem]">
        <SectionBackdrop image={PLACEHOLDER_IMAGES.kherrata} overlay="light" />
        <MotionSection
          id="destinations"
          className="relative px-6 pb-16 pt-8 md:pb-24 md:pt-10"
        >
        <div className="mx-auto max-w-7xl">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-8">
        <SectionHeader
          eyebrow="Destinations"
          title={
            <>
              Le meilleur de l&apos;<span className=" font-normal">Algérie</span>, en une
              escapade
            </>
          }
          description="De la Méditerranée au Sahara — chaque destination a son caractère et ses circuits."
        />
        <Link
          to="/destinations"
          className="inline-flex items-center gap-2 text-sm font-semibold text-forest hover:underline"
        >
          Toutes les destinations <ArrowRight className="h-4 w-4" />
        </Link>
        </div>
      </Reveal>

      {isLoading ? (
        <div className="mt-12 flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[440px] w-[88%] shrink-0 rounded-md sm:w-1/2 lg:w-1/3 xl:w-1/4" />
          ))}
        </div>
      ) : (
        <DestinationsCarousel
          className="mt-10"
          destinations={destinations ?? []}
          offerCountByDestination={offerCountByDestination}
        />
      )}
        </div>
      </MotionSection>
      </div>
    </div>
  );
}

function CTASection() {
  return (
    <MotionSection id="contact" className="mx-auto max-w-7xl px-6 pt-20 md:pt-28 pb-0">
      <Reveal variant="scaleIn">
        <div className="relative overflow-hidden rounded-md bg-forest px-8 py-16 text-center text-primary-foreground shadow-elevated md:px-16 md:py-20">

        <span className="relative text-sm font-medium text-mint">
          Prêt à partir ?
        </span>
        <h2 className="relative mt-4 text-3xl font-light text-primary-foreground md:text-4xl">
          Votre prochaine escapade,{" "}
          <span className="text-mint">à un clic d&apos;ici.</span>
        </h2>
        <p className="relative mx-auto mt-6 max-w-xl text-primary-foreground/85">
          Consultez les disponibilités en direct et sécurisez votre place pour votre prochain voyage en
          Algérie. Une question ? Notre équipe répond sous 24h.
        </p>
        <motion.div
          className="relative mt-10 flex flex-wrap justify-center gap-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={heroStagger}
        >
          <motion.div variants={heroItem}>
            <Link
              to="/offres"
              search={DEFAULT_OFFRES_SEARCH}
              className="inline-flex items-center gap-2 rounded-[4px] bg-primary-foreground px-6 py-3 text-sm font-normal text-forest transition hover:opacity-95"
            >
              Réserver un circuit <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
          <motion.div variants={heroItem}>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-[4px] border border-primary-foreground/40 px-6 py-3 text-sm font-normal text-primary-foreground transition hover:bg-primary-foreground/10"
            >
              Nous écrire
            </Link>
          </motion.div>
          <motion.div variants={heroItem}>
            <a
              href="tel:+213000000000"
              className="inline-flex items-center gap-2 rounded-[4px] border border-primary-foreground/40 px-6 py-3 text-sm font-normal text-primary-foreground transition hover:bg-primary-foreground/10"
            >
              <Phone className="h-4 w-4" /> Appeler
            </a>
          </motion.div>
        </motion.div>
        </div>
      </Reveal>
    </MotionSection>
  );
}
