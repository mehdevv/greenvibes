import { useMemo } from "react";
import type { TripSheet, TripSheetColumn, TripSheetRow } from "@/api/types";
import {
  useCreateTripSheetRow,
  useDeleteTripSheetRow,
  useListTripSheetRows,
  useMoveTripSheetRow,
  useReorderTripSheetRows,
  useUpdateTripSheetRow,
} from "@/api/trip-sheets";
import { updateReservationFieldsById, updateReservationStatusById } from "@/api/reservation-mutations";
import { syncReservationToSheetRow } from "@/api/reservation-sheet-sync";
import { useAuth } from "@/lib/auth";
import { cellsToReservationPatch, ROW_DRAG_MIME, statusCellLabel } from "@/lib/trip-list-columns";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DragHandle,
  DraggableColumnHead,
  EditableCell,
  SHEET_CELL,
  SHEET_HEAD,
  SHEET_ROW_NUM,
  useColumnDragReorder,
  useRowDragReorder,
} from "@/components/admin/sheet-ui";
import { SheetMobileCards } from "@/components/admin/sheet-mobile-cards";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowRightLeft, MessageCircle, Phone, Trash2 } from "lucide-react";

type TripSheetViewProps = {
  sheet: TripSheet;
  columns: TripSheetColumn[];
  allSheets: TripSheet[];
  canReorderColumns?: boolean;
  onReorderColumns?: (columns: TripSheetColumn[]) => void | Promise<void>;
};

export function TripSheetView({
  sheet,
  columns,
  allSheets,
  canReorderColumns = false,
  onReorderColumns,
}: TripSheetViewProps) {
  const { can } = useAuth();
  const canUpdate = can("tripLists", "update") || can("trips", "update");
  const canCreate = can("tripLists", "create");
  const canDelete = can("tripLists", "delete");

  const { data: rows = [], isLoading } = useListTripSheetRows(sheet.id);
  const updateRow = useUpdateTripSheetRow();
  const createRow = useCreateTripSheetRow();
  const deleteRow = useDeleteTripSheetRow();
  const reorderRows = useReorderTripSheetRows();
  const moveRow = useMoveTripSheetRow();

  const otherSheets = useMemo(
    () => allSheets.filter((s) => s.id !== sheet.id),
    [allSheets, sheet.id],
  );

  const persistReorder = async (reordered: TripSheetRow[]) => {
    try {
      await reorderRows.mutateAsync({
        sheetId: sheet.id,
        items: reordered.map((row, index) => ({ id: row.id, sortOrder: index })),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de réorganisation");
    }
  };

  const { overId, handleDragStart, handleDragOver, handleDrop, handleDragEnd } = useRowDragReorder(
    rows,
    persistReorder,
  );

  const persistColumnReorder = async (reordered: TripSheetColumn[]) => {
    if (!onReorderColumns) return;
    try {
      await onReorderColumns(reordered);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de réorganisation des colonnes");
    }
  };

  const {
    overId: overColumnId,
    handleDragStart: handleColumnDragStart,
    handleDragOver: handleColumnDragOver,
    handleDrop: handleColumnDrop,
    handleDragEnd: handleColumnDragEnd,
  } = useColumnDragReorder(columns, persistColumnReorder);

  const canDragColumns = canReorderColumns && canUpdate && columns.length > 1;

  const syncLinkedReservation = async (row: TripSheetRow, nextCells: Record<string, string>) => {
    if (!row.reservationId) return;
    const patch = cellsToReservationPatch(nextCells);
    if (patch.status) {
      const reservation = await updateReservationStatusById(row.reservationId, patch.status);
      await syncReservationToSheetRow(reservation);
      return;
    }
    const dbPatch: Record<string, unknown> = {};
    if (patch.firstName !== undefined) dbPatch.first_name = patch.firstName;
    if (patch.lastName !== undefined) dbPatch.last_name = patch.lastName;
    if (patch.phone !== undefined) dbPatch.phone = patch.phone;
    if (patch.location !== undefined) dbPatch.location = patch.location;
    if (Object.keys(dbPatch).length) {
      const reservation = await updateReservationFieldsById(row.reservationId, dbPatch);
      await syncReservationToSheetRow(reservation);
    }
  };

  const saveCell = async (row: TripSheetRow, columnId: string, value: string) => {
    const nextCells = { ...row.cells, [columnId]: value };
    try {
      await updateRow.mutateAsync({ id: row.id, cells: nextCells });
      await syncLinkedReservation(row, nextCells);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleMoveRow = async (row: TripSheetRow, targetSheetId: string) => {
    if (targetSheetId === sheet.id) return;
    try {
      await moveRow.mutateAsync({ rowId: row.id, toSheetId: targetSheetId });
      const target = allSheets.find((s) => s.id === targetSheetId);
      toast.success(`Ligne déplacée vers « ${target?.name ?? "feuille"} »`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleAddRow = async () => {
    try {
      await createRow.mutateAsync(sheet.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleDeleteRow = async (row: TripSheetRow) => {
    if (!window.confirm("Supprimer cette ligne ?")) return;
    try {
      await deleteRow.mutateAsync({ id: row.id, sheetId: sheet.id, reservationId: row.reservationId });
      toast.success("Ligne supprimée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const minWidth = useMemo(() => 160 + columns.length * 150 + (canUpdate ? 180 : 80), [columns.length, canUpdate]);

  if (isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Chargement de la feuille…</p>;
  }

  return (
    <div className="min-h-[320px] flex-1 md:min-h-[420px]">
      <SheetMobileCards
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        editable={canUpdate}
        onSaveStatus={canUpdate ? (row, status) => saveCell(row, "status", status) : undefined}
      />
      <div className="hidden overflow-auto rounded-lg border border-border bg-white shadow-inner md:block md:min-h-[420px]">
        <table className="w-full border-collapse" style={{ minWidth }}>
          <thead>
            <tr>
              <th className={cn(SHEET_HEAD, "sticky left-0 z-30 w-12 text-center")}>#</th>
              {canUpdate && <th className={cn(SHEET_HEAD, "w-10")} />}
              {columns.map((col) => (
                <DraggableColumnHead
                  key={col.id}
                  columnId={col.id}
                  label={col.label}
                  draggable={canDragColumns}
                  isOver={overColumnId === col.id}
                  onDragStart={handleColumnDragStart(col.id)}
                  onDragOver={handleColumnDragOver(col.id)}
                  onDrop={(e) => void handleColumnDrop(col.id)(e)}
                  onDragEnd={handleColumnDragEnd}
                />
              ))}
              {canUpdate && otherSheets.length > 0 && (
                <th className={cn(SHEET_HEAD, "min-w-[150px]")}>Déplacer</th>
              )}
              {canDelete && <th className={cn(SHEET_HEAD, "w-24")} />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.id}
                className={cn(
                  "group hover:bg-[#e8f0fe]/40",
                  overId === row.id && "bg-[#e8f0fe]/70",
                )}
                onDragOver={canUpdate ? handleDragOver(row.id) : undefined}
                onDrop={canUpdate ? (e) => void handleDrop(row.id)(e) : undefined}
              >
                <td className={SHEET_ROW_NUM}>{index + 1}</td>
                {canUpdate && (
                  <td className={SHEET_CELL}>
                    <DragHandle
                      draggable
                      onDragStart={handleDragStart(row.id)}
                      onDragEnd={handleDragEnd}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.id} className={SHEET_CELL}>
                    <SheetCell
                      columnId={col.id}
                      row={row}
                      editable={canUpdate && col.id !== "bookingRef"}
                      onSave={(value) => saveCell(row, col.id, value)}
                    />
                  </td>
                ))}
                {canUpdate && otherSheets.length > 0 && (
                  <td className={SHEET_CELL}>
                    <Select onValueChange={(value) => void handleMoveRow(row, value)}>
                      <SelectTrigger className="h-8 w-full min-w-[130px] text-xs">
                        <ArrowRightLeft className="mr-1 h-3.5 w-3.5" />
                        <SelectValue placeholder="Vers…" />
                      </SelectTrigger>
                      <SelectContent>
                        {otherSheets.map((target) => (
                          <SelectItem key={target.id} value={target.id}>
                            {target.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                )}
                {canDelete && (
                  <td className={SHEET_CELL}>
                    <div className="flex items-center gap-1">
                      {row.cells.phone && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={`tel:${row.cells.phone}`} aria-label="Appeler">
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a
                              href={`https://wa.me/${row.cells.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Bonjour ${row.cells.firstName ?? ""}, concernant votre réservation — GreenVibes`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          </Button>
                        </>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => void handleDeleteRow(row)}
                        aria-label="Supprimer la ligne"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {canCreate && (
              <tr
                className="cursor-pointer bg-[#f8f9fa]/80 hover:bg-[#e8f0fe]/50"
                onClick={() => void handleAddRow()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    void handleAddRow();
                  }
                }}
                tabIndex={0}
                aria-label="Ajouter une ligne"
              >
                <td className={cn(SHEET_ROW_NUM, "text-lg font-light text-muted-foreground")}>+</td>
                {canUpdate && <td className={SHEET_CELL} />}
                {columns.map((col) => (
                  <td key={col.id} className={cn(SHEET_CELL, "text-muted-foreground/30")} />
                ))}
                {canUpdate && otherSheets.length > 0 && <td className={SHEET_CELL} />}
                {canDelete && <td className={SHEET_CELL} />}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SheetCell({
  columnId,
  row,
  editable,
  onSave,
}: {
  columnId: string;
  row: TripSheetRow;
  editable: boolean;
  onSave: (value: string) => void | Promise<void>;
}) {
  const value = row.cells[columnId] ?? "";

  if (columnId === "status" && editable) {
    return (
      <Select value={value || "waitlisted"} onValueChange={(v) => void onSave(v)}>
        <SelectTrigger className="h-8 w-full min-w-[110px] border-border bg-background text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="waitlisted">Réservée</SelectItem>
          <SelectItem value="confirmed">Confirmée</SelectItem>
          <SelectItem value="cancelled">Annulée</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (columnId === "status") {
    return <span className="text-sm">{statusCellLabel(value)}</span>;
  }

  if (columnId === "bookingRef") {
    return <span className="font-mono text-sm font-medium text-forest">{value || "—"}</span>;
  }

  if (columnId === "phone" && !editable && value) {
    return (
      <a href={`tel:${value}`} className="text-sm hover:text-forest hover:underline">
        {value}
      </a>
    );
  }

  return (
    <EditableCell
      value={value}
      editable={editable}
      onSave={onSave}
      mono={columnId === "bookingRef"}
    />
  );
}