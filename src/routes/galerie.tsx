import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PublicLayout } from "@/components/layout/public-layout";
import { useListGalleryItems } from "@/api";
import { PLACEHOLDER_IMAGES } from "@/lib/constants";
import { resolveCoverImage } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PageIntro } from "@/components/public/page-intro";
import { Stagger, StaggerItem } from "@/components/motion";

export const Route = createFileRoute("/galerie")({
  component: GalleryPage,
});

function GalleryPage() {
  const { data: items, isLoading } = useListGalleryItems();
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <PublicLayout>
      <PageIntro
        title="Galerie"
        description="L'Algérie en images — mer, montagne, désert et moments partagés."
      >
        {isLoading ? (
          <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="mb-4 h-64 w-full rounded-md" />
            ))}
          </div>
        ) : (
          <Stagger className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {(items ?? []).map((item) => (
              <StaggerItem key={item.id} className="mb-4 break-inside-avoid">
                <button
                  type="button"
                  onClick={() =>
                    setLightbox(resolveCoverImage(item.storagePath, PLACEHOLDER_IMAGES.hero))
                  }
                  className="group block w-full overflow-hidden rounded-md"
                >
                  <img
                    src={resolveCoverImage(item.storagePath, PLACEHOLDER_IMAGES.hero)}
                    alt={item.title}
                    className="w-full object-cover transition group-hover:scale-105"
                  />
                  {item.title && (
                    <div className="bg-card px-3 py-2 text-left text-sm font-medium">{item.title}</div>
                  )}
                </button>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </PageIntro>

      <Dialog open={Boolean(lightbox)} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none">
          {lightbox && (
            <img src={lightbox} alt="" className="max-h-[85vh] w-full rounded-md object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}
