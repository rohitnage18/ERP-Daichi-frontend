import { expect, type Page } from "@playwright/test";

export const DEMO_PASSWORD = "password123";

const DEMO_BUTTON: Record<string, string> = {
  "sales@xenvolt.com": "Sales",
  "admin@xenvolt.com": "Admin",
  "logistics@xenvolt.com": "Logistics",
  "account@xenvolt.com": "Account",
};

export const ROLES = [
  {
    name: "Sales",
    email: "sales@xenvolt.com",
    extraPages: [
      "/dashboard/field/history",
      "/dashboard/field/daily-log",
      "/dashboard/field/activity",
      "/dashboard/field/closing",
      "/dashboard/field/tracking",
      "/dashboard/field/visits/new",
      "/dashboard/dealers/new",
      "/dashboard/orders/new",
      "/dashboard/recommendations/new",
    ],
    blocked: [
      "/dashboard/billing",
      "/dashboard/finance/invoices",
      "/dashboard/logistics",
      "/dashboard/inventory",
      "/dashboard/reports",
      "/dashboard/approvals",
    ],
  },
  {
    name: "Admin",
    email: "admin@xenvolt.com",
    extraPages: [
      "/dashboard/field/history",
      "/dashboard/field/tracking",
      "/dashboard/inventory",
      "/dashboard/reports/field",
      "/dashboard/products/new",
      "/dashboard/reports/sales",
      "/dashboard/reports/aging",
      "/dashboard/reports/products",
      "/dashboard/reports/dealers",
      "/dashboard/settings/users",
      "/dashboard/settings/email",
      "/dashboard/settings/profile",
    ],
    blocked: [
      "/dashboard/billing",
      "/dashboard/logistics",
      "/dashboard/finance/invoices",
      "/dashboard/recommendations",
    ],
  },
  {
    name: "Logistics",
    email: "logistics@xenvolt.com",
    extraPages: ["/dashboard/settings/profile"],
    blocked: [
      "/dashboard/dealers",
      "/dashboard/billing",
      "/dashboard/finance/debit-notes",
      "/dashboard/reports",
      "/dashboard/approvals",
    ],
  },
  {
    name: "Account",
    email: "account@xenvolt.com",
    extraPages: [
      "/dashboard/billing/export",
      "/dashboard/finance/credit-notes/new",
      "/dashboard/finance/debit-notes/new",
      "/dashboard/settings/profile",
    ],
    blocked: [
      "/dashboard/logistics",
      "/dashboard/inventory",
      "/dashboard/reports",
      "/dashboard/approvals",
      "/dashboard/dealers/abc/edit",
    ],
  },
] as const;

export function attachPageGuards(page: Page) {
  const failures: string[] = [];

  page.on("pageerror", (err) => {
    if (/Loading chunk|hydrat/i.test(err.message)) return;
    failures.push(`pageerror: ${err.message}`);
  });

  page.on("response", (res) => {
    const url = res.url();
    const status = res.status();
    if (url.includes("/_next/") || url.includes("webpack")) return;
    if (status >= 500) failures.push(`${status} ${url}`);
    if (status === 404 && res.request().resourceType() === "document") {
      failures.push(`document 404 ${url}`);
    }
  });

  return {
    assertClean() {
      const unique = [...new Set(failures)];
      expect(unique, unique.join("\n")).toEqual([]);
    },
  };
}

export async function login(page: Page, email: string) {
  const demo = DEMO_BUTTON[email];
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await page.getByRole("button", { name: "Sign In" }).waitFor();

    if (demo) {
      await page.getByRole("button", { name: demo, exact: true }).click();
    } else {
      await page.getByLabel("Email Address").fill(email);
      await page.getByLabel("Password").fill(DEMO_PASSWORD);
      await page.getByRole("button", { name: "Sign In" }).click();
    }

    try {
      await page.waitForURL((url) => url.pathname.startsWith("/dashboard"), {
        timeout: attempt === 0 ? 90_000 : 45_000,
        waitUntil: "commit",
      });
      await expect(page.getByText(/welcome back,/i).first()).toBeVisible({ timeout: 30_000 });
      return;
    } catch (err) {
      if (attempt === 2) throw err;
      await page.waitForTimeout(3000);
    }
  }
}

export async function assertPageHealthy(page: Page) {
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.locator("text=This page could not be found")).toHaveCount(0);
  await expect(page.locator("text=Application error")).toHaveCount(0);
}

export async function clickSidebar(page: Page) {
  const links = page.locator(".app-sidebar nav a");
  await expect(links.first()).toBeVisible();
  const hrefs = await links.evaluateAll((as) =>
    as.map((a) => (a as HTMLAnchorElement).getAttribute("href")).filter((h): h is string => Boolean(h))
  );

  for (const href of hrefs) {
    await page.locator(`.app-sidebar nav a[href="${href}"]`).click();
    await expect(page).toHaveURL((url) => {
      if (href === "/dashboard") return url.pathname === "/dashboard";
      return url.pathname === href || url.pathname.startsWith(`${href}/`);
    });
    await expect(page).not.toHaveURL(/unauthorized/);
    await assertPageHealthy(page);
  }
  return hrefs;
}

export async function visit(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await assertPageHealthy(page);
}
