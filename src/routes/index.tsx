import { createFileRoute } from "@tanstack/react-router";
import { useSiteImages } from "@/api/site-images";
import { useSiteGalleryItems, usePresentationBlocks } from "@/api/site-content";
import { useMediaLayout } from "@/api/site-media-layout";
import { useSiteTexts } from "@/api/site-texts";
import { PublicLayout } from "@/components/layout/public-layout";
import { HeroSplit } from "@/components/public/hero-split";
import { ServicesSection } from "@/components/public/services-section";
import { TripsGrid } from "@/components/public/trips-grid";
import { StatsBar } from "@/components/public/stats-bar";
import { AgencySection } from "@/components/public/agency-section";
import { GalleryMosaic } from "@/components/public/gallery-mosaic";
import { ContactSection } from "@/components/public/contact-section";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  useSiteImages();
  useSiteGalleryItems();
  usePresentationBlocks();
  useMediaLayout();
  useSiteTexts();

  return (
    <PublicLayout>
      <HeroSplit />
      <TripsGrid />
      <ServicesSection />
      <StatsBar />
      <AgencySection />
      <GalleryMosaic />
      <ContactSection />
    </PublicLayout>
  );
}
