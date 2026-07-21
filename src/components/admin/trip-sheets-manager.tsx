import { useEffect, useMemo, useState, type DragEvent } from "react";
import type { Trip, TripSheetColumn } from "@/api/types";
import {
  useCreateTripSheet,
  useDeleteTripSheet,
  useListTripSheetRows,
  useListTripSheets,
  useMoveTripSheetRow,
  useTripListColumns,
  useTripSheetsRealtime,
  useUpdateTripListColumns,
} from "@/api/trip-sheets";
import { useUpdateTripCapacity } from "@/api/trips";
import { TripSheetView } from "@/components/admin/trip-sheet-view";
import { useAuth } from "@/lib/auth";
import {
  tripAvailabilityBarColor,
  tripAvailabilityLabel,
  tripSpotsRemaining,
} from "@/lib/availability";
import { ROW_DRAG_MIME } from "@/lib/trip-list-columns";
import { downloadTripSheet, printTripSheet } from "@/lib/trip-sheet-export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Download, Minus, Plus, Printer, Trash2 } from "lucide-react";

type TripSheetsManagerProps = {
  trip: Trip;
};

export function TripSheetsManager({ trip }: TripSheetsManagerProps) {
  const { can } = useAuth();
  const canReadLists = can("tripLists", "read") || can("reservations", "read");
  const canCreateSheet = can("tripLists", "create");
  const canDeleteSheet = can("tripLists", "delete");
  const canUpdateLists = can("tripLists", "update") || can("trips", "update");
  const canTripUpdate = can("trips", "update");

  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [newSheetOpen, setNewSheetOpen] = useState(false);
  const [newSheetName, setNewSheetName] = useState("");
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [placeDelta, setPlaceDelta] = useState("1");

  const { data: sheets = [], isLoading } = useListTripSheets(trip.id);
  const createSheet = useCreateTripSheet();
  const deleteSheet = useDeleteTripSheet();
  const moveRow = useMoveTripSheetRow();
  const updateColumns = useUpdateTripListColumns();
  const updateCapacity = useUpdateTripCapacity();
  useTripSheetsRealtime(trip.id);

  const { data: columns = trip.listColumns } = useTripListColumns(trip.id);
  const [columnsDraft, setColumnsDraft] = useState<TripSheetColumn[] | null>(null);
  const activeColumns = columnsDraft ?? columns;
  const activeSheet = sheets.find((s) => s.id === activeSheetId) ?? sheets[0] ?? null;
  const { data: activeRows = [] } = useListTripSheetRows(activeSheet?.id ?? "");

  useEffect(() => {
    if (!activeSheetId && sheets[0]) setActiveSheetId(sheets[0].id);
  }, [activeSheetId, sheets]);

  const remaining = tripSpotsRemaining(trip.capacity, trip.spotsTaken);
  const fillPercent =
    trip.capacity > 0 ? Math.min(100, Math.round((trip.spotsTaken / trip.capacity) * 100)) : 0;
  const minCapacity = Math.max(1, trip.spotsTaken);

  const sortedSheets = useMemo(
    () => [...sheets].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [sheets],
  );

  if (!canReadLists) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Vous n&apos;avez pas la permission de consulter les listes de ce voyage.
      </p>
    );
  }

  const handleCreateSheet = async () => {
    const name = newSheetName.trim();
    if (!name) {
      toast.error("Donnez un nom à la feuille");
      return;
    }
    try {
      const sheet = await createSheet.mutateAsync({ tripId: trip.id, name });
      setNewSheetOpen(false);
      setNewSheetName("");
      setActiveSheetId(sheet.id);
      toast.success("Feuille créée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleDeleteSheet = async (sheetId: string, name: string, isDefault: boolean) => {
    if (isDefault) {
      toast.error("La feuille Participants ne peut pas être supprimée");
      return;
    }
    if (!window.confirm(`Supprimer la feuille « ${name} » ?`)) return;
    try {
      await deleteSheet.mutateAsync({ id: sheetId, tripId: trip.id, isDefault });
      if (activeSheetId === sheetId) setActiveSheetId(sheets.find((s) => s.isDefault)?.id ?? sheets[0]?.id ?? null);
      toast.success("Feuille supprimée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  useEffect(() => {
    setColumnsDraft(null);
  }, [columns]);

  const saveColumns = async (nextColumns: TripSheetColumn[]) => {
    setColumnsDraft(nextColumns);
    try {
      const saved = await updateColumns.mutateAsync({ tripId: trip.id, columns: nextColumns });
      setColumnsDraft(null);
      return saved.columns;
    } catch (err) {
      setColumnsDraft(null);
      toast.error(err instanceof Error ? err.message : "Erreur");
      throw err;
    }
  };

  const handleDownloadSheet = () => {
    if (!activeSheet) return;
    downloadTripSheet(trip, activeSheet, activeColumns, activeRows);
  };

  const handlePrintSheet = () => {
    if (!activeSheet) return;
    printTripSheet(trip, activeSheet, activeColumns, activeRows);
  };

  const handleTabDrop = (targetSheetId: string) => async (e: DragEvent) => {
    e.preventDefault();
    setDropTargetId(null);
    if (!canUpdateLists || !activeSheet) return;
    const rowId = e.dataTransfer.getData(ROW_DRAG_MIME) || e.dataTransfer.getData("text/plain");
    if (!rowId || targetSheetId === activeSheet.id) return;
    try {
      await moveRow.mutateAsync({ rowId, toSheetId: targetSheetId });
      const target = sheets.find((s) => s.id === targetSheetId);
      toast.success(`Ligne déplacée vers « ${target?.name ?? "feuille"} »`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleAdjustPlaces = async (delta: number) => {
    if (delta === 0) return;
    const next = trip.capacity + delta;
    if (next < minCapacity) {
      toast.error(`Minimum ${minCapacity} place(s) déjà inscrite(s).`);
      return;
    }
    try {
      await updateCapacity.mutateAsync({ id: trip.id, capacity: next });
      toast.success(delta > 0 ? `+${delta} place(s)` : `${delta} place(s)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-4 md:p-4">
        <div className="min-w-[200px]">
          <p className="text-sm font-medium text-muted-foreground">Remplissage</p>
          <p className="font-display text-3xl font-bold text-forest">
            {trip.spotsTaken}
            <span className="text-lg font-normal text-muted-foreground"> / {trip.capacity}</span>
          </p>
          <p className="text-sm text-muted-foreground">{tripAvailabilityLabel(remaining, trip.capacity)}</p>
          <div className="mt-2 h-2.5 max-w-xs overflow-hidden rounded-full bg-border">
            <div
              className={cn("h-full rounded-full transition-all", tripAvailabilityBarColor(remaining, trip.capacity))}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>
        {canTripUpdate && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-medium text-muted-foreground">Capacité</span>
            {[5, 10].map((n) => (
              <Button key={n} type="button" size="sm" variant="secondary" className="h-8 px-2" onClick={() => void handleAdjustPlaces(n)}>
                +{n}
              </Button>
            ))}
            <Input type="number" min={1} className="h-8 w-14" value={placeDelta} onChange={(e) => setPlaceDelta(e.target.value)} />
            <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={() => void handleAdjustPlaces(-(Number(placeDelta) || 0))}>
              <Minus className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={() => void handleAdjustPlaces(Number(placeDelta) || 0)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-b border-border pb-2">
        <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
        {isLoading ? (
          <span className="px-2 text-xs text-muted-foreground">Chargement des feuilles…</span>
        ) : (
          sortedSheets.map((sheet) => (
            <div key={sheet.id} className="flex items-center">
              <button
                type="button"
                onClick={() => setActiveSheetId(sheet.id)}
                onDragOver={
                  canUpdateLists
                    ? (e) => {
                        e.preventDefault();
                        setDropTargetId(sheet.id);
                      }
                    : undefined
                }
                onDragLeave={() => setDropTargetId((id) => (id === sheet.id ? null : id))}
                onDrop={canUpdateLists ? (e) => void handleTabDrop(sheet.id)(e) : undefined}
                className={cn(
                  "shrink-0 rounded-lg border px-3 py-2.5 text-sm font-medium transition md:py-1.5",
                  activeSheetId === sheet.id
                    ? "border-forest bg-forest/10 text-forest shadow-sm"
                    : "border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground",
                  dropTargetId === sheet.id && "ring-2 ring-forest/40",
                )}
              >
                {sheet.name}
              </button>
              {canDeleteSheet && !sheet.isDefault && (
                <button
                  type="button"
                  className="ml-0.5 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => void handleDeleteSheet(sheet.id, sheet.name, sheet.isDefault)}
                  aria-label={`Supprimer ${sheet.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))
        )}

        {canCreateSheet && (
          <Button type="button" size="sm" variant="outline" className="ml-1 gap-1.5" onClick={() => setNewSheetOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle feuille
          </Button>
        )}
        </div>

        {activeSheet && canReadLists && (
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" className="h-10 flex-1 gap-1.5 md:h-9 md:flex-none" onClick={handleDownloadSheet}>
              <Download className="h-4 w-4" />
              Télécharger
            </Button>
            <Button type="button" size="sm" variant="outline" className="h-10 flex-1 gap-1.5 md:h-9 md:flex-none" onClick={handlePrintSheet}>
              <Printer className="h-4 w-4" />
              Imprimer
            </Button>
          </div>
        )}
      </div>

      {activeSheet ? (
        <TripSheetView
          sheet={activeSheet}
          columns={activeColumns}
          allSheets={sortedSheets}
          canReorderColumns={canUpdateLists}
          onReorderColumns={saveColumns}
        />
      ) : (
        <p className="p-6 text-sm text-muted-foreground">Aucune feuille disponible.</p>
      )}

      <Dialog open={newSheetOpen} onOpenChange={setNewSheetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle feuille</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Ex. Bus A, Paiements, Notes…"
            value={newSheetName}
            onChange={(e) => setNewSheetName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleCreateSheet();
            }}
            autoFocus
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNewSheetOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={() => void handleCreateSheet()} disabled={createSheet.isPending}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
