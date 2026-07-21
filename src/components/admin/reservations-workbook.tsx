import { useEffect, useMemo, useState } from "react";
import { useListAllTripsAdmin, useListReservations, useReservationsRealtime, useTripsRealtime } from "@/api";
import type { ReservationStatus, TripSheetColumn, TripSheetRow } from "@/api/types";
import {
  fetchTripSheetRows,
  useListTripSheetRows,
  useListTripSheets,
  useTripListColumns,
  useTripSheetsRealtime,
} from "@/api/trip-sheets";
import { ReadOnlySheetTable } from "@/components/admin/read-only-sheet-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ALL_RESERVATIONS_VIEW_ID,
  CHRONO_COLUMNS,
  reservationToChronoRow,
  sortReservationsChronologically,
} from "@/lib/reservations-chrono";
import {
  downloadSheetXlsx,
  downloadTableXlsx,
  downloadWorkbookXlsx,
  printReadOnlySheet,
  printReadOnlyTable,
} from "@/lib/workbook-export";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Printer, Search } from "lucide-react";

export function ReservationsWorkbook() {
  useTripsRealtime();
  useReservationsRealtime();

  const { data: trips = [], isLoading: tripsLoading } = useListAllTripsAdmin();
  const [tripId, setTripId] = useState<string>(ALL_RESERVATIONS_VIEW_ID);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReservationStatus | "all">("all");
  const [exporting, setExporting] = useState(false);

  const isAllView = tripId === ALL_RESERVATIONS_VIEW_ID;

  const sortedTrips = useMemo(() => {
    const list = [...trips];
    list.sort((a, b) => {
      const aActive = a.active && !a.archived ? 1 : 0;
      const bActive = b.active && !b.archived ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [trips]);

  const selectedTrip = useMemo(
    () => sortedTrips.find((t) => t.id === tripId) ?? null,
    [sortedTrips, tripId],
  );

  const { data: allReservations = [], isLoading: allReservationsLoading } = useListReservations(
    {
      search: search || undefined,
      status: status === "all" ? undefined : status,
    },
    { enabled: isAllView },
  );

  const { data: sheets = [], isLoading: sheetsLoading } = useListTripSheets(
    !isAllView ? selectedTrip?.id ?? "" : "",
  );
  const { data: tripColumns = [] } = useTripListColumns(!isAllView ? selectedTrip?.id ?? "" : "");
  useTripSheetsRealtime(!isAllView ? selectedTrip?.id ?? "" : "");

  const sortedSheets = useMemo(
    () => [...sheets].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [sheets],
  );

  const activeSheet = sortedSheets.find((s) => s.id === activeSheetId) ?? sortedSheets[0] ?? null;

  useEffect(() => {
    if (!isAllView && !activeSheetId && sortedSheets[0]) setActiveSheetId(sortedSheets[0].id);
  }, [activeSheetId, isAllView, sortedSheets]);

  useEffect(() => {
    if (!isAllView) setActiveSheetId(null);
  }, [tripId, isAllView]);

  const { data: sheetRows = [], isLoading: rowsLoading } = useListTripSheetRows(
    !isAllView ? activeSheet?.id ?? "" : "",
  );

  const chronoRows = useMemo((): TripSheetRow[] => {
    return sortReservationsChronologically(allReservations).map(reservationToChronoRow);
  }, [allReservations]);

  const filteredSheetRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = sheetRows;
    if (status !== "all") {
      list = list.filter((row) => row.cells.status === status);
    }
    if (q) {
      list = list.filter((row) =>
        tripColumns.some((col) => (row.cells[col.id] ?? "").toLowerCase().includes(q)),
      );
    }
    return list;
  }, [sheetRows, tripColumns, search, status]);

  const columns: TripSheetColumn[] = isAllView ? CHRONO_COLUMNS : tripColumns;
  const displayRows = isAllView ? chronoRows : filteredSheetRows;
  const isLoading = isAllView ? allReservationsLoading : sheetsLoading || rowsLoading;

  const handlePrint = () => {
    if (isAllView) {
      printReadOnlyTable(
        "Toutes les réservations",
        `${displayRows.length} ligne${displayRows.length > 1 ? "s" : ""} — ordre chronologique`,
        columns,
        displayRows,
      );
      return;
    }
    if (!selectedTrip || !activeSheet) return;
    printReadOnlySheet(selectedTrip, activeSheet, columns, displayRows);
  };

  const handleDownloadSheet = () => {
    if (isAllView) {
      downloadTableXlsx(
        "greenvibes-toutes-reservations.xlsx",
        "Chronologique",
        columns,
        displayRows,
      );
      return;
    }
    if (!selectedTrip || !activeSheet) return;
    downloadSheetXlsx(selectedTrip, activeSheet, columns, displayRows);
  };

  const handleDownloadWorkbook = async () => {
    if (isAllView || !selectedTrip || sortedSheets.length === 0) return;
    setExporting(true);
    try {
      const rowsBySheetId: Record<string, Awaited<ReturnType<typeof fetchTripSheetRows>>> = {};
      await Promise.all(
        sortedSheets.map(async (sheet) => {
          rowsBySheetId[sheet.id] = await fetchTripSheetRows(sheet.id);
        }),
      );
      downloadWorkbookXlsx(selectedTrip, sortedSheets, columns, rowsBySheetId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export impossible");
    } finally {
      setExporting(false);
    }
  };

  if (tripsLoading && trips.length === 0) {
    return <Skeleton className="h-[calc(100vh-10rem)] w-full rounded-lg" />;
  }

  if (!sortedTrips.length && !isAllView) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        Aucune offre disponible.
      </div>
    );
  }

  return (
    <div className="flex h-[min(70vh,calc(100dvh-14rem))] min-h-[360px] flex-col overflow-hidden rounded-lg border border-border bg-white shadow-sm md:h-[calc(100vh-12rem)] md:min-h-[480px]">
      <div className="flex shrink-0 flex-col gap-2 border-b border-border bg-[#f8f9fa] p-3 md:flex-row md:flex-wrap md:items-center md:px-3 md:py-2">
        <Select value={tripId} onValueChange={setTripId}>
          <SelectTrigger className="h-11 w-full bg-white text-base md:h-8 md:w-[min(100%,240px)] md:text-sm">
            <SelectValue placeholder="Vue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_RESERVATIONS_VIEW_ID}>Toutes — chronologique</SelectItem>
            {sortedTrips.map((trip) => (
              <SelectItem key={trip.id} value={trip.id}>
                {trip.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative w-full md:min-w-[140px] md:max-w-xs md:flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filtrer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 bg-white pl-8 text-base md:h-8 md:text-sm"
          />
        </div>

        <Select value={status} onValueChange={(v) => setStatus(v as ReservationStatus | "all")}>
          <SelectTrigger className="h-11 w-full bg-white text-base md:h-8 md:w-32 md:text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="confirmed">Confirmée</SelectItem>
            <SelectItem value="waitlisted">Réservée</SelectItem>
            <SelectItem value="cancelled">Annulée</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5 md:ml-auto">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-10 flex-1 gap-1.5 bg-white px-2.5 text-xs md:h-8 md:flex-none"
            onClick={handleDownloadSheet}
            disabled={displayRows.length === 0}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Feuille</span>
          </Button>
          {!isAllView && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 bg-white px-2.5 text-xs"
              onClick={() => void handleDownloadWorkbook()}
              disabled={!selectedTrip || sortedSheets.length === 0 || exporting}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{exporting ? "…" : "Classeur"}</span>
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 bg-white px-2.5 text-xs"
            onClick={handlePrint}
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Imprimer</span>
          </Button>
        </div>
      </div>

      <ReadOnlySheetTable columns={columns} rows={displayRows} isLoading={isLoading} />

      {!isAllView && (
        <div className="flex shrink-0 items-stretch overflow-x-auto border-t border-border bg-[#e8eaed]">
          {sheetsLoading ? (
            <span className="px-3 py-1.5 text-xs text-muted-foreground">…</span>
          ) : (
            sortedSheets.map((sheet) => (
              <button
                key={sheet.id}
                type="button"
                onClick={() => setActiveSheetId(sheet.id)}
                className={cn(
                  "shrink-0 border-r border-border px-3 py-1.5 text-xs font-medium transition",
                  activeSheet?.id === sheet.id
                    ? "bg-white text-forest shadow-[inset_0_2px_0_0_hsl(var(--forest))]"
                    : "text-muted-foreground hover:bg-[#dadce0] hover:text-foreground",
                )}
              >
                {sheet.name}
              </button>
            ))
          )}
        </div>
      )}

      {isAllView && (
        <div className="shrink-0 border-t border-border bg-[#e8eaed] px-3 py-1.5 text-xs text-muted-foreground">
          Chronologique — {displayRows.length} réservation{displayRows.length > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
