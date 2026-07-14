import { AGENCY_CONTACT, formatPrice } from "@/lib/constants";

export type ReservationReceiptData = {
  bookingRef: string;
  status: "confirmed" | "waitlisted" | "cancelled" | string;
  tripTitle: string;
  tripDuration: string;
  tripPrice: number;
  tripMeetingPoint?: string;
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  createdAt?: string;
};

function formatReceiptDate(iso?: string) {
  const date = iso ? new Date(iso) : new Date();
  return date.toLocaleString("fr-DZ", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function statusLabel(status: ReservationReceiptData["status"]) {
  if (status === "waitlisted") return "Liste d'attente";
  if (status === "cancelled") return "Annulée";
  return "Confirmée";
}

function buildReceiptHtml(data: ReservationReceiptData) {
  const created = formatReceiptDate(data.createdAt);
  const status = statusLabel(data.status);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Reçu GreenVibes — ${data.bookingRef}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, sans-serif;
      color: #0a120c;
      background: #f8f0e3;
      margin: 0;
      padding: 32px 16px;
    }
    .card {
      max-width: 520px;
      margin: 0 auto;
      background: #fff;
      border-radius: 24px;
      padding: 32px;
      border: 1px solid #e8ede9;
      box-shadow: 0 8px 32px rgba(10, 31, 20, 0.08);
    }
    .brand { color: #2d6a4f; font-size: 22px; font-weight: 700; margin: 0; }
    .subtitle { color: #5c6b60; font-size: 14px; margin: 6px 0 0; }
    h1 { font-size: 20px; margin: 24px 0 8px; color: #2d6a4f; }
    .ref { font-size: 18px; font-weight: 700; letter-spacing: 0.04em; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
    td { padding: 10px 0; border-bottom: 1px solid #e8ede9; vertical-align: top; }
    td:first-child { color: #5c6b60; width: 42%; }
    td:last-child { font-weight: 600; text-align: right; }
    .footer { margin-top: 24px; font-size: 12px; color: #5c6b60; line-height: 1.6; }
    .badge {
      display: inline-block;
      background: #d8f3dc;
      color: #2d6a4f;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="card">
    <p class="brand">GreenVibes</p>
    <p class="subtitle">Reçu de réservation · ${created}</p>
    <h1>${data.status === "waitlisted" ? "Liste d'attente" : "Réservation enregistrée"}</h1>
    <p class="ref">${data.bookingRef}</p>
    <p><span class="badge">${status}</span></p>
    <table>
      <tr><td>Sortie</td><td>${escapeHtml(data.tripTitle)}</td></tr>
      <tr><td>Durée</td><td>${escapeHtml(data.tripDuration)}</td></tr>
      <tr><td>Prix</td><td>${formatPrice(data.tripPrice)} DA</td></tr>
      <tr><td>Voyageur</td><td>${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}</td></tr>
      <tr><td>Téléphone</td><td>${escapeHtml(data.phone)}</td></tr>
      <tr><td>Localisation</td><td>${escapeHtml(data.location)}</td></tr>
      ${data.tripMeetingPoint ? `<tr><td>Rendez-vous</td><td>${escapeHtml(data.tripMeetingPoint)}</td></tr>` : ""}
    </table>
    <p class="footer">
      ${AGENCY_CONTACT.name} · ${AGENCY_CONTACT.address}<br />
      ${AGENCY_CONTACT.phoneDisplay} · ${AGENCY_CONTACT.instagram.replace("https://www.instagram.com/", "@").replace(/\/$/, "")}<br />
      Conserve ce reçu — il contient ta référence de réservation.
    </p>
  </div>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function downloadReservationReceipt(data: ReservationReceiptData) {
  const html = buildReceiptHtml(data);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `greenvibes-recu-${data.bookingRef}.html`;
  link.click();
  URL.revokeObjectURL(url);
}

export function printReservationReceipt(data: ReservationReceiptData) {
  const html = buildReceiptHtml(data);
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=640,height=800");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => {
    printWindow.print();
  };
}
