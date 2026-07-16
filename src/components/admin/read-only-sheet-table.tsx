import { useMemo } from "react";
import type { TripSheetColumn, TripSheetRow } from "@/api/types";
import { SHEET_CELL, SHEET_HEAD, SHEET_ROW_NUM } from "@/components/admin/sheet-ui";
import { cellDisplayValue } from "@/lib/workbook-export";
import { cn } from "@/lib/utils";
import { MessageCircle, Phone } from "lucide-react";

type ReadOnlySheetTableProps = {
  columns: TripSheetColumn[];
  rows: TripSheetRow[];
  isLoading?: boolean;
};

export function ReadOnlySheetTable({ columns, rows, isLoading }: ReadOnlySheetTableProps) {
  const minWidth = useMemo(() => 56 + columns.length * 150, [columns.length]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12 text-sm text-muted-foreground">
        Chargement de la feuille…
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto bg-white">
      <table className="w-full border-collapse" style={{ minWidth }}>
        <thead>
          <tr>
            <th className={cn(SHEET_HEAD, "sticky left-0 z-30 w-12 text-center")}>#</th>
            {columns.map((col) => (
              <th key={col.id} className={cn(SHEET_HEAD, "min-w-[130px]")}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="border border-border px-4 py-16 text-center text-sm text-muted-foreground"
              >
                Aucune ligne à afficher.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.id} className="hover:bg-[#e8f0fe]/30">
                <td className={SHEET_ROW_NUM}>{index + 1}</td>
                {columns.map((col) => (
                  <td key={col.id} className={SHEET_CELL}>
                    <ReadOnlyCell columnId={col.id} value={cellDisplayValue(row, col)} phone={row.cells.phone} />
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function ReadOnlyCell({
  columnId,
  value,
  phone,
}: {
  columnId: string;
  value: string;
  phone?: string;
}) {
  if (!value) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  if (columnId === "bookingRef") {
    return <span className="font-mono text-sm font-medium text-forest">{value}</span>;
  }

  if (columnId === "phone") {
    return (
      <div className="flex items-center gap-2">
        <a href={`tel:${value}`} className="text-sm hover:text-forest hover:underline">
          {value}
        </a>
        {phone && (
          <>
            <a
              href={`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent("Bonjour, concernant votre réservation — GreenVibes")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-forest"
              aria-label="WhatsApp"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </a>
            <a href={`tel:${phone}`} className="text-muted-foreground hover:text-forest" aria-label="Appeler">
              <Phone className="h-3.5 w-3.5" />
            </a>
          </>
        )}
      </div>
    );
  }

  return <span className="text-sm">{value}</span>;
}
