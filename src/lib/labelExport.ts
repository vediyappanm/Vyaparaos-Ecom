import { jsPDF } from "jspdf";
import type { DbProduct } from "@/hooks/useProducts";

type TemplateKey = "a4_1up" | "a4_2up" | "a4_3up" | "thermal_1up" | "thermal_2up" | "thermal_3up";

export const LABEL_TEMPLATES: Record<
  TemplateKey,
  { name: string; page: [number, number]; cols: number; rows: number; margin: number; gap: number; thermal?: boolean }
> = {
  a4_1up: { name: "A4 · 1-up", page: [210, 297], cols: 1, rows: 1, margin: 8, gap: 4 },
  a4_2up: { name: "A4 · 2-up", page: [210, 297], cols: 1, rows: 2, margin: 8, gap: 4 },
  a4_3up: { name: "A4 · 3-up", page: [210, 297], cols: 1, rows: 3, margin: 8, gap: 4 },
  thermal_1up: { name: "Thermal · 1-up", page: [58, 40], cols: 1, rows: 1, margin: 2, gap: 1, thermal: true },
  thermal_2up: { name: "Thermal · 2-up", page: [58, 80], cols: 1, rows: 2, margin: 2, gap: 1, thermal: true },
  thermal_3up: { name: "Thermal · 3-up", page: [58, 120], cols: 1, rows: 3, margin: 2, gap: 1, thermal: true },
};

export type LabelSelection = { product: DbProduct; copies: number };

async function barcodeToDataUrl(code: string) {
  const bwipjs = await import("bwip-js");
  const canvas = document.createElement("canvas");
  bwipjs.toCanvas(canvas, {
    bcid: "code128",
    text: code,
    scale: 2,
    includetext: false,
    backgroundcolor: "FFFFFF",
  });
  return canvas.toDataURL("image/png");
}

export async function exportLabelSheetPdf(selected: LabelSelection[], templateKey: TemplateKey) {
  const template = LABEL_TEMPLATES[templateKey];
  const [pageW, pageH] = template.page;
  const doc = new jsPDF({
    unit: "mm",
    format: [pageW, pageH],
    orientation: pageW > pageH ? "landscape" : "portrait",
  });

  const labels: DbProduct[] = [];
  selected.forEach(({ product, copies }) => {
    for (let i = 0; i < Math.max(1, copies); i += 1) labels.push(product);
  });

  const slotsPerPage = template.cols * template.rows;
  const usableW = pageW - template.margin * 2;
  const usableH = pageH - template.margin * 2;
  const labelW = (usableW - (template.cols - 1) * template.gap) / template.cols;
  const labelH = (usableH - (template.rows - 1) * template.gap) / template.rows;

  let index = 0;
  while (index < labels.length) {
    if (index > 0) doc.addPage([pageW, pageH]);
    for (let slot = 0; slot < slotsPerPage && index < labels.length; slot += 1, index += 1) {
      const row = Math.floor(slot / template.cols);
      const col = slot % template.cols;
      const x = template.margin + col * (labelW + template.gap);
      const y = template.margin + row * (labelH + template.gap);
      const product = labels[index];
      const barcode = (product.barcode || product.sku || product.id.slice(0, 12)).trim();

      doc.setDrawColor(225, 225, 232);
      doc.rect(x, y, labelW, labelH);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(template.thermal ? 8 : 11);
      doc.text(product.name.slice(0, 38), x + 2.5, y + (template.thermal ? 5 : 7));

      doc.setFont("helvetica", "normal");
      doc.setFontSize(template.thermal ? 7 : 9);
      doc.text(`MRP: Rs ${Number(product.mrp || product.price || 0).toFixed(2)}`, x + 2.5, y + (template.thermal ? 8.5 : 11));

      const barcodeImg = await barcodeToDataUrl(barcode);
      const barcodeY = y + (template.thermal ? 10 : 14);
      const barcodeH = template.thermal ? labelH - 16 : labelH - 22;
      doc.addImage(barcodeImg, "PNG", x + 2.5, barcodeY, labelW - 5, Math.max(8, barcodeH));

      doc.setFontSize(template.thermal ? 6 : 8);
      const codeTextY = y + labelH - 2.5;
      doc.text(barcode, x + labelW / 2, codeTextY, { align: "center" });
    }
  }

  doc.save(`label-sheet-${templateKey}-${Date.now()}.pdf`);
}

