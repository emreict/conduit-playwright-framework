import { defineConfig, devices } from "@playwright/test";
import { config } from "./framework/config/env";

const isCI = !!process.env["CI"];

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: isCI
    ? [["list"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "on-failure" }]],
  use: {
    baseURL: config.baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: "**/api/**",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // API tests need no browser or dev server interaction.
      name: "api",
      testMatch: "**/api/**/*.spec.ts",
    },
  ],
  // Starts the Angular dev server for the test run, or reuses one already running.
  webServer: {
    command: "npm start",
    url: config.baseURL,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
