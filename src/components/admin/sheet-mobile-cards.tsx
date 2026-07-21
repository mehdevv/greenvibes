import type { TripSheetColumn, TripSheetRow } from "@/api/types";
import { statusCellLabel } from "@/lib/trip-list-columns";
import { cellDisplayValue } from "@/lib/workbook-export";
import { cn } from "@/lib/utils";
import { MessageCircle, Phone } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SheetMobileCardsProps = {
  columns: TripSheetColumn[];
  rows: TripSheetRow[];
  isLoading?: boolean;
  editable?: boolean;
  onSaveStatus?: (row: TripSheetRow, status: string) => void | Promise<void>;
};

function pickColumn(columns: TripSheetColumn[], ids: string[]) {
  return ids.map((id) => columns.find((c) => c.id === id)).find(Boolean);
}

export function SheetMobileCards({
  columns,
  rows,
  isLoading,
  editable,
  onSaveStatus,
}: SheetMobileCardsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
        Aucun participant à afficher.
      </div>
    );
  }

  const nameCol = pickColumn(columns, ["firstName", "lastName"]);
  const phoneCol = columns.find((c) => c.id === "phone");
  const statusCol = columns.find((c) => c.id === "status");
  const locationCol = columns.find((c) => c.id === "location");
  const refCol = columns.find((c) => c.id === "bookingRef");

  return (
    <ul className="divide-y divide-border md:hidden">
      {rows.map((row, index) => {
        const firstName = row.cells.firstName ?? (nameCol ? row.cells[nameCol.id] : "");
        const lastName = row.cells.lastName ?? "";
        const displayName =
          [firstName, lastName].filter(Boolean).join(" ") ||
          columns
            .map((c) => row.cells[c.id])
            .filter(Boolean)
            .slice(0, 1)
            .join("") ||
          `Participant ${index + 1}`;
        const phone = row.cells.phone ?? "";
        const status = row.cells.status ?? "";
        const location = locationCol ? row.cells.location ?? "" : "";
        const ref = refCol ? row.cells.bookingRef ?? "" : "";

        return (
          <li key={row.id} className="bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{displayName}</p>
                {ref && <p className="mt-0.5 font-mono text-xs text-forest">{ref}</p>}
                {location && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{location}</p>}
              </div>
              {statusCol && (
                <div className="shrink-0">
                  {editable && onSaveStatus ? (
                    <Select value={status || "waitlisted"} onValueChange={(v) => void onSaveStatus(row, v)}>
                      <SelectTrigger className="h-10 min-w-[7.5rem] text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="waitlisted">Réservée</SelectItem>
                        <SelectItem value="confirmed">Confirmée</SelectItem>
                        <SelectItem value="cancelled">Annulée</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                        status === "confirmed" && "bg-green-100 text-green-800",
                        status === "waitlisted" && "bg-amber-100 text-amber-800",
                        status === "cancelled" && "bg-red-100 text-red-800",
                        !status && "bg-secondary text-muted-foreground",
                      )}
                    >
                      {statusCellLabel(status) || "—"}
                    </span>
                  )}
                </div>
              )}
            </div>

            {phone && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href={`tel:${phone}`}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-forest px-4 text-sm font-medium text-white"
                >
                  <Phone className="h-4 w-4" />
                  {phone}
                </a>
                <a
                  href={`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Bonjour ${firstName || displayName}, concernant votre réservation — GreenVibes`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
              </div>
            )}

            {!phoneCol && columns.length > 0 && (
              <dl className="mt-3 space-y-1.5 text-sm">
                {columns
                  .filter((c) => !["firstName", "lastName", "phone", "status", "location", "bookingRef"].includes(c.id))
                  .map((col) => {
                    const val = cellDisplayValue(row, col);
                    if (!val) return null;
                    return (
                      <div key={col.id} className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">{col.label}</dt>
                        <dd className="text-right font-medium">{val}</dd>
                      </div>
                    );
                  })}
              </dl>
            )}
          </li>
        );
      })}
    </ul>
  );
}
