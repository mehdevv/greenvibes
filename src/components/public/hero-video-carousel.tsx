import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import { HERO_VIDEO_SOURCES } from "@/lib/gallery-assets";
import { cn } from "@/lib/utils";

type HeroVideoCarouselProps = {
  onComplete?: () => void;
};

export function HeroVideoCarousel({ onComplete }: HeroVideoCarouselProps) {
  const videos = HERO_VIDEO_SOURCES;
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const advance = useCallback(() => {
    if (index < videos.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onComplete?.();
    }
  }, [index, videos.length, onComplete]);

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
    <section className="relative h-[100dvh] min-h-[520px] w-full overflow-hidden">
      <video
        key={videos[index].src}
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted={muted}
        playsInline
        poster={videos[index].poster}
        onEnded={advance}
      >
        <source src={videos[index].src} type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-t from-[#2D6A4F]/80 via-[#2D6A4F]/25 to-black/20" />

      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-16 pt-24 sm:px-10 sm:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <p className="font-quote text-lg italic text-[#D8F3DC] sm:text-xl">
            « L&apos;Algérie autrement, entre potes. »
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
            Sorties fun depuis Béjaïa
          </h1>
          <p className="mt-4 max-w-lg text-base text-white/90 sm:text-lg">
            On explore mer, montagne et coins secrets — tu réserves en deux minutes, on s&apos;occupe
            du reste.
          </p>
          <button
            type="button"
            onClick={scrollToTrips}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#52B788] px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-[#2D6A4F]"
          >
            Découvrir nos voyages
            <ChevronRight className="h-4 w-4" />
          </button>
        </motion.div>

        <div className="absolute bottom-6 right-6 flex items-center gap-2 sm:bottom-8 sm:right-10">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30"
            aria-label={muted ? "Activer le son" : "Couper le son"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={advance}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30"
            aria-label="Vidéo suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
          {videos.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Vidéo ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === index ? "w-6 bg-white" : "w-2 bg-white/50",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
