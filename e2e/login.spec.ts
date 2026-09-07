import { test, expect } from "@playwright/test";
import { DEMO_PASSWORD, attachPageGuards } from "./helpers";

test.describe("login", () => {
  test("renders demo access and rejects a bad password", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sales" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Admin" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Logistics" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Account" })).toBeVisible();

    await page.getByLabel("Email Address").fill("sales@xenvolt.com");
    await page.getByLabel("Password").fill("not-the-demo-password");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/welcome back,/i)).toHaveCount(0);
  });

  test("password visibility toggle works", async ({ page }) => {
    await page.goto("/login");
    const password = page.locator("#password");
    await password.fill(DEMO_PASSWORD);
    await expect(password).toHaveAttribute("type", "password");
    await password.locator("xpath=..").getByRole("button").click();
    await expect(password).toHaveAttribute("type", "text");
  });
});
