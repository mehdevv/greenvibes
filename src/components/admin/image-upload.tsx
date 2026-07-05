import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadImageToImgbb } from "@/lib/imgbb";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ImageUploadProps = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
};

export function ImageUpload({
  value,
  onChange,
  label = "Image",
  disabled = false,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImageToImgbb(file);
      onChange(url);
      toast.success("Image téléversée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de téléversement");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label>{label}</Label>

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-border bg-secondary/30">
          <img src={value} alt="Aperçu" className="max-h-52 w-full object-cover" />
          {!disabled && (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8 rounded-full shadow-sm"
              onClick={() => onChange("")}
              aria-label="Retirer l'image"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-border bg-secondary/20 px-4 py-8 text-center text-sm text-muted-foreground">
          Aucune image — téléversez un fichier JPEG, PNG ou WebP
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        disabled={disabled || uploading}
        onChange={handleFile}
      />

      <Button
        type="button"
        variant="outline"
        className=""
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Téléversement...
          </>
        ) : (
          <>
            <ImagePlus className="mr-2 h-4 w-4" />
            {value ? "Remplacer l'image" : "Choisir une image"}
          </>
        )}
      </Button>
    </div>
  );
}
