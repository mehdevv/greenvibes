import { jsPDF } from "jspdf";
import { AGENCY_CONTACT, formatPrice } from "@/lib/constants";
import { agencyContactLines, drawPdfLogoWatermark, getLogoDataUrl } from "@/lib/print-branding";

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
const BORDER = [216, 227, 220] as const;
const SAND = [248, 240, 227] as const;

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
  const valueX = margin + 44;
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

function drawContactFooter(doc: jsPDF, y: number, margin: number, pageWidth: number) {
  const boxTop = y;
  const boxHeight = 34;
  doc.setFillColor(...SAND);
  doc.setDrawColor(...BORDER);
  doc.roundedRect(margin, boxTop, pageWidth - margin * 2, boxHeight, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...FOREST);
  doc.text("Contact GreenVibes", margin + 4, boxTop + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  const lines = agencyContactLines().slice(1);
  let lineY = boxTop + 13;
  for (const line of lines) {
    doc.text(line, margin + 4, lineY);
    lineY += 4.2;
  }

  return boxTop + boxHeight + 6;
}

export async function buildReservationReceiptPdf(data: ReservationReceiptData): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 16;

  const logo = await getLogoDataUrl();

  doc.setFillColor(...FOREST);
  doc.rect(0, 0, pageWidth, 32, "F");

  doc.addImage(logo, "JPEG", margin, 6, 20, 20, undefined, "FAST");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("GreenVibes", margin + 24, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Reçu de réservation", margin + 24, 21);
  doc.text(formatReceiptDate(data.createdAt), pageWidth - margin, 21, { align: "right" });

  y = 40;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, pageWidth - margin * 2, pageHeight - y - margin, 3, 3, "S");

  y += 8;
  doc.setTextColor(...FOREST);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(receiptTitle(data.status), margin + 4, y);

  y += 9;
  doc.setFontSize(17);
  doc.text(data.bookingRef, margin + 4, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(`Statut : ${statusLabel(data.status)}`, margin + 4, y);

  y += 10;
  const rows: [string, string][] = [
    ["Sortie", data.tripTitle],
    ["Durée", data.tripDuration],
    ["Prix", `${formatPrice(data.tripPrice)} DA`],
    ["Voyageur", `${data.firstName} ${data.lastName}`],
    ["Téléphone", data.phone],
    ["Adresse", data.location],
  ];
  if (data.tripMeetingPoint) {
    rows.push(["Rendez-vous", data.tripMeetingPoint]);
  }

  for (const [label, value] of rows) {
    y = drawLabelValueRow(doc, label, value, y, margin + 4, pageWidth - 4);
  }

  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  const note = followUpMessage(data.status);
  const wrappedNote = doc.splitTextToSize(note, pageWidth - (margin + 4) * 2);
  doc.text(wrappedNote, margin + 4, y);
  y += wrappedNote.length * 4 + 6;

  y = drawContactFooter(doc, y, margin + 2, pageWidth - 4);

  doc.setFontSize(7.5);
  doc.text("Conserve ce reçu — il contient ta référence de réservation.", margin + 4, y);

  await drawPdfLogoWatermark(doc, 0.11);

  return doc;
}

export async function downloadReservationReceipt(data: ReservationReceiptData) {
  const doc = await buildReservationReceiptPdf(data);
  doc.save(`greenvibes-recu-${data.bookingRef}.pdf`);
}

export async function printReservationReceipt(data: ReservationReceiptData) {
  const doc = await buildReservationReceiptPdf(data);
  doc.autoPrint();
  const url = doc.output("bloburl");
  const printWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (!printWindow) return;
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}
