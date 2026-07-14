import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

type MediaOrderControlsProps = {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  deleteLabel?: string;
  className?: string;
};

export function MediaOrderControls({
  onMoveUp,
  onMoveDown,
  onDelete,
  canMoveUp = true,
  canMoveDown = true,
  deleteLabel = "Supprimer cet élément ?",
  className,
}: MediaOrderControlsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          "absolute top-2 left-2 z-30 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100",
          className,
        )}
      >
        {onMoveUp && (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full bg-white/95 shadow-md"
            disabled={!canMoveUp}
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            aria-label="Monter"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        )}
        {onMoveDown && (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full bg-white/95 shadow-md"
            disabled={!canMoveDown}
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            aria-label="Descendre"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="button"
          size="icon"
          variant="destructive"
          className="h-8 w-8 rounded-full shadow-md"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmOpen(true);
          }}
          aria-label="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>{deleteLabel}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setConfirmOpen(false);
                onDelete();
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

export function EditableHint({ className }: { className?: string }) {
  return (
    <Pencil
      className={cn("inline h-3.5 w-3.5 opacity-0 transition group-hover/edit:opacity-60", className)}
    />
  );
}
