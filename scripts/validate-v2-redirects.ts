#!/usr/bin/env tsx
/**
 * Keep published legacy URLs working after their content is deleted.
 *
 * The fixture records the old pages (including generated API pages) and
 * their destinations before retirement. Check the actual Next.js config,
 * including basePath, rule order, wildcards, Markdown URLs and query strings.
 * Run via `bun run validate-redirects`; wired into prebuild.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import { prepareDestination } from "next/dist/shared/lib/router/utils/prepare-destination";
import config from "../next.config.mjs";
import legacyRedirects from "./fixtures/legacy-docs-redirects.json";

const CONTENT_DIR = path.join(process.cwd(), "content/docs");
const ORIGIN = "https://cipherstash.com";

// Generated in prebuild, but their tracked meta files let validation run
// before generation in a clean checkout too.
const GENERATED_PAGE_ROOTS = new Set([
  "/integrations/supabase/api-reference",
  "/reference/stack/api-reference",
]);

function destinationExists(destination: string): boolean {
  if (destination === "/") {
    return fs.existsSync(path.join(CONTENT_DIR, "index.mdx"));
  }
  const relative = destination.replace(/^\//, "");
  return (
    fs.existsSync(path.join(CONTENT_DIR, `${relative}.mdx`)) ||
    fs.existsSync(path.join(CONTENT_DIR, relative, "index.mdx")) ||
    (GENERATED_PAGE_ROOTS.has(destination) &&
      fs.existsSync(path.join(CONTENT_DIR, relative, "meta.json")))
  );
}

async function main() {
  for (const retired of [
    "content/stack",
    "src/app/stack",
    "src/app/llms.mdx/stack",
  ]) {
    assert(!fs.existsSync(retired), `${retired} must remain retired`);
  }

  const redirects = await config.redirects?.();
  assert(redirects, "Next.js must configure redirects");
  // Compile once using Next's own matcher and destination expansion. Prefix
  // routes as Next does, except rules that explicitly opt out of basePath.
  const rules = redirects.map((redirect) => {
    const basePath = redirect.basePath === false ? "" : (config.basePath ?? "");
    return {
      match: getPathMatch(
        `${basePath}${redirect.source === "/" && basePath ? "" : redirect.source}`,
      ),
      destination: redirect.destination.startsWith("/")
        ? `${basePath}${redirect.destination === "/" && basePath ? "" : redirect.destination}`
        : redirect.destination,
    };
  });
  let checked = 0;
  const failures: string[] = [];
  for (const [source, destination] of Object.entries(legacyRedirects)) {
    if (!destinationExists(destination)) {
      failures.push(`${source} → ${destination}: destination page is missing`);
      continue;
    }

    const markdown = destination === "/" ? "/index.mdx" : `${destination}.mdx`;
    for (const [from, to] of [
      [source, destination],
      [`${source}.mdx`, markdown],
      [`/llms.mdx${source}`, markdown],
    ]) {
      const expected = `${ORIGIN}/docs${to === "/" ? "" : to}?from=legacy`;
      let actual: string | undefined;
      for (const rule of rules) {
        const params = rule.match(`/docs${from}`);
        if (!params) continue;
        const { newUrl, parsedDestination } = prepareDestination({
          appendParamsToQuery: false,
          destination: rule.destination,
          params,
          query: { from: "legacy" },
        });
        const url = new URL(newUrl, ORIGIN);
        url.search = new URLSearchParams(
          parsedDestination.query as Record<string, string>,
        ).toString();
        actual = url.href;
        break;
      }
      if (actual !== expected) {
        failures.push(
          `${from}: expected ${expected}, got ${actual ?? "no redirect"}`,
        );
      }
      checked++;
    }
  }

  if (failures.length > 0) {
    console.error(`✗ ${failures.length} legacy redirect failure(s):\n`);
    for (const failure of failures) console.error(`  ${failure}`);
    process.exit(1);
  }
  console.log(
    `✓ ${checked} HTML/Markdown redirects for ${Object.keys(legacyRedirects).length} legacy pages resolve to current content and preserve query strings`,
  );
}

main().catch((error) => {
  console.error("✗ legacy redirect validation failed:", error);
  process.exit(1);
});
