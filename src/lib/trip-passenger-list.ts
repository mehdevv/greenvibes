import type { Reservation, Trip } from "@/api/types";
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

export function downloadTripPassengerList(trip: Trip, reservations: Reservation[]) {
  const active = reservations.filter((r) => r.status !== "cancelled");
  const header = "Nom,Téléphone,Localisation\n";
  const body = active
    .map((r) =>
      [`${r.firstName} ${r.lastName}`, r.phone, r.location]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `greenvibes-${trip.title.replace(/\s+/g, "-").toLowerCase()}-participants.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printTripPassengerList(trip: Trip, reservations: Reservation[]) {
  const active = reservations.filter((r) => r.status !== "cancelled");
  const rows = active
    .map(
      (r) => `
      <tr>
        <td>${escapeHtml(`${r.firstName} ${r.lastName}`)}</td>
        <td>${escapeHtml(r.phone)}</td>
        <td>${escapeHtml(r.location)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Participants — ${escapeHtml(trip.title)}</title>
  <style>${printDocumentStyles()}</style>
</head>
<body>
  ${printWatermarkHtml()}
  <div class="print-content">
    ${printHeaderHtml(
      escapeHtml(trip.title),
      `${active.length} participant${active.length > 1 ? "s" : ""}`,
    )}
    <table>
      <thead>
        <tr>
          <th>Nom</th>
          <th>Téléphone</th>
          <th>Localisation</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="3">Aucun participant</td></tr>'}</tbody>
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
