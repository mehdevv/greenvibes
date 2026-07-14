import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Film, Loader2, X } from "lucide-react";
import { AddGalleryImageCard } from "@/components/admin/add-gallery-image-card";
import { EditableImage } from "@/components/admin/editable-image";
import { MediaOrderControls } from "@/components/admin/media-order-controls";
import { EditableBlockHeader } from "@/components/admin/editable-text";
import { useSiteImages, useUpdateSiteImage } from "@/api/site-images";
import {
  galleryLayoutKey,
  useMergedGalleryMedia,
  useRemoveGalleryImage,
  type GalleryMediaItem,
} from "@/api/site-content";
import {
  useHideMediaLayout,
  useReorderMediaLayout,
} from "@/api/site-media-layout";
import { useAuth } from "@/lib/auth";
import { uploadVideoToStorage } from "@/lib/upload-media";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { HeroCard, HeroContainer, HeroSection } from "@/components/public/hero-ui";
import { Reveal } from "@/components/motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

export function GalleryMosaic() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { user, canWrite } = useAuth();
  const { data: siteImages } = useSiteImages();
  const media = useMergedGalleryMedia();
  const removeImage = useRemoveGalleryImage();
  const reorder = useReorderMediaLayout();
  const hideMedia = useHideMediaLayout();
  const canEdit = Boolean(user && canWrite);

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

  const moveItem = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= media.length) return;
    const next = [...media];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item!);
    try {
      await reorder.mutateAsync(next.map((m) => galleryLayoutKey(m.id)));
      toast.success("Ordre mis à jour");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const deleteItem = async (item: GalleryMediaItem) => {
    try {
      if (item.custom && item.dbId) {
        await removeImage.mutateAsync(item.dbId);
      } else {
        await hideMedia.mutateAsync(galleryLayoutKey(item.id));
      }
      toast.success("Élément retiré de la galerie");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <HeroSection id="galerie" tone="sand">
      <HeroContainer>
        <EditableBlockHeader
          eyebrow="Souvenirs"
          eyebrowKey="gallery.eyebrow"
          title="Quelques moments de nos sorties"
          titleKey="gallery.title"
          subtitle="Paysages, sourires et bonne humeur — voilà ce qu'on vit ensemble."
          subtitleKey="gallery.subtitle"
        />

        <div className="mt-14 columns-1 gap-5 sm:columns-2 lg:columns-3 xl:gap-6">
          {media.map((item, i) => (
            <Reveal key={item.id} delay={(i % 3) * 0.05} className="mb-5 break-inside-avoid">
              <GalleryTile
                item={item}
                index={i}
                total={media.length}
                canEdit={canEdit}
                resolvedSrc={siteImages?.[`gallery-${item.id}`] ?? item.src}
                onOpenLightbox={() => setLightboxIndex(i)}
                onMoveUp={() => void moveItem(i, -1)}
                onMoveDown={() => void moveItem(i, 1)}
                onDelete={() => void deleteItem(item)}
              />
            </Reveal>
          ))}
          {canEdit && <AddGalleryImageCard />}
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
              <MediaPreview
                item={current}
                src={siteImages?.[`gallery-${current.id}`] ?? current.src}
              />
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

function GalleryTile({
  item,
  index,
  total,
  canEdit,
  resolvedSrc,
  onOpenLightbox,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  item: GalleryMediaItem;
  index: number;
  total: number;
  canEdit: boolean;
  resolvedSrc: string;
  onOpenLightbox: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const videoSrc = isVideoUrl(resolvedSrc) ? resolvedSrc : item.src;
  const isVideo = item.type === "video" || isVideoUrl(resolvedSrc);

  const card = isVideo ? (
    <video
      src={videoSrc}
      muted
      playsInline
      preload="metadata"
      className="aspect-video w-full object-cover"
    />
  ) : canEdit ? (
    <EditableImage
      slot={`gallery-${item.id}`}
      fallback={item.src}
      alt={item.title}
      loading="lazy"
      className="w-full object-cover"
      label="Remplacer"
    />
  ) : (
    <img src={resolvedSrc} alt={item.title} loading="lazy" className="w-full object-cover" />
  );

  if (canEdit) {
    return (
      <div className="group relative">
        <MediaOrderControls
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onDelete={onDelete}
          canMoveUp={index > 0}
          canMoveDown={index < total - 1}
          deleteLabel={
            item.custom
              ? "Supprimer définitivement cette photo de la galerie ?"
              : "Masquer cet élément de la galerie ?"
          }
        />
        {isVideo && <GalleryVideoReplace slot={`gallery-${item.id}`} />}
        <HeroCard className="overflow-hidden shadow-sm">{card}</HeroCard>
      </div>
    );
  }

  return (
    <button type="button" onClick={onOpenLightbox} className="block w-full text-left">
      <HeroCard className="shadow-sm transition hover:shadow-md">{card}</HeroCard>
    </button>
  );
}

function GalleryVideoReplace({ slot }: { slot: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const updateImage = useUpdateSiteImage();

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadVideoToStorage(file);
      await updateImage.mutateAsync({ slot, url });
      toast.success("Vidéo de galerie mise à jour");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec du téléversement");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "absolute inset-0 z-10 flex flex-col items-center justify-center gap-2",
          "bg-forest/50 text-white opacity-0 transition-opacity",
          "group-hover:opacity-100",
          uploading && "opacity-100",
        )}
        aria-label="Changer la vidéo"
      >
        {uploading ? (
          <Loader2 className="h-7 w-7 animate-spin" />
        ) : (
          <>
            <Film className="h-7 w-7" />
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">Changer la vidéo</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleFile(file);
        }}
      />
    </>
  );
}

function MediaPreview({ item, src }: { item: GalleryMediaItem; src: string }) {
  const isVideo = item.type === "video" || isVideoUrl(src);
  if (isVideo) {
    return (
      <video
        src={src}
        controls
        autoPlay
        className="max-h-[80vh] w-full rounded-lg object-contain"
      />
    );
  }
  return (
    <img src={src} alt={item.title} className="max-h-[80vh] w-full rounded-lg object-contain" />
  );
}
