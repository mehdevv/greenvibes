import { jsPDF } from "jspdf";
import { drawPdfPrintingWatermark } from "@/lib/print-branding";

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

const INK = [17, 17, 17] as const;
const MUTED = [68, 68, 68] as const;
const BORDER = [34, 34, 34] as const;

function drawLabelValueRow(
  doc: jsPDF,
  label: string,
  value: string,
  y: number,
  margin: number,
  pageWidth: number,
  valueSize = 11,
): number {
  const valueX = margin + 42;
  const valueWidth = pageWidth - margin - valueX;
  const valueLines = doc.splitTextToSize(value, valueWidth);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(label.toUpperCase(), margin, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(valueSize);
  doc.setTextColor(...INK);
  doc.text(valueLines, valueX, y);

  const rowHeight = Math.max(8, valueLines.length * 5);
  const lineY = y + rowHeight;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(margin, lineY, pageWidth - margin, lineY);

  return lineY + 8;
}

export async function buildReservationReceiptPdf(data: ReservationReceiptData): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  let y = 22;

  await drawPdfPrintingWatermark(doc, 0.09);

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("GREENVIBES", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(`Réf. ${data.bookingRef}`, pageWidth - margin, y, { align: "right" });

  y += 14;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;

  const fullName = `${data.firstName} ${data.lastName}`.trim();
  y = drawLabelValueRow(doc, "Nom", fullName, y, margin, pageWidth, 14);
  y = drawLabelValueRow(doc, "Téléphone", data.phone, y, margin, pageWidth, 12);
  y = drawLabelValueRow(doc, "Localisation", data.location, y, margin, pageWidth, 12);

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
