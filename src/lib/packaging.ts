// Packaging configuration shared by product create/edit forms.
// Mirrors Daichi's Tally stock-item setup (e.g. 1 Case = 6 Nos, GST 5%).

export type PackingType = "LIQUID" | "POWDER_GRANULES";

export const PACKING_TYPE_OPTIONS: { value: PackingType; label: string }[] = [
  { value: "LIQUID", label: "Liquid" },
  { value: "POWDER_GRANULES", label: "Powder / Granules" },
];

export const PACKING_SIZES: Record<PackingType, string[]> = {
  LIQUID: [
    "15 ML",
    "30 ML",
    "75 ML",
    "100 ML",
    "150 ML",
    "250 ML",
    "500 ML",
    "1 Litre",
    "5 Litre",
    "20 Litre",
  ],
  POWDER_GRANULES: [
    "5 gm",
    "10 gm",
    "50 gm",
    "100 gm",
    "250 gm",
    "500 gm",
    "1 Kg",
    "2 Kg",
    "2.5 Kg",
    "5 Kg",
    "25 Kg",
    "50 Kg",
  ],
};

export const ALTERNATE_UNIT_OPTIONS = ["Case", "Box", "Bag"] as const;

export const UNIT_OF_MEASURE_OPTIONS: { value: string; label: string }[] = [
  { value: "Nos", label: "Nos" },
  { value: "Kg", label: "Kilogram (Kg)" },
  { value: "Ltr", label: "Litre (Ltr)" },
  { value: "Gm", label: "Gram (Gm)" },
  { value: "Packet", label: "Packet" },
  { value: "Bag", label: "Bag" },
];

export const GST_RATE_OPTIONS: { value: string; label: string }[] = [
  { value: "5", label: "5% (standard fertilisers)" },
  { value: "18", label: "18% (Cal 11 / Thio Cal / pesticides)" },
  { value: "0", label: "0%" },
  { value: "12", label: "12%" },
  { value: "28", label: "28%" },
];

/** Human-readable packing label e.g. "5 Kg × 3 unit / case". */
export function conversionLabel(
  alternateUnit?: string,
  unitsPerAlternate?: number | string,
  unitOfMeasure = "Nos",
  packingSize?: string
): string | null {
  const n = Number(unitsPerAlternate);
  if (!n || n <= 0) return null;
  if (packingSize?.trim()) {
    return `${packingSize.trim()} × ${n} unit / case`;
  }
  if (!alternateUnit) return `${n} ${unitOfMeasure} / case`;
  return `${n} ${unitOfMeasure} / ${alternateUnit}`;
}
