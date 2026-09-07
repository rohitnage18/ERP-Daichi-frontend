import { test, expect } from "@playwright/test";
import { ROLES, attachPageGuards, login, clickSidebar, visit, assertPageHealthy } from "./helpers";

for (const role of ROLES) {
  test.describe(`${role.name} click-through`, () => {
    test.describe.configure({ timeout: 240_000 });

    test(`logs in, walks sidebar, extra pages, and blocked routes`, async ({ page }) => {
      const guards = attachPageGuards(page);
      await login(page, role.email);

      const hrefs = await clickSidebar(page);
      expect(hrefs.length, `${role.name} should see sidebar links`).toBeGreaterThan(2);

      if (role.name === "Account") {
        await visit(page, "/dashboard/billing");
        await expect(page.getByText(/freight/i).first()).toBeVisible();
      }

      for (const path of role.extraPages) {
        await visit(page, path);
        await expect(page).not.toHaveURL(/unauthorized/);
        await expect(page.locator("h1, h2").first()).toBeVisible();
      }

      await visit(page, "/dashboard");
      const quick = page.locator("main a[href^='/dashboard']").filter({ hasNotText: /approve|reject/i });
      const quickCount = Math.min(await quick.count(), 4);
      const quickHrefs: string[] = [];
      for (let i = 0; i < quickCount; i++) {
        const href = await quick.nth(i).getAttribute("href");
        if (href && !href.includes("/new")) quickHrefs.push(href);
      }
      for (const href of quickHrefs) {
        await page.locator(`main a[href="${href}"]`).first().click();
        await expect(page).not.toHaveURL(/unauthorized/);
        await assertPageHealthy(page);
        await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      }

      for (const path of role.blocked) {
        await page.goto(path, { waitUntil: "commit" });
        await expect(page).toHaveURL(/\/dashboard\/unauthorized/);
        await page.getByRole("link", { name: /back to dashboard/i }).click();
        await expect(page).toHaveURL(/\/dashboard/);
        await assertPageHealthy(page);
      }

      await visit(page, "/dashboard/settings/profile");
      await expect(page).not.toHaveURL(/unauthorized/);

      guards.assertClean();
    });
  });
}
