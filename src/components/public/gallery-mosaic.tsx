import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { LOCAL_GALLERY_MEDIA, type GalleryMedia } from "@/lib/gallery-assets";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { HeroBlockHeader, HeroCard, HeroContainer, HeroSection } from "@/components/public/hero-ui";
import { Reveal } from "@/components/motion";

export function GalleryMosaic() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const media = LOCAL_GALLERY_MEDIA;

  const open = lightboxIndex !== null;
  const current = open ? media[lightboxIndex] : null;

  const go = useCallback(
    (delta: number) => {
      if (lightboxIndex === null) return;
      setLightboxIndex((lightboxIndex + delta + media.length) % media.length);
    },
    [lightboxIndex, media.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "Escape") setLightboxIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  return (
    <HeroSection id="galerie" tone="sand">
      <HeroContainer>
        <HeroBlockHeader
          eyebrow="Souvenirs"
          title="Quelques moments de nos sorties"
          subtitle="Paysages, sourires et bonne humeur — voilà ce qu'on vit ensemble."
        />

        <div className="mt-14 columns-1 gap-5 sm:columns-2 lg:columns-3 xl:gap-6">
          {media.map((item, i) => (
            <Reveal key={item.id} delay={(i % 3) * 0.05} className="mb-5 break-inside-avoid">
              <button type="button" onClick={() => setLightboxIndex(i)} className="block w-full">
                <HeroCard className="shadow-sm transition hover:shadow-md">
                  {item.type === "image" ? (
                    <img
                      src={item.src}
                      alt={item.title}
                      loading="lazy"
                      className="w-full object-cover"
                    />
                  ) : (
                    <video
                      src={item.src}
                      muted
                      playsInline
                      preload="metadata"
                      className="aspect-video w-full object-cover"
                    />
                  )}
                </HeroCard>
              </button>
            </Reveal>
          ))}
        </div>
      </HeroContainer>

      <Dialog open={open} onOpenChange={() => setLightboxIndex(null)}>
        <DialogContent className="max-w-5xl border-none bg-black/95 p-2 sm:p-4">
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-3 top-3 z-10 rounded-full bg-white/10 p-2 text-white"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
          {current && (
            <div className="relative flex items-center justify-center">
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-2 z-10 rounded-full bg-white/10 p-2 text-white"
                aria-label="Précédent"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <MediaPreview item={current} />
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-2 z-10 rounded-full bg-white/10 p-2 text-white"
                aria-label="Suivant"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </HeroSection>
  );
}

function MediaPreview({ item }: { item: GalleryMedia }) {
  if (item.type === "video") {
    return (
      <video
        src={item.src}
        controls
        autoPlay
        className="max-h-[80vh] w-full rounded-lg object-contain"
      />
    );
  }
  return (
    <img src={item.src} alt={item.title} className="max-h-[80vh] w-full rounded-lg object-contain" />
  );
}
