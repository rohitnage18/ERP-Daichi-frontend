/**
 * Parse units-per-case from lotSize strings:
 * - "2.5 kg * 6 unit=15 kg" → 6
 * - "250ml * 40 = 10 lit" → 40
 * - "100 Btl" / "100 Pcs" / "50 Bags" → 100
 */
export function parseUnitsPerCase(lotSize?: string): number | null {
  if (!lotSize) return null;
  const unitMatch = lotSize.match(/\*\s*(\d+)\s*unit/i);
  if (unitMatch) return parseInt(unitMatch[1], 10);
  const caseMatch = lotSize.match(/\*\s*(\d+)\s*=/i);
  if (caseMatch) return parseInt(caseMatch[1], 10);
  const packedMatch = lotSize.match(
    /^(\d+)\s*(Btl|Bottles?|Pcs|Pieces?|Bags?|Nos|Case|Box|unit|units)\b/i
  );
  if (packedMatch) return parseInt(packedMatch[1], 10);
  return null;
}

/** Extract alternate unit label from lotSize e.g. "100 Btl" → "Btl". */
export function parseAlternateUnit(lotSize?: string): string | null {
  if (!lotSize) return null;
  const packedMatch = lotSize.match(
    /^(\d+)\s*(Btl|Bottles?|Pcs|Pieces?|Bags?|Nos|Case|Box|unit|units)\b/i
  );
  if (packedMatch) {
    const raw = packedMatch[2];
    if (/^bottles?$/i.test(raw)) return "Btl";
    if (/^pieces?$/i.test(raw)) return "Pcs";
    if (/^bags?$/i.test(raw)) return "Bag";
    if (/^units?$/i.test(raw)) return "Nos";
    return raw;
  }
  return null;
}

/**
 * Resolve Units per Case: prefer explicit unitsPerAlternate from the product,
 * otherwise parse from the lotSize string.
 */
export function resolveUnitsPerCase(
  unitsPerAlternate?: number | null,
  lotSize?: string
): number | null {
  const n = Number(unitsPerAlternate);
  if (Number.isFinite(n) && n > 0) return n;
  return parseUnitsPerCase(lotSize);
}

/**
 * Build the lotSize string used on invoices when packing + units-per-case are known.
 */
export function buildLotSize(
  packingSize?: string | null,
  unitsPerAlternate?: number | null,
  existingLotSize?: string | null,
  alternateUnit?: string | null
): string {
  const units = Number(unitsPerAlternate);
  const size = (packingSize || "").trim();
  const alt = (alternateUnit || parseAlternateUnit(existingLotSize || "") || "Case").trim();
  if (Number.isFinite(units) && units > 0) {
    if (size) return `${size} * ${units} unit`;
    return `${units} ${alt}`;
  }
  return (existingLotSize || "").trim();
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
 * Prefer the packing alternate (Btl, Pcs, …), then product UOM — never force Nos.
 */
export function invoiceUnitOfMeasure(
  productUom?: string | null,
  alternateUnit?: string | null,
  lotSize?: string | null
): string {
  const fromLot = parseAlternateUnit(lotSize || undefined);
  const alt = (alternateUnit || fromLot || "").trim();
  if (alt) return alt;
  const uom = (productUom || "").trim();
  if (uom) return uom;
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
