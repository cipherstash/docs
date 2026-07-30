#!/usr/bin/env tsx
/**
 * V2 redirect gate (CIP-3325 / CIP-3337 item 7).
 *
 * Every page in the legacy tree (content/stack) must be covered by an entry
 * in v2-redirects.mjs — exact match or `:path*` wildcard — and every resolved
 * destination must be a real v2 page. Run via `bun run validate-redirects`;
 * wired into prebuild so an orphaned source or a redirect-to-404 fails CI.
 */
import fs from "node:fs";
import path from "node:path";
// eslint-disable-next-line -- .mjs import is intentional; the map is shared with next.config.mjs
import { v2Redirects } from "../v2-redirects.mjs";

const LEGACY_DIR = path.join(process.cwd(), "content/stack");
const V2_DIR = path.join(process.cwd(), "content/docs");

// These indexes are generated during prebuild and intentionally ignored by
// git. Their tracked meta files establish the output roots so the redirect
// validator can also run before generation in a clean checkout.
const GENERATED_PAGE_ROOTS = new Set([
  "/integrations/supabase/api-reference",
  "/reference/stack/api-reference",
]);

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

function resolveDestination(
  url: string,
  redirect: { source: string; destination: string },
): string {
  if (!redirect.source.endsWith("/:path*")) return redirect.destination;

  const base = redirect.source.slice(0, -"/:path*".length);
  const suffix = url === base ? "" : url.slice(base.length + 1);
  return redirect.destination.replace(":path*", suffix);
}

function destinationExists(destination: string): boolean {
  const route = destination.split(/[?#]/, 1)[0];
  if (route === "/") return fs.existsSync(path.join(V2_DIR, "index.mdx"));

  const relative = route.replace(/^\//, "");
  const page = path.join(V2_DIR, `${relative}.mdx`);
  const index = path.join(V2_DIR, relative, "index.mdx");
  if (fs.existsSync(page) || fs.existsSync(index)) return true;

  return (
    GENERATED_PAGE_ROOTS.has(route) &&
    fs.existsSync(path.join(V2_DIR, relative, "meta.json"))
  );
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

const broken = urls.flatMap((url) => {
  const redirect = v2Redirects.find((candidate: { source: string }) =>
    matches(url, candidate.source),
  );
  if (!redirect) return [];

  const destination = resolveDestination(url, redirect);
  return destinationExists(destination) ? [] : [{ url, destination }];
});

if (broken.length > 0) {
  console.error(
    `✗ ${broken.length} legacy redirect(s) resolve to a missing v2 page:\n`,
  );
  for (const { url, destination } of broken) {
    console.error(`  ${url} → ${destination}`);
  }
  console.error(
    "\nCreate the destination or map the legacy URL to an existing canonical page.",
  );
  process.exit(1);
}

console.log(
  `✓ all ${urls.length} legacy pages map to existing v2 destinations`,
);
