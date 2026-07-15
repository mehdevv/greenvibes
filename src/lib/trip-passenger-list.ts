import type { Reservation, Trip } from "@/api/types";
import { reservationStatusLabel } from "@/api/reservations";
import {
  agencyContactHtml,
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
  const header =
    "Référence,Prénom,Nom,Téléphone,Adresse,Statut,Date inscription\n";
  const body = active
    .map((r) =>
      [
        r.bookingRef,
        r.firstName,
        r.lastName,
        r.phone,
        r.location,
        reservationStatusLabel(r.status),
        r.createdAt,
      ]
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
      (r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(r.bookingRef)}</td>
        <td>${escapeHtml(`${r.firstName} ${r.lastName}`)}</td>
        <td>${escapeHtml(r.phone)}</td>
        <td>${escapeHtml(r.location)}</td>
        <td>${escapeHtml(reservationStatusLabel(r.status))}</td>
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
  ${printHeaderHtml(
    escapeHtml(trip.title),
    `${active.length} participant(s)${trip.meetingPoint ? ` · ${escapeHtml(trip.meetingPoint)}` : ""}`,
  )}
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Réf.</th>
        <th>Nom</th>
        <th>Téléphone</th>
        <th>Adresse</th>
        <th>Statut</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="6">Aucun participant</td></tr>'}</tbody>
  </table>
  ${agencyContactHtml()}
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
