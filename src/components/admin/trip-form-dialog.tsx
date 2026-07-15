import type { Trip } from "@/api/types";
import { TripFormPanel } from "@/components/admin/trip-form-panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TripFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip?: Trip | null;
  onCreated?: (trip: Trip) => void;
};

export function TripFormDialog({ open, onOpenChange, trip, onCreated }: TripFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{trip ? "Modifier l'offre" : "Nouvelle offre"}</DialogTitle>
        </DialogHeader>

        <TripFormPanel
          trip={trip}
          compact
          onCreated={(created) => {
            onCreated?.(created);
          }}
          onSaved={() => onOpenChange(false)}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
