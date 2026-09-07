import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT || 3100);
const api = process.env.E2E_API_URL || "https://erp-daichi-backend.onrender.com";
const baseURL = process.env.E2E_BASE_URL || `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    viewport: { width: 1400, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `/usr/local/bin/node ./node_modules/next/dist/bin/next start -p ${port} -H localhost`,
        url: `${baseURL}/login`,
        timeout: 120_000,
        reuseExistingServer: false,
        env: {
          ...process.env,
          NEXT_PUBLIC_API_URL: api,
          API_URL: api,
          NEXTAUTH_URL: baseURL,
        },
      },
});
