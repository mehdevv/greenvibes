import { useRef, useState, type ImgHTMLAttributes, type ReactNode } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useUpdateSiteImage, useSiteImageUrl } from "@/api/site-images";
import { useAuth } from "@/lib/auth";
import { uploadImageToImgbb } from "@/lib/imgbb";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type EditableImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  /** Unique key stored in `site_images` */
  slot: string;
  /** Bundled / default URL when nothing saved yet */
  fallback: string;
  label?: string;
};

export function EditableImage({
  slot,
  fallback,
  label = "Changer l'image",
  className,
  alt = "",
  ...imgProps
}: EditableImageProps) {
  const { user, canWrite } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const src = useSiteImageUrl(slot, fallback);
  const updateImage = useUpdateSiteImage();

  const editable = Boolean(user && canWrite);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImageToImgbb(file);
      await updateImage.mutateAsync({ slot, url });
      toast.success("Image mise à jour sur le site");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec du téléversement");
    } finally {
      setUploading(false);
    }
  };

  if (!editable) {
    return <img src={src} alt={alt} className={className} {...imgProps} />;
  }

  return (
    <div className="group relative">
      <img src={src} alt={alt} className={className} {...imgProps} />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center gap-2",
          "bg-forest/50 text-white opacity-0 transition-opacity",
          "group-hover:opacity-100 focus-visible:opacity-100",
          uploading && "opacity-100",
        )}
        aria-label={label}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : (
          <>
            <Camera className="h-8 w-8" />
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              {label}
            </span>
          </>
        )}
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
    </div>
  );
}

type EditableVideoPosterProps = {
  slot: string;
  fallback: string;
  children: (posterUrl: string) => ReactNode;
  className?: string;
  label?: string;
};

/** Wraps a video: admin clicks to change the poster image only */
export function EditableVideoPoster({
  slot,
  fallback,
  children,
  className,
  label = "Changer l'aperçu",
}: EditableVideoPosterProps) {
  const { user, canWrite } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const poster = useSiteImageUrl(slot, fallback);
  const updateImage = useUpdateSiteImage();
  const editable = Boolean(user && canWrite);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImageToImgbb(file);
      await updateImage.mutateAsync({ slot, url });
      toast.success("Aperçu vidéo mis à jour");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec du téléversement");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("group relative", className)}>
      {children(poster)}
      {editable && (
        <>
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "absolute inset-0 z-10 flex flex-col items-center justify-center gap-2",
              "bg-forest/50 text-white opacity-0 transition-opacity",
              "group-hover:opacity-100 focus-visible:opacity-100",
              uploading && "opacity-100",
            )}
            aria-label={label}
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <>
                <Camera className="h-8 w-8" />
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                  {label}
                </span>
              </>
            )}
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
      )}
    </div>
  );
}
