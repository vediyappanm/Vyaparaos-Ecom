type ProductLike = {
  name?: string | null;
  category?: string | null;
  barcode?: string | null;
  sku?: string | null;
};

export type BarcodeAnalysis = {
  valid: boolean;
  format: "EAN13" | "EAN8" | "UPC" | "CODE128" | "UNKNOWN";
  warnings: string[];
  suggestions: string[];
};

const digitsOnly = (value: string) => value.replace(/\D/g, "");

export const normalizeBarcode = (value: string) => value.trim().replace(/\s+/g, "");

export const generateSkuFromName = (name: string, category?: string | null) => {
  const prefix = (category || "GEN").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3).padEnd(3, "X");
  const base = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6).padEnd(6, "X");
  const stamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `${prefix}-${base}-${stamp}`;
};

export const computeEAN13CheckDigit = (ean12: string) => {
  if (!/^\d{12}$/.test(ean12)) throw new Error("EAN13 requires 12 digits before checksum");
  const sum = ean12
    .split("")
    .map(Number)
    .reduce((acc, digit, index) => acc + digit * (index % 2 === 0 ? 1 : 3), 0);
  return String((10 - (sum % 10)) % 10);
};

export const isValidEAN13 = (value: string) => {
  const digits = digitsOnly(value);
  if (!/^\d{13}$/.test(digits)) return false;
  return computeEAN13CheckDigit(digits.slice(0, 12)) === digits[12];
};

export const generateEAN13 = (seed: string, existing: string[] = []) => {
  const compressed = digitsOnly(seed).padEnd(12, "0").slice(0, 12);
  let candidate12 = compressed;
  let attempts = 0;

  while (attempts < 50) {
    const checksum = computeEAN13CheckDigit(candidate12);
    const full = `${candidate12}${checksum}`;
    if (!existing.includes(full)) return full;
    const numeric = (BigInt(candidate12) + BigInt(1)).toString().padStart(12, "0").slice(-12);
    candidate12 = numeric;
    attempts += 1;
  }
  throw new Error("Unable to generate unique EAN-13 barcode");
};

export const analyzeBarcode = (value: string): BarcodeAnalysis => {
  const code = normalizeBarcode(value);
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let format: BarcodeAnalysis["format"] = "UNKNOWN";
  let valid = false;

  if (/^\d{13}$/.test(code)) {
    format = "EAN13";
    valid = isValidEAN13(code);
    if (!valid) warnings.push("EAN-13 checksum is invalid.");
  } else if (/^\d{8}$/.test(code)) {
    format = "EAN8";
    valid = true;
  } else if (/^\d{12}$/.test(code)) {
    format = "UPC";
    valid = true;
  } else if (/^[A-Za-z0-9\-. $/+%]{6,40}$/.test(code)) {
    format = "CODE128";
    valid = true;
    if (code.length > 24) warnings.push("Very long barcode may scan slower on low-end devices.");
  } else {
    format = "UNKNOWN";
    valid = false;
    warnings.push("Barcode format is not recognized.");
  }

  if (format === "UNKNOWN") {
    suggestions.push("Use EAN-13 for retail products or CODE128 for internal stock labels.");
  }
  if (!valid && /^\d{12,13}$/.test(code)) {
    suggestions.push("Try regenerating as EAN-13 with a valid check digit.");
  }
  if (valid && code.startsWith("0000")) {
    warnings.push("Barcode prefix looks synthetic; avoid collision with live catalog.");
  }

  return { valid, format, warnings, suggestions };
};

export const recommendSmartCodes = (product: ProductLike, existingProducts: ProductLike[] = []) => {
  const existingBarcodes = new Set(
    existingProducts
      .map((p) => normalizeBarcode(String(p.barcode || "")))
      .filter(Boolean)
  );
  const existingSkus = new Set(
    existingProducts
      .map((p) => String(p.sku || "").trim().toUpperCase())
      .filter(Boolean)
  );

  const seedText = `${product.category || "GEN"}${product.name || "ITEM"}`.toUpperCase();
  const seedDigits = seedText
    .replace(/[^A-Z0-9]/g, "")
    .split("")
    .map((ch) => (/\d/.test(ch) ? ch : String((ch.charCodeAt(0) - 55) % 10)))
    .join("")
    .padEnd(12, "7")
    .slice(0, 12);

  let barcode = generateEAN13(seedDigits, Array.from(existingBarcodes));
  let sku = generateSkuFromName(product.name || "ITEM", product.category);

  while (existingSkus.has(sku.toUpperCase())) {
    sku = generateSkuFromName(`${product.name || "ITEM"}${Math.floor(Math.random() * 9)}`, product.category);
  }

  const qualitySignals = [
    "EAN-13 gives strong scanner compatibility across POS devices.",
    "SKU is generated with category + name fingerprint + short entropy tail.",
  ];

  const analysis = analyzeBarcode(barcode);
  if (!analysis.valid) {
    barcode = generateEAN13(`${Date.now()}`.slice(-12), Array.from(existingBarcodes));
  }

  return {
    sku,
    barcode,
    reasoning: qualitySignals,
    confidence: 0.92,
  };
};
