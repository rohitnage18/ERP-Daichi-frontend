/**
 * Parse units-per-case from catalog lotSize only:
 * - "2.5 kg * 6 unit=15 kg" → 6
 * - "5Kg*3 unit=15 kg" → 3
 * - "250ml * 40 = 10 lit" → 40
 * - "25kg * 1 = 25kg" → 1
 *
 * Do NOT treat legacy stock strings like "100 Pcs" / "50 Bags" as units-per-case
 * (that caused Qty to jump by 100 on billing).
 */
export function parseUnitsPerCase(lotSize?: string): number | null {
  if (!lotSize) return null;
  const unitMatch = lotSize.match(/\*\s*(\d+)\s*unit/i);
  if (unitMatch) return parseInt(unitMatch[1], 10);
  const caseMatch = lotSize.match(/\*\s*(\d+)\s*=/i);
  if (caseMatch) return parseInt(caseMatch[1], 10);
  return null;
}

/** Extract alternate unit label from legacy lotSize e.g. "100 Btl" → "Btl". */
export function parseAlternateUnit(lotSize?: string): string | null {
  if (!lotSize) return null;
  if (/\*\s*\d+\s*unit/i.test(lotSize) || /\*\s*\d+\s*=/i.test(lotSize)) {
    return "Case";
  }
  const packedMatch = lotSize.match(
    /^(\d+)\s*(Btl|Bottles?|Pcs|Pieces?|Bags?|Nos|Case|Box|unit|units|Pkt|Cans?)\b/i
  );
  if (packedMatch) {
    const raw = packedMatch[2];
    if (/^bottles?$/i.test(raw)) return "Btl";
    if (/^pieces?$/i.test(raw)) return "Pcs";
    if (/^bags?$/i.test(raw)) return "Bag";
    if (/^units?$/i.test(raw)) return "Nos";
    if (/^cans?$/i.test(raw)) return "Can";
    return raw;
  }
  return null;
}

/**
 * Resolve Units per Case from catalog lotSize first, then explicit product field.
 * Ignores huge legacy values stored as unitsPerAlternate when lotSize is "N Pcs/Bags".
 */
export function resolveUnitsPerCase(
  unitsPerAlternate?: number | null,
  lotSize?: string
): number | null {
  const fromLot = parseUnitsPerCase(lotSize);
  if (fromLot != null && fromLot > 0) return fromLot;

  const n = Number(unitsPerAlternate);
  if (!Number.isFinite(n) || n <= 0) return null;

  // Legacy master stock "100 Pcs" often stored unitsPerAlternate=100 — not case size.
  const legacyStock = /^\d+\s*(Btl|Bottles?|Pcs|Pieces?|Bags?|Nos|Pkt|Cans?)\b/i.test(
    lotSize || ""
  );
  if (legacyStock) return 1;

  return n;
}

/** Parse packing size amount + unit, e.g. "5Kg" → { value: 5, unit: "kg" }. */
export function parsePackingAmount(
  packingSize?: string | null
): { value: number; unit: string } | null {
  if (!packingSize) return null;
  const m = String(packingSize)
    .trim()
    .match(/^([\d.]+)\s*(kg|g|gm|ml|l|lit|ltr|nos)?/i);
  if (!m) return null;
  const value = parseFloat(m[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  let unit = (m[2] || "").toLowerCase();
  if (unit === "g") unit = "gm";
  if (unit === "l" || unit === "ltr") unit = "lit";
  return { value, unit };
}

/**
 * Build catalog-style lotSize: "5Kg*3 unit=15 kg"
 */
export function buildLotSize(
  packingSize?: string | null,
  unitsPerAlternate?: number | null,
  existingLotSize?: string | null,
  _alternateUnit?: string | null
): string {
  const units = Number(unitsPerAlternate);
  const size = (packingSize || "").trim();
  if (!(Number.isFinite(units) && units > 0)) {
    return (existingLotSize || "").trim();
  }

  if (!size) {
    return `${units} unit`;
  }

  const pack = parsePackingAmount(size);
  if (pack) {
    let total = pack.value * units;
    let totalUnit = pack.unit;
    if ((pack.unit === "gm" || pack.unit === "g") && total >= 1000 && total % 1000 === 0) {
      total = total / 1000;
      totalUnit = "kg";
    } else if (pack.unit === "ml" && total >= 1000 && total % 1000 === 0) {
      total = total / 1000;
      totalUnit = "lit";
    }
    const totalPart = totalUnit ? `=${formatNumber(total)} ${totalUnit}` : "";
    return `${size}*${units} unit${totalPart}`;
  }

  return `${size}*${units} unit`;
}

function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 1000) / 1000);
}

/** Snap qty to whole cases (multiples of units-per-case). */
export function snapQuantityToCases(quantity: number, unitsPerCase: number | null | undefined): number {
  const upc = Number(unitsPerCase);
  const q = Math.max(1, Math.floor(Number(quantity) || 1));
  if (!Number.isFinite(upc) || upc <= 1) return q;
  const cases = Math.max(1, Math.round(q / upc));
  return cases * upc;
}

/** Daichi invoice case label e.g. "(2 Case)" */
export function formatCaseLabel(
  quantity: number,
  lotSize?: string,
  unitsPerAlternate?: number | null
): string | null {
  const unitsPerCase = resolveUnitsPerCase(unitsPerAlternate, lotSize);
  if (!unitsPerCase || unitsPerCase <= 0) return null;
  const cases = quantity / unitsPerCase;
  if (!Number.isInteger(cases) || cases <= 0) return null;
  return `(${cases} Case)`;
}

/**
 * Unit shown in the invoice "per" / quantity columns.
 * Prefer product UOM / Nos — never use Case as the per-unit label.
 */
export function invoiceUnitOfMeasure(
  productUom?: string | null,
  alternateUnit?: string | null,
  lotSize?: string | null
): string {
  const uom = (productUom || "").trim();
  if (uom && !/^case$/i.test(uom)) return uom;
  const fromLot = parseAlternateUnit(lotSize || undefined);
  const alt = (alternateUnit || fromLot || "").trim();
  if (alt && !/^case$/i.test(alt) && !/^unit$/i.test(alt)) return alt;
  return "Nos";
}

export function numberToWords(num: number): string {
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  if (num === 0) return "Zero";
  if (num < 0) return "Minus " + numberToWords(-num);

  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = convert(rupees);
  if (paise > 0) result += " and " + convert(paise) + " paise";
  return result + " Only";
}

export const DAICHI_SUPPLIER = {
  name: "Daichi International",
  address: "S.No.35/2525, Om Sai Warewhouse",
  addressLine2: "Manterwadi, Urulidevachi, Tal-Haveli",
  district: "Pune",
  state: "Maharashtra",
  stateCode: "27",
  gstin: "27AAXFD5184H1ZT",
  contact: "9822504069",
  email: "accounts@daichi-international.in",
  bankName: "Canara Bank",
  bankAccountNo: "120034852783",
  bankBranch: "Hadapsar",
  bankIfsc: "CNRB0000259",
};

export const ITEMS_PER_INVOICE_PAGE = 7;
