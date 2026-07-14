import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, Film, Loader2, Plus, Trash2 } from "lucide-react";
import {
  useAddHeroVideo,
  useRemoveHeroVideo,
  useUpdateHeroVideo,
  heroLayoutKey,
  type HeroVideoItem,
} from "@/api/site-hero-videos";
import { useHideMediaLayout, useReorderMediaLayout } from "@/api/site-media-layout";
import { useUpdateSiteImage } from "@/api/site-images";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { uploadVideoToStorage } from "@/lib/upload-media";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type HeroVideoAdminLayerProps = {
  current: HeroVideoItem;
  videos: HeroVideoItem[];
  currentIndex: number;
  onReplaced: () => void;
  onDeleted: () => void;
};

export function HeroVideoAdminLayer({
  current,
  videos,
  currentIndex,
  onReplaced,
  onDeleted,
}: HeroVideoAdminLayerProps) {
  const { user, canWrite } = useAuth();
  const replaceRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"replace" | "add" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const updateSlot = useUpdateSiteImage();
  const addVideo = useAddHeroVideo();
  const updateVideo = useUpdateHeroVideo();
  const removeVideo = useRemoveHeroVideo();
  const hideMedia = useHideMediaLayout();
  const reorder = useReorderMediaLayout();

  if (!user || !canWrite) return null;

  const uploadFile = async (file: File, action: "replace" | "add") => {
    setUploading(true);
    setMode(action);
    try {
      const url = await uploadVideoToStorage(file);
      if (action === "replace") {
        if (current.custom && current.dbId) {
          await updateVideo.mutateAsync({ id: current.dbId, url });
        } else if (current.slot) {
          await updateSlot.mutateAsync({ slot: current.slot, url });
        }
        toast.success("Vidéo du hero mise à jour");
      } else {
        await addVideo.mutateAsync(url);
        toast.success("Vidéo ajoutée au hero");
      }
      onReplaced();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec du téléversement");
    } finally {
      setUploading(false);
      setMode(null);
    }
  };

  const handleDelete = async () => {
    try {
      if (current.custom && current.dbId) {
        await removeVideo.mutateAsync(current.dbId);
      } else {
        await hideMedia.mutateAsync(heroLayoutKey(current.id));
      }
      toast.success("Vidéo retirée du hero");
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la suppression");
    }
  };

  const moveVideo = async (direction: -1 | 1) => {
    const target = currentIndex + direction;
    if (target < 0 || target >= videos.length) return;
    const next = [...videos];
    const [item] = next.splice(currentIndex, 1);
    next.splice(target, 0, item!);
    try {
      await reorder.mutateAsync(next.map((v) => heroLayoutKey(v.id)));
      toast.success("Ordre mis à jour");
      onReplaced();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={uploading}
        onClick={() => replaceRef.current?.click()}
        className={cn(
          "absolute inset-0 z-10 flex flex-col items-center justify-center gap-2",
          "bg-forest/50 text-white opacity-0 transition-opacity",
          "group-hover:opacity-100 focus-visible:opacity-100",
          uploading && mode === "replace" && "opacity-100",
        )}
        aria-label="Changer la vidéo"
      >
        {uploading && mode === "replace" ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : (
          <>
            <Film className="h-8 w-8" />
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              Changer la vidéo
            </span>
          </>
        )}
      </button>

      <div className="absolute top-4 left-4 z-20 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-full bg-white/95 shadow-md"
          disabled={currentIndex === 0}
          onClick={() => void moveVideo(-1)}
          aria-label="Vidéo précédente dans l'ordre"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-full bg-white/95 shadow-md"
          disabled={currentIndex >= videos.length - 1}
          onClick={() => void moveVideo(1)}
          aria-label="Vidéo suivante dans l'ordre"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="destructive"
          className="h-8 w-8 rounded-full shadow-md"
          disabled={videos.length <= 1}
          onClick={() => setConfirmDelete(true)}
          aria-label="Supprimer la vidéo"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          disabled={uploading}
          onClick={() => addRef.current?.click()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-forest shadow-sm transition hover:bg-white"
          aria-label="Ajouter une vidéo"
          title="Ajouter une vidéo"
        >
          {uploading && mode === "add" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </button>
      </div>

      <input
        ref={replaceRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void uploadFile(file, "replace");
        }}
      />
      <input
        ref={addRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void uploadFile(file, "add");
        }}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette vidéo ?</AlertDialogTitle>
            <AlertDialogDescription>
              {current.custom
                ? "La vidéo sera supprimée définitivement du carrousel."
                : "La vidéo par défaut sera masquée du carrousel."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setConfirmDelete(false);
                void handleDelete();
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
