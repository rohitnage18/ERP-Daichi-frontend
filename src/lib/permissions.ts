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

/**
 * Deny-list of path prefixes. More specific allows (e.g. profile) are checked first.
 * Prefer blocking whole modules; allow exceptions via `roleAllowedPrefixes`.
 */
export const roleAllowedPrefixes: Record<string, string[]> = {
  SALES_MARKETING: ["/dashboard/settings/profile"],
  PRODUCTION_LOGISTICS: ["/dashboard/settings/profile"],
  ACCOUNT: ["/dashboard/settings/profile"],
  MANAGEMENT_ADMIN: [],
};

/** Paths each role must not open (layout redirects to /dashboard). */
export const roleBlockedPrefixes: Record<string, string[]> = {
  MANAGEMENT_ADMIN: [
    "/dashboard/recommendations",
    "/dashboard/billing",
    "/dashboard/logistics",
    "/dashboard/inventory",
    // finance module is for Account/Logistics; admin uses Approvals + Reports
    "/dashboard/finance",
  ],
  PRODUCTION_LOGISTICS: [
    "/dashboard/field",
    "/dashboard/recommendations",
    "/dashboard/billing",
    "/dashboard/dealers",
    "/dashboard/dealers/new",
    "/dashboard/orders/new",
    "/dashboard/products/new",
    "/dashboard/approvals",
    "/dashboard/settings",
    "/dashboard/reports",
    "/dashboard/finance/payments",
    "/dashboard/finance/credit-notes",
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
    "/dashboard/reports",
  ],
  SALES_MARKETING: [
    "/dashboard/billing",
    "/dashboard/logistics",
    "/dashboard/inventory",
    "/dashboard/approvals",
    "/dashboard/settings",
    "/dashboard/products/new",
    "/dashboard/reports",
    "/dashboard/finance",
    "/dashboard/field/team",
  ],
};

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isPathBlockedForRole(
  pathname: string,
  role?: string | null
): boolean {
  if (!role || !pathname) return false;

  const allowed = roleAllowedPrefixes[role] || [];
  if (allowed.some((prefix) => matchesPrefix(pathname, prefix))) {
    return false;
  }

  const blocked = roleBlockedPrefixes[role];
  if (!blocked) return false;
  return blocked.some((prefix) => matchesPrefix(pathname, prefix));
}
