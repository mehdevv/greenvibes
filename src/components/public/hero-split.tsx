import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import { HERO_VIDEO_SOURCES } from "@/lib/gallery-assets";
import { cn } from "@/lib/utils";
import { SectionWave } from "@/components/public/section-wave";
import {
  HeroButton,
  HeroContainer,
  HeroLead,
  HeroMediaFrame,
  HeroQuote,
  HeroReveal,
  HeroTitle,
} from "@/components/public/hero-ui";

export function HeroSplit() {
  const videos = HERO_VIDEO_SOURCES;
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % videos.length);
  }, [videos.length]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.load();
    video.play().catch(() => {});
  }, [index]);

  const scrollToTrips = () => {
    document.getElementById("voyages")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden bg-background pt-24 pb-0 md:pt-28 lg:pt-32">
      <HeroContainer>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-24">
          <HeroReveal>
            <HeroQuote>« L&apos;Algérie autrement, entre potes. »</HeroQuote>
            <HeroTitle as="h1" className="mt-5">
              Explore l&apos;Algérie avec <span className="text-forest">GreenVibes</span>
            </HeroTitle>
            <HeroLead className="mt-6">
              On part de Béjaïa pour découvrir mer, montagne et coins secrets — en petit groupe,
              sans prise de tête. Tu réserves en deux minutes, on s&apos;occupe du reste.
            </HeroLead>
            <HeroButton
              variant="accent"
              icon={ArrowRight}
              onClick={scrollToTrips}
              className="mt-8"
            >
              Découvrir nos offres
            </HeroButton>
          </HeroReveal>

          <HeroReveal delay={0.15}>
            <HeroMediaFrame>
              <video
                key={videos[index].src}
                ref={videoRef}
                className={cn(
                  "aspect-[4/3] w-full object-cover transition-opacity duration-500 sm:aspect-video lg:aspect-[4/3]",
                  videoReady ? "opacity-100" : "opacity-0",
                )}
                autoPlay
                muted={muted}
                playsInline
                preload="auto"
                onCanPlay={() => setVideoReady(true)}
                onEnded={advance}
              >
                <source src={videos[index].src} type="video/mp4" />
              </video>

              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-forest shadow-sm transition hover:bg-white"
                  aria-label={muted ? "Activer le son" : "Couper le son"}
                >
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              </div>

              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                {videos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Vidéo ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      i === index ? "w-6 bg-forest" : "w-2 bg-white/80",
                    )}
                  />
                ))}
              </div>
            </HeroMediaFrame>
          </HeroReveal>
        </div>
      </HeroContainer>

      <SectionWave className="mt-8 md:mt-10" />
    </section>
  );
}
