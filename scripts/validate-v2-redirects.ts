#!/usr/bin/env tsx
/**
 * V2 redirect gate (CIP-3325 / CIP-3337 item 7).
 *
 * Every page in the legacy tree (content/stack) must be covered by an entry
 * in v2-redirects.mjs — exact match or `:path*` wildcard — so that no URL is
 * orphaned when the v2 IA ships. Run via `bun run validate-redirects`; wired
 * into prebuild so a page added to content/stack without a mapping fails CI.
 *
 * This checks map *coverage*, not destination existence — destinations are
 * stubs until each section's migration ticket lands. CIP-3335 verifies
 * destinations resolve before merge.
 */
import fs from "node:fs";
import path from "node:path";
// eslint-disable-next-line -- .mjs import is intentional; the map is shared with next.config.mjs
import { v2Redirects } from "../v2-redirects.mjs";

const LEGACY_DIR = path.join(process.cwd(), "content/stack");

function collectSlugs(dir: string, prefix: string[] = []): string[] {
  const slugs: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      slugs.push(
        ...collectSlugs(path.join(dir, entry.name), [...prefix, entry.name]),
      );
    } else if (entry.name.endsWith(".mdx") || entry.name.endsWith(".md")) {
      const base = entry.name.replace(/\.mdx?$/, "");
      const parts = base === "index" ? prefix : [...prefix, base];
      slugs.push(`/stack${parts.length ? `/${parts.join("/")}` : ""}`);
    }
  }
  return slugs;
}

function matches(url: string, source: string): boolean {
  if (source.endsWith("/:path*")) {
    const base = source.slice(0, -"/:path*".length);
    return url === base || url.startsWith(`${base}/`);
  }
  return url === source;
}

const urls = collectSlugs(LEGACY_DIR);
const unmatched = urls.filter(
  (url) => !v2Redirects.some((r: { source: string }) => matches(url, r.source)),
);

if (unmatched.length > 0) {
  console.error(
    `✗ ${unmatched.length} legacy page(s) have no v2 redirect mapping:\n`,
  );
  for (const url of unmatched.sort()) {
    console.error(`  ${url}`);
  }
  console.error("\nAdd entries to v2-redirects.mjs (see IA.md migration map).");
  process.exit(1);
}

console.log(`✓ all ${urls.length} legacy pages covered by v2-redirects.mjs`);
