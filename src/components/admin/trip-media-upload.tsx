import { useRef, useState } from "react";
import { Film, ImagePlus, Loader2, Trash2 } from "lucide-react";
import type { TripMedia } from "@/api/types";
import { useAddTripMedia, useRemoveTripMedia } from "@/api/trips";
import { uploadImageToImgbb } from "@/lib/imgbb";
import { uploadVideoToStorage } from "@/lib/upload-media";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TripMediaUploadProps = {
  tripId: string;
  media: TripMedia[];
  disabled?: boolean;
};

export function TripMediaUpload({ tripId, media, disabled }: TripMediaUploadProps) {
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"image" | "video" | null>(null);
  const addMedia = useAddTripMedia();
  const removeMedia = useRemoveTripMedia();

  const uploadFile = async (file: File, mediaType: "image" | "video") => {
    setUploading(mediaType);
    try {
      const url =
        mediaType === "video" ? await uploadVideoToStorage(file) : await uploadImageToImgbb(file);
      await addMedia.mutateAsync({ tripId, url, mediaType });
      toast.success(mediaType === "video" ? "Vidéo ajoutée" : "Image ajoutée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec du téléversement");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-3">
      <Label>Photos &amp; vidéos</Label>

      {media.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {media.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-xl border border-border">
              {item.mediaType === "video" ? (
                <video src={item.url} className="aspect-video w-full object-cover" muted playsInline />
              ) : (
                <img src={item.url} alt="" className="aspect-video w-full object-cover" />
              )}
              {!disabled && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await removeMedia.mutateAsync(item.id);
                      toast.success("Média supprimé");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Erreur");
                    }
                  }}
                  className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow transition group-hover:opacity-100"
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!disabled && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={Boolean(uploading)}
            onClick={() => imageRef.current?.click()}
          >
            {uploading === "image" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="mr-2 h-4 w-4" />
            )}
            Ajouter une image
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={Boolean(uploading)}
            onClick={() => videoRef.current?.click()}
          >
            {uploading === "video" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Film className="mr-2 h-4 w-4" />
            )}
            Ajouter une vidéo
          </Button>
        </div>
      )}

      <input
        ref={imageRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void uploadFile(file, "image");
        }}
      />
      <input
        ref={videoRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void uploadFile(file, "video");
        }}
      />

      {!tripId && (
        <p className={cn("text-xs text-muted-foreground")}>
          Enregistrez l&apos;offre d&apos;abord, puis ajoutez des médias.
        </p>
      )}
    </div>
  );
}
