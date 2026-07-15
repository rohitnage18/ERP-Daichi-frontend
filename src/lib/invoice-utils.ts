/** Parse units-per-case from lotSize e.g. "2.5 kg * 6 unit=15 kg" → 6, "250ml * 40 = 10 lit" → 40 */
export function parseUnitsPerCase(lotSize?: string): number | null {
  if (!lotSize) return null;
  const unitMatch = lotSize.match(/\*\s*(\d+)\s*unit/i);
  if (unitMatch) return parseInt(unitMatch[1], 10);
  const caseMatch = lotSize.match(/\*\s*(\d+)\s*=/i);
  if (caseMatch) return parseInt(caseMatch[1], 10);
  return null;
}

/** Daichi invoice case label e.g. "(2 Case)" */
export function formatCaseLabel(quantity: number, lotSize?: string): string | null {
  const unitsPerCase = parseUnitsPerCase(lotSize);
  if (!unitsPerCase || unitsPerCase <= 0) return null;
  const cases = quantity / unitsPerCase;
  if (!Number.isInteger(cases) || cases <= 0) return null;
  return `(${cases} Case)`;
}

/** Invoice line uses "Nos" per Daichi tax invoice PDFs */
export function invoiceUnitOfMeasure(_productUom?: string): string {
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
