import type { Reservation, Trip } from "@/api/types";
import { reservationStatusLabel } from "@/api/reservations";

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
    "Référence,Prénom,Nom,Téléphone,Localisation,Statut,Date inscription\n";
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
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: #1a1a1a; }
    h1 { font-size: 1.25rem; margin: 0 0 4px; }
    p.meta { color: #555; font-size: 0.875rem; margin: 0 0 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
    th { background: #f4f4f4; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(trip.title)}</h1>
  <p class="meta">${active.length} participant(s) · ${escapeHtml(trip.meetingPoint || "")}</p>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Réf.</th>
        <th>Nom</th>
        <th>Téléphone</th>
        <th>Localisation</th>
        <th>Statut</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="6">Aucun participant</td></tr>'}</tbody>
  </table>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
