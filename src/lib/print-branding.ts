import type { jsPDF } from "jspdf";
import { GState } from "jspdf";
import printingBgUrl from "@/assets/PRINTING bg.png";

let printingBgDataUrlCache: string | null = null;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Grayscale printing badge for unified black & white documents. */
export async function getPrintingBgDataUrl(): Promise<string> {
  if (printingBgDataUrlCache) return printingBgDataUrlCache;

  const img = await loadImage(printingBgUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  for (let i = 0; i < pixels.length; i += 4) {
    const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    pixels[i] = pixels[i + 1] = pixels[i + 2] = gray;
  }
  ctx.putImageData(imageData, 0, 0);

  printingBgDataUrlCache = canvas.toDataURL("image/png");
  return printingBgDataUrlCache;
}

/** Large low-opacity watermark centered on the page. */
export async function drawPdfPrintingWatermark(doc: jsPDF, opacity = 0.09) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const size = Math.min(pageWidth, pageHeight) * 0.9;
  const x = (pageWidth - size) / 2;
  const y = (pageHeight - size) / 2;

  const bg = await getPrintingBgDataUrl();
  doc.setGState(new GState({ opacity }));
  doc.addImage(bg, "PNG", x, y, size, size, undefined, "FAST");
  doc.setGState(new GState({ opacity: 1 }));
}

export function printDocumentStyles() {
  return `
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, sans-serif;
      color: #111;
      background: #fff;
      margin: 0;
      padding: 28px 32px 40px;
      position: relative;
    }
    .print-watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      width: min(92vw, 560px);
      transform: translate(-50%, -50%);
      opacity: 0.09;
      filter: grayscale(100%) contrast(1.15);
      pointer-events: none;
      z-index: 0;
    }
    .print-content {
      position: relative;
      z-index: 1;
    }
    .print-header {
      margin-bottom: 24px;
      padding-bottom: 14px;
      border-bottom: 2px solid #111;
    }
    .print-header h1 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #111;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }
    .print-header p {
      margin: 6px 0 0;
      font-size: 0.85rem;
      color: #444;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    th, td {
      border: 1px solid #222;
      padding: 10px 12px;
      text-align: left;
    }
    th {
      background: #f2f2f2;
      color: #111;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.04em;
    }
    td {
      color: #111;
      font-weight: 500;
    }
    @media print {
      body { padding: 12mm 14mm 16mm; }
      .print-watermark {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  `;
}

export function printWatermarkHtml() {
  return `<img src="${printingBgUrl}" alt="" class="print-watermark" aria-hidden="true" />`;
}

export function printHeaderHtml(title: string, subtitle?: string) {
  return `
    <div class="print-header">
      <h1>${title}</h1>
      ${subtitle ? `<p>${subtitle}</p>` : ""}
    </div>
  `;
}
