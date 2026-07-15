import type { jsPDF } from "jspdf";
import { GState } from "jspdf";
import logoUrl from "@/assets/logo.jpg";
import { AGENCY_CONTACT } from "@/lib/constants";

let logoDataUrlCache: string | null = null;

export async function getLogoDataUrl(): Promise<string> {
  if (logoDataUrlCache) return logoDataUrlCache;
  const response = await fetch(logoUrl);
  const blob = await response.blob();
  logoDataUrlCache = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  return logoDataUrlCache;
}

/** Low-opacity logo layered on top of the page content (watermark). */
export async function drawPdfLogoWatermark(doc: jsPDF, opacity = 0.1) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const size = Math.min(pageWidth, pageHeight) * 0.55;
  const x = (pageWidth - size) / 2;
  const y = (pageHeight - size) / 2;

  const logo = await getLogoDataUrl();
  doc.setGState(new GState({ opacity }));
  doc.addImage(logo, "JPEG", x, y, size, size, undefined, "FAST");
  doc.setGState(new GState({ opacity: 1 }));
}

export function agencyContactLines() {
  return [
    AGENCY_CONTACT.name,
    AGENCY_CONTACT.address,
    `Tél. ${AGENCY_CONTACT.phoneDisplay}`,
    `Email ${AGENCY_CONTACT.email}`,
    "Instagram @gree.n_vibes",
  ];
}

export function agencyContactHtml() {
  return `
    <div class="contact-footer">
      <strong>${AGENCY_CONTACT.name}</strong><br />
      ${AGENCY_CONTACT.address}<br />
      Tél. <a href="tel:${AGENCY_CONTACT.phone}">${AGENCY_CONTACT.phoneDisplay}</a><br />
      Email <a href="mailto:${AGENCY_CONTACT.email}">${AGENCY_CONTACT.email}</a><br />
      Instagram @gree.n_vibes
    </div>
  `;
}

export function printDocumentStyles() {
  return `
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, sans-serif;
      color: #0a120c;
      margin: 0;
      padding: 28px 32px 40px;
      position: relative;
    }
    .print-watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      width: min(72vw, 320px);
      transform: translate(-50%, -50%);
      opacity: 0.1;
      pointer-events: none;
      z-index: 1000;
    }
    .print-header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #2d6a4f;
    }
    .print-header img.logo {
      width: 52px;
      height: 52px;
      border-radius: 999px;
      object-fit: cover;
    }
    .print-header h1 {
      margin: 0;
      font-size: 1.35rem;
      color: #2d6a4f;
    }
    .print-header p {
      margin: 4px 0 0;
      font-size: 0.85rem;
      color: #5c6b60;
    }
    .contact-footer {
      margin-top: 28px;
      padding: 14px 16px;
      border: 1px solid #d8e3dc;
      border-radius: 12px;
      background: #f7faf8;
      font-size: 0.82rem;
      line-height: 1.65;
      color: #3d4f44;
    }
    .contact-footer a {
      color: #2d6a4f;
      text-decoration: none;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
      position: relative;
      z-index: 1;
    }
    th, td {
      border: 1px solid #d8e3dc;
      padding: 8px 10px;
      text-align: left;
    }
    th {
      background: #eef5f0;
      color: #2d6a4f;
      font-weight: 600;
    }
    @media print {
      body { padding: 12mm 14mm 16mm; }
      .print-watermark { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  `;
}

export function printWatermarkHtml() {
  return `<img src="${logoUrl}" alt="" class="print-watermark" aria-hidden="true" />`;
}

export function printHeaderHtml(title: string, subtitle?: string) {
  return `
    <div class="print-header">
      <img src="${logoUrl}" alt="GreenVibes" class="logo" />
      <div>
        <h1>${title}</h1>
        ${subtitle ? `<p>${subtitle}</p>` : ""}
      </div>
    </div>
  `;
}
