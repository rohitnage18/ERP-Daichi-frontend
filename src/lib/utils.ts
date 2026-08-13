import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type DateInput =
  | Date
  | string
  | number
  | null
  | undefined
  | { $date?: string | number }
  | { toISOString?: () => string };

/** Parse API/Mongo date values safely — never throws. */
export function parseValidDate(value: DateInput): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "object") {
    if ("$date" in value && value.$date != null) {
      return parseValidDate(value.$date);
    }
    if (
      "toISOString" in value &&
      typeof (value as { toISOString?: () => string }).toISOString === "function"
    ) {
      return parseValidDate((value as { toISOString: () => string }).toISOString());
    }
    return null;
  }
  if (typeof value === "number" && !Number.isFinite(value)) return null;
  if (typeof value === "string" && (value === "Invalid Date" || value === "null")) {
    return null;
  }

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatCurrency(amount: number | null | undefined): string {
  const n = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(n);
}

export function formatDate(date: DateInput, fallback = "—"): string {
  const d = parseValidDate(date);
  if (!d) return fallback;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: DateInput, fallback = "—"): string {
  const d = parseValidDate(date);
  if (!d) return fallback;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Daichi invoice date format e.g. 25-Apr-26 */
export function formatInvoiceDate(date: DateInput, fallback = ""): string {
  const d = parseValidDate(date);
  if (!d) return fallback;
  const day = d.getDate();
  const month = d.toLocaleString("en-IN", { month: "short" });
  const year = String(d.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

/** Indian amount without currency symbol for invoice tables */
export function formatInvoiceAmount(amount: number | null | undefined): string {
  const n = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function generateInvoiceNumber(sequence: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const seq = String(sequence).padStart(5, "0");
  return `XV/INV/${year}-${month}/${seq}`;
}

export function generateCreditNoteNumber(sequence: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const seq = String(sequence).padStart(5, "0");
  return `XV/CN/${year}-${month}/${seq}`;
}

export function generateOrderNumber(sequence: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const seq = String(sequence).padStart(5, "0");
  return `XV/ORD/${year}-${month}/${seq}`;
}

export function generateDispatchNumber(sequence: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const seq = String(sequence).padStart(5, "0");
  return `XV/DSP/${year}-${month}/${seq}`;
}

export function generateDealerCode(districtCode: string, sequence: number): string {
  const seq = String(sequence).padStart(4, "0");
  return `XV/${districtCode}/${seq}`;
}

export function calculateDueDate(invoiceDate: Date | string, creditPeriod: string): Date {
  const base = parseValidDate(invoiceDate) ?? new Date();
  const days = creditPeriod === "DAYS_45" ? 45 : 60;
  const dueDate = new Date(base);
  dueDate.setDate(dueDate.getDate() + days);
  return dueDate;
}

export function getAgingBucket(dueDate: Date | string | null | undefined): string {
  const parsed = parseValidDate(dueDate);
  if (!parsed) return "Unknown";

  const today = new Date();
  const diffTime = today.getTime() - parsed.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Current";
  if (diffDays <= 30) return "0-30 Days";
  if (diffDays <= 45) return "31-45 Days";
  if (diffDays <= 60) return "46-60 Days";
  return "60+ Days";
}
