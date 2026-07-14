import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { useAddGalleryImage } from "@/api/site-content";
import { useAuth } from "@/lib/auth";
import { uploadImageToImgbb } from "@/lib/imgbb";
import { HeroCard } from "@/components/public/hero-ui";
import { toast } from "sonner";

export function AddGalleryImageCard() {
  const { user, canWrite } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const addImage = useAddGalleryImage();

  if (!user || !canWrite) return null;

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImageToImgbb(file);
      await addImage.mutateAsync({ url });
      toast.success("Photo ajoutée à la galerie");
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
        className="mb-5 w-full break-inside-avoid"
      >
        <HeroCard className="flex min-h-[180px] flex-col items-center justify-center gap-3 border-2 border-dashed border-forest/30 bg-forest/5 p-8 shadow-none transition hover:border-forest/50 hover:bg-forest/10">
          {uploading ? (
            <Loader2 className="h-10 w-10 animate-spin text-forest" />
          ) : (
            <>
              <ImagePlus className="h-10 w-10 text-forest" />
              <span className="text-sm font-semibold text-forest">Ajouter une photo</span>
              <span className="text-xs text-muted-foreground">Visible dans la galerie</span>
            </>
          )}
        </HeroCard>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
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
