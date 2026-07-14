import { jsPDF } from "jspdf";
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

const FOREST = [45, 106, 79] as const;
const MUTED = [92, 107, 96] as const;
const INK = [10, 18, 12] as const;
const BORDER = [232, 237, 233] as const;

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

function receiptTitle(status: ReservationReceiptData["status"]) {
  if (status === "waitlisted") return "Liste d'attente enregistrée";
  return "Réservation enregistrée";
}

function followUpMessage(status: ReservationReceiptData["status"]) {
  if (status === "waitlisted") {
    return "L'équipe GreenVibes te contactera sous 24 à 48 h si une place se libère.";
  }
  return "L'équipe GreenVibes t'appellera sous 24 à 48 h pour confirmer les détails.";
}

function drawLabelValueRow(
  doc: jsPDF,
  label: string,
  value: string,
  y: number,
  margin: number,
  pageWidth: number,
): number {
  const valueX = margin + 42;
  const valueWidth = pageWidth - margin - valueX;
  const valueLines = doc.splitTextToSize(value, valueWidth);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(label, margin, y);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...INK);
  doc.text(valueLines, valueX, y);

  const rowHeight = Math.max(7, valueLines.length * 4.5);
  const lineY = y + rowHeight - 2;
  doc.setDrawColor(...BORDER);
  doc.line(margin, lineY, pageWidth - margin, lineY);

  return lineY + 5;
}

export function buildReservationReceiptPdf(data: ReservationReceiptData): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 18;

  doc.setFillColor(...FOREST);
  doc.rect(0, 0, pageWidth, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("GreenVibes", margin, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Reçu de réservation", margin, 22);
  doc.text(formatReceiptDate(data.createdAt), pageWidth - margin, 22, { align: "right" });

  y = 42;
  doc.setTextColor(...FOREST);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(receiptTitle(data.status), margin, y);

  y += 9;
  doc.setFontSize(17);
  doc.text(data.bookingRef, margin, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Statut : ${statusLabel(data.status)}`, margin, y);

  y += 10;
  const rows: [string, string][] = [
    ["Sortie", data.tripTitle],
    ["Durée", data.tripDuration],
    ["Prix", `${formatPrice(data.tripPrice)} DA`],
    ["Voyageur", `${data.firstName} ${data.lastName}`],
    ["Téléphone", data.phone],
    ["Localisation", data.location],
  ];
  if (data.tripMeetingPoint) {
    rows.push(["Rendez-vous", data.tripMeetingPoint]);
  }

  for (const [label, value] of rows) {
    y = drawLabelValueRow(doc, label, value, y, margin, pageWidth);
  }

  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  const footer = [
    followUpMessage(data.status),
    "",
    `${AGENCY_CONTACT.name} · ${AGENCY_CONTACT.address}`,
    `${AGENCY_CONTACT.phoneDisplay} · @gree.n_vibes`,
    "Conserve ce reçu — il contient ta référence de réservation.",
  ];

  for (const line of footer) {
    if (!line) {
      y += 2;
      continue;
    }
    const wrapped = doc.splitTextToSize(line, pageWidth - margin * 2);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 4;
  }

  return doc;
}

export function downloadReservationReceipt(data: ReservationReceiptData) {
  const doc = buildReservationReceiptPdf(data);
  doc.save(`greenvibes-recu-${data.bookingRef}.pdf`);
}

export function printReservationReceipt(data: ReservationReceiptData) {
  const doc = buildReservationReceiptPdf(data);
  doc.autoPrint();
  const url = doc.output("bloburl");
  const printWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (!printWindow) return;
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}
