import { useRef, useState } from "react";
import { LayoutTemplate, Loader2, Plus } from "lucide-react";
import { useAddPresentationBlock } from "@/api/site-content";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { uploadImageToImgbb } from "@/lib/imgbb";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export function AddPresentationBlockButton({ imageLeftDefault }: { imageLeftDefault: boolean }) {
  const { user, canWrite } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageLeft, setImageLeft] = useState(imageLeftDefault);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addBlock = useAddPresentationBlock();

  if (!user || !canWrite) return null;

  const reset = () => {
    setTitle("");
    setBody("");
    setPreview("");
    setImageLeft(imageLeftDefault);
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImageToImgbb(file);
      setPreview(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec du téléversement");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !preview) {
      toast.error("Titre et image requis.");
      return;
    }
    try {
      await addBlock.mutateAsync({
        title: title.trim(),
        body: body.trim(),
        imageUrl: preview,
        imageLeft,
      });
      toast.success("Section ajoutée");
      setOpen(false);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="mt-8 gap-2 rounded-full border-dashed border-forest/40"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Ajouter une section
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5 text-forest" />
              Nouvelle section présentation
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div>
              <Label>Titre</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. Expériences locales"
              />
            </div>
            <div>
              <Label>Texte</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                placeholder="Décrivez cette facette de vos sorties…"
              />
            </div>
            <div>
              <Label>Image</Label>
              {preview ? (
                <img
                  src={preview}
                  alt=""
                  className="mt-2 max-h-40 w-full rounded-xl object-cover"
                />
              ) : (
                <div className="mt-2 flex min-h-[100px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                  Aucune image
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Choisir une image
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void handleFile(file);
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="img-left" checked={imageLeft} onCheckedChange={setImageLeft} />
              <Label htmlFor="img-left">Image à gauche</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={addBlock.isPending}>
              {addBlock.isPending ? "Ajout…" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
