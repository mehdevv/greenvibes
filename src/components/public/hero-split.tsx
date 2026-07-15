import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import { useMergedHeroVideos } from "@/api/site-hero-videos";
import { HeroVideoAdminLayer } from "@/components/admin/hero-video-admin";
import { EditableText } from "@/components/admin/editable-text";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { SectionWave } from "@/components/public/section-wave";
import { LoadingVideo } from "@/components/ui/media-loader";
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
  const videos = useMergedHeroVideos();
  const { user, canWrite } = useAuth();
  const canEdit = Boolean(user && canWrite);
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const safeIndex = videos.length > 0 ? index % videos.length : 0;
  const current = videos[safeIndex];

  const advance = useCallback(() => {
    if (videos.length === 0) return;
    setIndex((i) => (i + 1) % videos.length);
  }, [videos.length]);

  useEffect(() => {
    if (index >= videos.length && videos.length > 0) {
      setIndex(0);
    }
  }, [index, videos.length]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !current) return;
    video.load();
    video.play().catch(() => {});
  }, [safeIndex, current?.src]);

  const scrollToTrips = () => {
    document.getElementById("voyages")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden bg-background pt-24 pb-0 md:pt-28 lg:pt-32">
      <HeroContainer>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-24">
          <HeroReveal>
            <HeroQuote>
              <EditableText textKey="hero.quote" label="Modifier la citation" />
            </HeroQuote>
            <HeroTitle as="h1" className="mt-5">
              <EditableText textKey="hero.title.before" label="Modifier le titre" as="span" />
              <EditableText
                textKey="hero.title.highlight"
                label="Modifier le nom de marque"
                className="text-forest"
                as="span"
              />
            </HeroTitle>
            <HeroLead className="mt-6">
              <EditableText textKey="hero.lead" label="Modifier l'introduction" multiline as="span" />
            </HeroLead>
            <HeroButton
              variant="accent"
              icon={ArrowRight}
              onClick={scrollToTrips}
              className="mt-8"
            >
              <EditableText textKey="hero.cta" label="Modifier le bouton" as="span" />
            </HeroButton>
          </HeroReveal>

          <HeroReveal delay={0.15}>
            <HeroMediaFrame className={cn(canEdit && "group")}>
              {current ? (
                <LoadingVideo
                  key={current.src}
                  ref={videoRef}
                  className="aspect-[4/3] w-full object-cover sm:aspect-video lg:aspect-[4/3]"
                  containerClassName="w-full"
                  autoPlay
                  muted={muted}
                  playsInline
                  preload="auto"
                  onEnded={advance}
                >
                  <source src={current.src} type="video/mp4" />
                </LoadingVideo>
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-forest/10 text-sm text-muted-foreground">
                  Aucune vidéo — ajoutez-en une en mode édition
                </div>
              )}

              {canEdit && current && (
                <HeroVideoAdminLayer
                  current={current}
                  videos={videos}
                  currentIndex={safeIndex}
                  onReplaced={() => {
                    const video = videoRef.current;
                    video?.load();
                    video?.play().catch(() => {});
                  }}
                  onDeleted={() => setIndex(0)}
                />
              )}

              <div className="absolute right-4 bottom-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-forest shadow-sm transition hover:bg-white"
                  aria-label={muted ? "Activer le son" : "Couper le son"}
                >
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              </div>

              {videos.length > 1 && (
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {videos.map((video, i) => (
                    <button
                      key={video.id}
                      type="button"
                      aria-label={`Vidéo ${i + 1}`}
                      onClick={() => setIndex(i)}
                      className={cn(
                        "h-2 rounded-full transition-all",
                        i === safeIndex ? "w-6 bg-forest" : "w-2 bg-white/80",
                      )}
                    />
                  ))}
                </div>
              )}
            </HeroMediaFrame>
          </HeroReveal>
        </div>
      </HeroContainer>

      <SectionWave className="mt-8 md:mt-10" />
    </section>
  );
}
