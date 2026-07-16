import type { Trip, TripSheet, TripSheetColumn, TripSheetRow } from "@/api/types";
import { statusCellLabel } from "@/lib/trip-list-columns";
import {
  printDocumentStyles,
  printHeaderHtml,
  printWatermarkHtml,
} from "@/lib/print-branding";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cellValue(row: TripSheetRow, column: TripSheetColumn): string {
  const raw = row.cells[column.id] ?? "";
  if (column.id === "status") return statusCellLabel(raw);
  return raw;
}

function sheetFilename(trip: Trip, sheet: TripSheet, ext: string) {
  const tripPart = trip.title.replace(/\s+/g, "-").toLowerCase();
  const sheetPart = sheet.name.replace(/\s+/g, "-").toLowerCase();
  return `greenvibes-${tripPart}-${sheetPart}.${ext}`;
}

export function downloadTripSheet(
  trip: Trip,
  sheet: TripSheet,
  columns: TripSheetColumn[],
  rows: TripSheetRow[],
) {
  const header = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((col) => `"${cellValue(row, col).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = sheetFilename(trip, sheet, "csv");
  a.click();
  URL.revokeObjectURL(url);
}

export function printTripSheet(
  trip: Trip,
  sheet: TripSheet,
  columns: TripSheetColumn[],
  rows: TripSheetRow[],
) {
  const head = columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join("");
  const body = rows
    .map(
      (row) => `
      <tr>
        ${columns.map((col) => `<td>${escapeHtml(cellValue(row, col))}</td>`).join("")}
      </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(sheet.name)} — ${escapeHtml(trip.title)}</title>
  <style>${printDocumentStyles()}</style>
</head>
<body>
  ${printWatermarkHtml()}
  <div class="print-content">
    ${printHeaderHtml(
      escapeHtml(`${trip.title} — ${sheet.name}`),
      `${rows.length} ligne${rows.length > 1 ? "s" : ""}`,
    )}
    <table>
      <thead><tr>${head}</tr></thead>
      <tbody>${body || `<tr><td colspan="${columns.length}">Aucune ligne</td></tr>`}</tbody>
    </table>
  </div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
