/**
 * Single source of truth for role → route / CTA permissions.
 * Keep in sync with backend requireRole() checks.
 */

export type AppRole =
  | "SALES_MARKETING"
  | "MANAGEMENT_ADMIN"
  | "PRODUCTION_LOGISTICS"
  | "ACCOUNT";

export function canCreateOrder(role?: string | null): boolean {
  return role === "SALES_MARKETING" || role === "MANAGEMENT_ADMIN";
}

export function canCreateDealer(role?: string | null): boolean {
  return role === "SALES_MARKETING" || role === "MANAGEMENT_ADMIN";
}

export function canCreateProduct(role?: string | null): boolean {
  return role === "MANAGEMENT_ADMIN";
}

export function canSyncDealers(role?: string | null): boolean {
  return role === "SALES_MARKETING" || role === "MANAGEMENT_ADMIN";
}

export function canApprove(role?: string | null): boolean {
  return role === "MANAGEMENT_ADMIN";
}

/** Paths each role must not open (layout redirects to /dashboard). */
export const roleBlockedPrefixes: Record<string, string[]> = {
  MANAGEMENT_ADMIN: [
    "/dashboard/recommendations",
    "/dashboard/billing",
    "/dashboard/logistics",
    "/dashboard/inventory",
    "/dashboard/finance",
  ],
  PRODUCTION_LOGISTICS: [
    "/dashboard/field",
    "/dashboard/recommendations",
    "/dashboard/billing",
    "/dashboard/dealers/new",
    "/dashboard/orders/new",
    "/dashboard/products/new",
    "/dashboard/approvals",
    "/dashboard/settings",
  ],
  ACCOUNT: [
    "/dashboard/field",
    "/dashboard/recommendations",
    "/dashboard/logistics",
    "/dashboard/inventory",
    "/dashboard/approvals",
    "/dashboard/settings",
    "/dashboard/products/new",
    "/dashboard/orders/new",
    "/dashboard/dealers/new",
  ],
  SALES_MARKETING: [
    "/dashboard/billing",
    "/dashboard/logistics",
    "/dashboard/inventory",
    "/dashboard/approvals",
    "/dashboard/settings",
    "/dashboard/products/new",
  ],
};

export function isPathBlockedForRole(
  pathname: string,
  role?: string | null
): boolean {
  if (!role || !pathname) return false;
  const blocked = roleBlockedPrefixes[role];
  if (!blocked) return false;
  return blocked.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
