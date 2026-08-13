/**
 * Loose product search: "15 30 15", "15:30:15", "5kg", "swsf012" all match.
 */
export function compactText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function productSearchHaystack(p: {
  name?: string | null;
  productCode?: string | null;
  hsnCode?: string | null;
  categoryName?: string | null;
  packingSize?: string | null;
  lotSize?: string | null;
}): string {
  return [
    p.name,
    p.productCode,
    p.hsnCode,
    p.categoryName,
    p.packingSize,
    p.lotSize,
  ]
    .filter(Boolean)
    .join(" ");
}

export function matchesProductSearch(
  product: Parameters<typeof productSearchHaystack>[0],
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = productSearchHaystack(product).toLowerCase();
  const hayCompact = compactText(hay);
  const qCompact = compactText(q);
  if (qCompact.length >= 2 && hayCompact.includes(qCompact)) return true;
  const tokens = q.split(/[\s,/._-]+/).filter((t) => t.length > 0);
  return tokens.every(
    (t) => hay.includes(t) || hayCompact.includes(compactText(t))
  );
}
