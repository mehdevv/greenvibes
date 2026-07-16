import * as XLSX from "xlsx";
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

function excelSheetName(name: string): string {
  const cleaned = name.replace(/[\\/*?:[\]]/g, " ").trim();
  return (cleaned || "Feuille").slice(0, 31);
}

function uniqueSheetNames(names: string[]): string[] {
  const used = new Map<string, number>();
  return names.map((name) => {
    const base = excelSheetName(name);
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    if (count === 0) return base;
    const suffix = ` (${count + 1})`;
    return `${base.slice(0, 31 - suffix.length)}${suffix}`;
  });
}

export function cellDisplayValue(row: TripSheetRow, column: TripSheetColumn): string {
  const raw = row.cells[column.id] ?? "";
  if (column.id === "status") return statusCellLabel(raw);
  return raw;
}

export function downloadTableXlsx(
  filename: string,
  sheetName: string,
  columns: TripSheetColumn[],
  rows: TripSheetRow[],
) {
  const header = columns.map((c) => c.label);
  const data = rows.map((row) => columns.map((col) => cellDisplayValue(row, col)));
  const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, excelSheetName(sheetName));
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

export function printReadOnlyTable(
  documentTitle: string,
  subtitle: string,
  columns: TripSheetColumn[],
  rows: TripSheetRow[],
) {
  const head = columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join("");
  const body = rows
    .map(
      (row, index) => `
      <tr>
        <td class="row-num">${index + 1}</td>
        ${columns.map((col) => `<td>${escapeHtml(cellDisplayValue(row, col))}</td>`).join("")}
      </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(documentTitle)}</title>
  <style>
    ${printDocumentStyles()}
    .row-num { width: 2rem; text-align: center; color: #666; font-weight: 600; }
  </style>
</head>
<body>
  ${printWatermarkHtml()}
  <div class="print-content">
    ${printHeaderHtml(escapeHtml(documentTitle), escapeHtml(subtitle))}
    <table>
      <thead><tr><th class="row-num">#</th>${head}</tr></thead>
      <tbody>${body || `<tr><td colspan="${columns.length + 1}">Aucune ligne</td></tr>`}</tbody>
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

export function downloadSheetXlsx(
  trip: Trip,
  sheet: TripSheet,
  columns: TripSheetColumn[],
  rows: TripSheetRow[],
) {
  const tripPart = trip.title.replace(/\s+/g, "-").toLowerCase();
  const sheetPart = sheet.name.replace(/\s+/g, "-").toLowerCase();
  downloadTableXlsx(`greenvibes-${tripPart}-${sheetPart}.xlsx`, sheet.name, columns, rows);
}

export function downloadWorkbookXlsx(
  trip: Trip,
  sheets: TripSheet[],
  columns: TripSheetColumn[],
  rowsBySheetId: Record<string, TripSheetRow[]>,
) {
  const wb = XLSX.utils.book_new();
  const names = uniqueSheetNames(sheets.map((s) => s.name));

  sheets.forEach((sheet, index) => {
    const rows = rowsBySheetId[sheet.id] ?? [];
    const header = columns.map((c) => c.label);
    const data = rows.map((row) => columns.map((col) => cellDisplayValue(row, col)));
    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
    XLSX.utils.book_append_sheet(wb, ws, names[index]);
  });

  const tripPart = trip.title.replace(/\s+/g, "-").toLowerCase();
  XLSX.writeFile(wb, `greenvibes-${tripPart}-feuilles.xlsx`);
}

export function printReadOnlySheet(
  trip: Trip,
  sheet: TripSheet,
  columns: TripSheetColumn[],
  rows: TripSheetRow[],
) {
  printReadOnlyTable(
    `${trip.title} — ${sheet.name}`,
    `${rows.length} ligne${rows.length > 1 ? "s" : ""}`,
    columns,
    rows,
  );
}
