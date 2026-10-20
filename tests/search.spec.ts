import assert from "node:assert/strict";
import { gunzipSync } from "node:zlib";
import { test as base, expect, type Page } from "@playwright/test";

interface AnalyticsEvent {
  event: string;
  properties: { query?: string; result_url?: string; result_count?: number };
}

// Keep browser checks out of real analytics, including when run on a preview.
const test = base.extend<{ analytics: AnalyticsEvent[] }>({
  analytics: [
    async ({ page }, use) => {
      const events: AnalyticsEvent[] = [];
      // PostHog intentionally drops webdriver traffic. This local fixture
      // exercises normal capture; every outbound ingest request is intercepted.
      if (process.env.SEARCH_ANALYTICS_TEST) {
        await page.addInitScript(() => {
          Object.defineProperty(navigator, "webdriver", { get: () => false });
          Object.defineProperty(navigator, "userAgentData", {
            get: () => ({
              brands: [{ brand: "Chromium", version: "156" }],
              mobile: false,
              platform: "macOS",
            }),
          });
        });
      }
      await page.route("**/docs/ingest/**", async (route) => {
        const request = route.request();
        if (new URL(request.url()).pathname.endsWith(".js")) {
          await route.fulfill({
            contentType: "application/javascript",
            body: "",
          });
          return;
        }
        if (request.method() === "POST" && /\/[ei]\//.test(request.url())) {
          const raw = request.postDataBuffer();
          if (raw) {
            const text =
              raw[0] === 0x1f ? gunzipSync(raw).toString() : raw.toString();
            let parsed: unknown;
            try {
              parsed = JSON.parse(text);
            } catch {
              const data = new URLSearchParams(text).get("data");
              if (data)
                parsed = JSON.parse(Buffer.from(data, "base64").toString());
            }
            if (Array.isArray(parsed)) events.push(...parsed);
            else if (parsed && typeof parsed === "object" && "event" in parsed)
              events.push(parsed as AnalyticsEvent);
          }
        }
        await route.fulfill({
          json: {
            status: 1,
            featureFlags: {},
            errorsWhileComputingFlags: false,
          },
        });
      });
      await use(events);
    },
    { auto: true },
  ],
});

async function openSearch(
  page: Page,
  baseURL: string | undefined,
  shortcut = "Meta+k",
) {
  assert(baseURL);
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  // Wait for hydration before sending a shortcut to the global listener.
  await expect(
    page.getByRole("button", { name: /search/i }).first(),
  ).toBeVisible();
  await page.keyboard.press(shortcut);
  const input = page.getByRole("combobox", { name: "Search documentation" });
  await expect(input).toBeFocused();
  return input;
}

test("⌘K, arrows, Enter at an anchor, Escape, and Ctrl+K after navigation", async ({
  page,
  baseURL,
}) => {
  const input = await openSearch(page, baseURL);
  await input.fill("unique index");
  await expect(page.getByRole("option").first()).toContainText("Indexes");
  const firstId = await input.getAttribute("aria-activedescendant");
  assert(firstId);
  await input.press("ArrowDown");
  expect(await input.getAttribute("aria-activedescendant")).not.toBe(firstId);
  await input.press("ArrowUp");
  await expect(input).toHaveAttribute("aria-activedescendant", firstId);
  await input.press("Enter");
  await expect(page).toHaveURL(
    /\/docs\/reference\/eql\/indexes#unique-indexes$/,
  );
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator("#unique-indexes")).toBeInViewport();
  await page.keyboard.press("Control+k");
  await expect(input).toBeFocused();
  await input.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("page-type filter is keyboard accessible and does not select a result", async ({
  page,
  baseURL,
}) => {
  const input = await openSearch(page, baseURL, "Control+k");
  await input.fill("encryption");
  await expect(page.getByRole("option").first()).toBeVisible();
  const guide = page.getByRole("button", { name: "guide", exact: true });
  await guide.focus();
  await guide.press("Enter");
  await expect(guide).toHaveAttribute("aria-pressed", "true");
  await expect(input).toBeFocused();
  await expect(page.getByRole("option").first()).toContainText("guide");
  for (const option of await page.getByRole("option").all())
    await expect(option).toContainText("guide");
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("slow responses cannot replace a newer query; errors are retryable", async ({
  page,
  baseURL,
}) => {
  let release: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let oldRequested = false;
  await page.route("**/api/search?**", async (route) => {
    const query = new URL(route.request().url()).searchParams.get("query");
    if (query === "slow") {
      oldRequested = true;
      await gate;
      await route.fulfill({ json: [] });
    } else if (query === "fail") {
      await route.fulfill({ status: 503, json: { error: "Unavailable" } });
    } else await route.continue();
  });
  const input = await openSearch(page, baseURL);
  await input.fill("slow");
  await expect.poll(() => oldRequested).toBe(true);
  await input.fill("hipaa");
  await expect(page.getByRole("option").first()).toContainText("HIPAA");
  release?.();
  await expect(page.getByRole("option").first()).toContainText("HIPAA");
  await input.fill("fail");
  await expect(page.getByRole("alert")).toContainText("Search couldn’t load");
  await expect(page.getByText(/No results for/)).toHaveCount(0);
  await page.unroute("**/api/search?**");
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("listbox")).toHaveAttribute("aria-busy", "false");
});

test("settled queries, selection and zero-result queries reach PostHog once", async ({
  page,
  baseURL,
  analytics,
}) => {
  test.skip(
    !process.env.SEARCH_ANALYTICS_TEST,
    "Run a server with the dummy PostHog key documented in README.",
  );
  const input = await openSearch(page, baseURL);
  await input.fill("zzzzunfindablesymbol");
  await expect(
    page.getByText("No results for “zzzzunfindablesymbol”."),
  ).toBeVisible();
  await expect
    .poll(
      () =>
        analytics.filter((e) => e.event === "docs_search_zero_results").length,
      { timeout: 15_000 },
    )
    .toBe(1);
  const zero = analytics.find((e) => e.event === "docs_search_zero_results");
  expect(zero?.properties).toMatchObject({
    query: "zzzzunfindablesymbol",
    result_count: 0,
  });
  await input.fill("unique index");
  await expect(page.getByRole("option").first()).toContainText("Indexes");
  await input.press("Enter");
  await expect
    .poll(
      () =>
        analytics.filter((e) => e.event === "docs_search_result_selected")
          .length,
      { timeout: 15_000 },
    )
    .toBe(1);
  expect(
    analytics.filter(
      (e) => e.event === "docs_search" && e.properties.query === "unique index",
    ),
  ).toHaveLength(1);
  expect(
    analytics.filter((e) => e.event === "docs_search_zero_results"),
  ).toHaveLength(1);
});

test("mobile dialog stays within the viewport and supports touch selection", async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const input = await openSearch(page, baseURL);
  await input.fill("supabase auth");
  await expect(page.getByRole("option").first()).toContainText("Supabase Auth");
  const bounds = await page.getByRole("dialog").boundingBox();
  assert(bounds);
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(844);
  await page.getByRole("option").first().click();
  await expect(page).toHaveURL(/\/docs\/integrations\/supabase\/auth(?:#.*)?$/);
});
