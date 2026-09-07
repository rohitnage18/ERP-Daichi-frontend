import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { APP_ROLES, isPathBlockedForRole } from "./permissions";

const pages = [
  "/dashboard",
  "/dashboard/field",
  "/dashboard/field/team",
  "/dashboard/field/daily-log",
  "/dashboard/field/history",
  "/dashboard/field/visits/new",
  "/dashboard/field/allowances/new",
  "/dashboard/dealers",
  "/dashboard/dealers/new",
  "/dashboard/dealers/abc",
  "/dashboard/dealers/abc/edit",
  "/dashboard/products",
  "/dashboard/products/new",
  "/dashboard/products/abc",
  "/dashboard/orders",
  "/dashboard/orders/new",
  "/dashboard/orders/abc",
  "/dashboard/recommendations",
  "/dashboard/recommendations/new",
  "/dashboard/recommendations/abc",
  "/dashboard/billing",
  "/dashboard/billing/export",
  "/dashboard/logistics",
  "/dashboard/inventory",
  "/dashboard/finance/invoices",
  "/dashboard/finance/invoices/abc",
  "/dashboard/finance/payments",
  "/dashboard/finance/credit-notes",
  "/dashboard/finance/credit-notes/new",
  "/dashboard/finance/debit-notes",
  "/dashboard/finance/debit-notes/new",
  "/dashboard/reports",
  "/dashboard/reports/dealers",
  "/dashboard/reports/products",
  "/dashboard/reports/sales",
  "/dashboard/reports/aging",
  "/dashboard/reports/revenue",
  "/dashboard/reports/orders",
  "/dashboard/approvals",
  "/dashboard/settings",
  "/dashboard/settings/profile",
  "/dashboard/settings/users",
  "/dashboard/settings/email",
  "/dashboard/settings/zones",
  "/dashboard/settings/system",
  "/dashboard/settings/categories",
  "/dashboard/unauthorized",
];

const sidebar = [
  { href: "/dashboard", roles: ["SALES_MARKETING", "MANAGEMENT_ADMIN", "PRODUCTION_LOGISTICS", "ACCOUNT"] },
  { href: "/dashboard/field", roles: ["SALES_MARKETING", "MANAGEMENT_ADMIN"] },
  { href: "/dashboard/field/team", roles: ["MANAGEMENT_ADMIN"] },
  { href: "/dashboard/dealers", roles: ["SALES_MARKETING", "MANAGEMENT_ADMIN", "ACCOUNT"] },
  { href: "/dashboard/products", roles: ["SALES_MARKETING", "MANAGEMENT_ADMIN", "PRODUCTION_LOGISTICS", "ACCOUNT"] },
  { href: "/dashboard/orders", roles: ["SALES_MARKETING", "MANAGEMENT_ADMIN", "PRODUCTION_LOGISTICS", "ACCOUNT"] },
  { href: "/dashboard/billing", roles: ["ACCOUNT"] },
  { href: "/dashboard/recommendations", roles: ["SALES_MARKETING"] },
  { href: "/dashboard/logistics", roles: ["PRODUCTION_LOGISTICS"] },
  { href: "/dashboard/inventory", roles: ["PRODUCTION_LOGISTICS"] },
  { href: "/dashboard/finance/invoices", roles: ["PRODUCTION_LOGISTICS", "ACCOUNT"] },
  { href: "/dashboard/finance/payments", roles: ["ACCOUNT"] },
  { href: "/dashboard/finance/credit-notes", roles: ["ACCOUNT"] },
  { href: "/dashboard/finance/debit-notes", roles: ["ACCOUNT"] },
  { href: "/dashboard/billing/export", roles: ["ACCOUNT"] },
  { href: "/dashboard/reports", roles: ["MANAGEMENT_ADMIN"] },
  { href: "/dashboard/approvals", roles: ["MANAGEMENT_ADMIN"] },
  { href: "/dashboard/settings/email", roles: ["MANAGEMENT_ADMIN"] },
  { href: "/dashboard/settings", roles: ["MANAGEMENT_ADMIN"] },
];

const quickActions: Record<string, string[]> = {
  SALES_MARKETING: [
    "/dashboard/dealers/new",
    "/dashboard/orders/new",
    "/dashboard/recommendations/new",
    "/dashboard/field",
    "/dashboard/products",
  ],
  MANAGEMENT_ADMIN: [
    "/dashboard/approvals",
    "/dashboard/orders/new",
    "/dashboard/dealers/new",
    "/dashboard/reports",
    "/dashboard/dealers",
    "/dashboard/orders",
    "/dashboard/settings",
    "/dashboard/products",
    "/dashboard/reports/sales",
  ],
  PRODUCTION_LOGISTICS: [
    "/dashboard/logistics",
    "/dashboard/finance/invoices",
    "/dashboard/inventory",
    "/dashboard/products",
  ],
  ACCOUNT: [
    "/dashboard/billing",
    "/dashboard/finance/invoices",
    "/dashboard/finance/payments",
    "/dashboard/finance/credit-notes",
  ],
};

describe("role route guards", () => {
  it("lets every role open dashboard, profile, and unauthorized", () => {
    for (const role of ["SALES_MARKETING", "MANAGEMENT_ADMIN", "PRODUCTION_LOGISTICS", "ACCOUNT"]) {
      assert.equal(isPathBlockedForRole("/dashboard", role), false);
      assert.equal(isPathBlockedForRole("/dashboard/settings/profile", role), false);
      assert.equal(isPathBlockedForRole("/dashboard/unauthorized", role), false);
    }
  });

  it("blocks sales from finance, logistics, inventory, reports", () => {
    for (const path of ["/dashboard/billing", "/dashboard/finance/invoices", "/dashboard/logistics", "/dashboard/inventory", "/dashboard/reports"]) {
      assert.equal(isPathBlockedForRole(path, "SALES_MARKETING"), true, path);
    }
  });

  it("blocks logistics from dealers, debit notes, and billing", () => {
    assert.equal(isPathBlockedForRole("/dashboard/dealers", "PRODUCTION_LOGISTICS"), true);
    assert.equal(isPathBlockedForRole("/dashboard/finance/debit-notes", "PRODUCTION_LOGISTICS"), true);
    assert.equal(isPathBlockedForRole("/dashboard/billing", "PRODUCTION_LOGISTICS"), true);
    assert.equal(isPathBlockedForRole("/dashboard/inventory", "PRODUCTION_LOGISTICS"), false);
  });

  it("blocks account from dealer edit and logistics", () => {
    assert.equal(isPathBlockedForRole("/dashboard/dealers/abc/edit", "ACCOUNT"), true);
    assert.equal(isPathBlockedForRole("/dashboard/logistics", "ACCOUNT"), true);
    assert.equal(isPathBlockedForRole("/dashboard/billing", "ACCOUNT"), false);
  });

  it("covers every listed page without throwing", () => {
    for (const page of pages) {
      for (const role of APP_ROLES) {
        assert.equal(typeof isPathBlockedForRole(page, role), "boolean");
      }
    }
  });

  it("lets each role open every sidebar item assigned to it", () => {
    for (const item of sidebar) {
      for (const role of item.roles) {
        assert.equal(isPathBlockedForRole(item.href, role), false, `${role} blocked from ${item.href}`);
      }
    }
  });

  it("lets each role open its dashboard quick-action links", () => {
    for (const [role, hrefs] of Object.entries(quickActions)) {
      for (const href of hrefs) {
        assert.equal(isPathBlockedForRole(href, role), false, `${role} blocked from ${href}`);
      }
    }
  });
});
