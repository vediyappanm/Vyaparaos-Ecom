import jsPDF from "jspdf";
import QRCode from "qrcode";
import { STORE } from "@/data/mockData";
import { formatINR } from "./format";

export type InvoiceItem = {
  name: string;
  hsnCode: string;
  qty: number;
  unit: string;
  unitPrice: number; // pre-tax
  taxRate: number; // %
};

export type InvoiceData = {
  invoiceNumber: string;
  date: Date;
  customerName: string;
  customerPhone?: string;
  customerGstin?: string;
  customerAddress?: string;
  items: InvoiceItem[];
  paymentMode: string;
  isInterstate?: boolean;
  notes?: string;
};

const PRIMARY: [number, number, number] = [30, 58, 95];
const ACCENT: [number, number, number] = [255, 107, 53];
const MUTED: [number, number, number] = [110, 120, 140];
const LIGHT: [number, number, number] = [240, 244, 250];

export const generateInvoicePDF = async (data: InvoiceData) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  let y = 0;

  // === HEADER BAND ===
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageW, 32, "F");
  doc.setFillColor(...ACCENT);
  doc.rect(0, 32, pageW, 1.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(STORE.name, 14, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`${STORE.address}, ${STORE.city}, ${STORE.state} - ${STORE.pincode}`, 14, 19.5);
  doc.text(`Phone: ${STORE.phone}  |  Email: ${STORE.email}`, 14, 24);
  doc.setFont("helvetica", "bold");
  doc.text(`GSTIN: ${STORE.gstin}`, 14, 28.5);

  // Invoice title (right side)
  doc.setFontSize(22);
  doc.text("TAX INVOICE", pageW - 14, 16, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Original for Recipient", pageW - 14, 21, { align: "right" });

  y = 42;

  // === META ROW ===
  doc.setTextColor(...MUTED);
  doc.setFontSize(8);
  doc.text("INVOICE NO.", 14, y);
  doc.text("INVOICE DATE", 70, y);
  doc.text("PAYMENT MODE", 130, y);
  doc.text("PLACE OF SUPPLY", 170, y);

  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(data.invoiceNumber, 14, y + 5);
  doc.text(data.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), 70, y + 5);
  doc.text(data.paymentMode, 130, y + 5);
  doc.text(STORE.state, 170, y + 5);

  y += 12;

  // === BILL TO / SHIP TO ===
  doc.setDrawColor(...LIGHT);
  doc.setFillColor(248, 250, 253);
  doc.roundedRect(14, y, pageW - 28, 24, 2, 2, "F");

  doc.setTextColor(...MUTED);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO", 18, y + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY);
  doc.text(data.customerName, 18, y + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(60, 70, 90);
  let infoY = y + 16;
  if (data.customerPhone) { doc.text(`Phone: ${data.customerPhone}`, 18, infoY); infoY += 4; }
  if (data.customerGstin) { doc.text(`GSTIN: ${data.customerGstin}`, 18, infoY); infoY += 4; }
  if (data.customerAddress) { doc.text(data.customerAddress, 18, infoY); }

  y += 30;

  // === ITEMS TABLE ===
  const cols = [
    { key: "sn", label: "#", x: 14, w: 8, align: "left" as const },
    { key: "name", label: "ITEM DESCRIPTION", x: 22, w: 70, align: "left" as const },
    { key: "hsn", label: "HSN", x: 92, w: 14, align: "left" as const },
    { key: "qty", label: "QTY", x: 106, w: 14, align: "right" as const },
    { key: "rate", label: "RATE", x: 120, w: 22, align: "right" as const },
    { key: "tax", label: "GST%", x: 142, w: 14, align: "right" as const },
    { key: "amt", label: "AMOUNT", x: 156, w: 40, align: "right" as const },
  ];

  // Table header
  doc.setFillColor(...PRIMARY);
  doc.rect(14, y, pageW - 28, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  cols.forEach(c => {
    doc.text(c.label, c.align === "right" ? c.x + c.w - 2 : c.x + 1, y + 5.3, { align: c.align });
  });

  y += 8;

  // Rows + totals tracking
  let subtotal = 0;
  let totalCgst = 0, totalSgst = 0, totalIgst = 0;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(40, 50, 70);

  data.items.forEach((item, i) => {
    const lineSubtotal = item.qty * item.unitPrice;
    const taxAmt = (lineSubtotal * item.taxRate) / 100;
    const lineTotal = lineSubtotal + taxAmt;
    subtotal += lineSubtotal;
    if (data.isInterstate) totalIgst += taxAmt;
    else { totalCgst += taxAmt / 2; totalSgst += taxAmt / 2; }

    if (i % 2 === 1) {
      doc.setFillColor(250, 251, 253);
      doc.rect(14, y, pageW - 28, 7, "F");
    }
    const row = [
      String(i + 1), item.name, item.hsnCode,
      `${item.qty} ${item.unit}`,
      formatINR(item.unitPrice),
      `${item.taxRate}%`,
      formatINR(lineTotal),
    ];
    row.forEach((val, idx) => {
      const c = cols[idx];
      doc.text(val, c.align === "right" ? c.x + c.w - 2 : c.x + 1, y + 4.8, { align: c.align });
    });
    y += 7;
  });

  // Bottom border
  doc.setDrawColor(220, 226, 236);
  doc.line(14, y, pageW - 14, y);
  y += 4;

  // === TOTALS BLOCK (right) + QR (left) ===
  const totalsX = 120;
  const labelX = totalsX;
  const valX = pageW - 16;

  const grandTotal = subtotal + totalCgst + totalSgst + totalIgst;

  // QR code with UPI payment link (left)
  const upiLink = `upi://pay?pa=${STORE.upiId}&pn=${encodeURIComponent(STORE.name)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${data.invoiceNumber}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(upiLink, { margin: 1, width: 200, color: { dark: "#1E3A5F", light: "#FFFFFF" } });
    doc.addImage(qrDataUrl, "PNG", 14, y, 30, 30);
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "bold");
    doc.text("Pay via UPI", 47, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`UPI ID: ${STORE.upiId}`, 47, y + 9);
    doc.text("Scan with any UPI app", 47, y + 13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ACCENT);
    doc.text(formatINR(grandTotal), 47, y + 18);
  } catch {}

  // Totals
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");

  const drawTotalRow = (label: string, value: string, opts: { bold?: boolean; accent?: boolean } = {}) => {
    if (opts.bold) doc.setFont("helvetica", "bold"); else doc.setFont("helvetica", "normal");
    const labelColor: [number, number, number] = opts.accent ? PRIMARY : MUTED;
    doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
    doc.text(label, labelX, y + 4);
    const valColor: [number, number, number] = opts.accent ? PRIMARY : [40, 50, 70];
    doc.setTextColor(valColor[0], valColor[1], valColor[2]);
    doc.text(value, valX, y + 4, { align: "right" });
    y += 5.5;
  };

  drawTotalRow("Subtotal", formatINR(subtotal));
  if (data.isInterstate) {
    drawTotalRow(`IGST`, formatINR(totalIgst));
  } else {
    drawTotalRow(`CGST`, formatINR(totalCgst));
    drawTotalRow(`SGST`, formatINR(totalSgst));
  }

  // Grand total bar
  y += 1;
  doc.setFillColor(...PRIMARY);
  doc.rect(totalsX - 4, y, pageW - 14 - (totalsX - 4), 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("GRAND TOTAL", labelX, y + 6.5);
  doc.setFontSize(13);
  doc.text(formatINR(grandTotal), valX, y + 6.7, { align: "right" });
  y += 14;

  // === Amount in words ===
  doc.setTextColor(...MUTED);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  doc.text(`Amount in words: ${numberToWordsINR(grandTotal)}`, 14, y);
  y += 6;

  // === Footer: Terms + signature ===
  y = Math.max(y, 250);
  doc.setDrawColor(...LIGHT);
  doc.line(14, y, pageW - 14, y);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...PRIMARY);
  doc.text("Terms & Conditions", 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text("1. Goods once sold will not be taken back.", 14, y + 4);
  doc.text("2. Subject to local jurisdiction. E. & O.E.", 14, y + 7.5);
  doc.text("3. Interest @ 18% p.a. on overdue bills.", 14, y + 11);

  // Signature
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY);
  doc.setFontSize(9);
  doc.text(`For ${STORE.name}`, pageW - 14, y, { align: "right" });
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("Authorised Signatory", pageW - 14, y + 18, { align: "right" });
  doc.setDrawColor(180, 190, 210);
  doc.line(pageW - 60, y + 14, pageW - 14, y + 14);

  // Bottom band
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 287, pageW, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for your business!", pageW / 2, 293.5, { align: "center" });
  doc.setFontSize(7);
  doc.setTextColor(255, 200, 170);
  doc.text("Generated by VyaparOS · Commerce OS for Bharat", pageW / 2, 297, { align: "center" });

  return doc;
};

// ─── Number to words (Indian system) ────────────────────────────
const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const twoDigit = (n: number): string => {
  if (n < 20) return ones[n];
  return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
};

const threeDigit = (n: number): string => {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return (h ? ones[h] + " Hundred" + (r ? " " : "") : "") + (r ? twoDigit(r) : "");
};

export const numberToWordsINR = (amount: number): string => {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  if (rupees === 0 && paise === 0) return "Zero Rupees Only";

  let n = rupees;
  let words = "";
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  const hundred = n;

  if (crore) words += threeDigit(crore) + " Crore ";
  if (lakh) words += twoDigit(lakh) + " Lakh ";
  if (thousand) words += twoDigit(thousand) + " Thousand ";
  if (hundred) words += threeDigit(hundred);
  words = words.trim();

  let result = `${words || "Zero"} Rupees`;
  if (paise) result += ` and ${twoDigit(paise)} Paise`;
  return result + " Only";
};
