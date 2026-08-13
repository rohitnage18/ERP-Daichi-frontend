/** Pesticide category labels (A–D). */
export const PESTICIDE_CATEGORY_PREFIXES = ["A - ", "B - ", "C - ", "D - "] as const;

export function isPesticideCategoryLabel(label: string): boolean {
  return PESTICIDE_CATEGORY_PREFIXES.some((p) => label.startsWith(p));
}

export type CategoryOption = {
  id: string;
  label: string;
  name?: string;
};

export function splitProductCategories(categories: CategoryOption[]) {
  const other: CategoryOption[] = [];
  const pesticide: CategoryOption[] = [];
  for (const c of categories) {
    const label = c.label || c.name || "";
    if (isPesticideCategoryLabel(label)) pesticide.push(c);
    else other.push(c);
  }
  // Keep A→D order
  pesticide.sort((a, b) => (a.label || "").localeCompare(b.label || ""));
  return { other, pesticide };
}
