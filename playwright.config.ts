import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "search.spec.ts",
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: process.env.SEARCH_BASE_URL ?? "http://localhost:3001/docs",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
