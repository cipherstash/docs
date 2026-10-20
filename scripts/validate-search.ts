#!/usr/bin/env tsx
import assert from "node:assert/strict";
import type { DocsSearchResult } from "../src/lib/search/shared";

// Run against a local production build OR the PR's deployment. These are page
// expectations, not pinned scores: content can grow without freezing ranking.
const base = (process.argv[2] ?? "http://localhost:3001/docs").replace(
  /\/$/,
  "",
);
const cases: [string, string[]][] = [
  ["text_eq", ["/reference/eql/text"]],
  [
    "ord_term",
    [
      "/reference/eql/indexes",
      "/reference/eql/functions",
      "/reference/eql/sorting",
    ],
  ],
  ["LIKE", ["/reference/eql/text"]],
  ["hipaa", ["/security/compliance"]],
  ["backfill", ["/guides/migration", "/reference/cli/encrypt"]],
  ["supabase auth", ["/integrations/supabase/auth"]],
  ["eql_v3.text_eq", ["/reference/eql/text"]],
  ["eql_v3.text", ["/reference/eql/text"]],
  [
    "ord_ore",
    [
      "/reference/eql/core-concepts",
      "/reference/eql/text",
      "/reference/eql/functions",
    ],
  ],
  [
    "encryptedSupabase",
    ["/integrations/supabase", "/integrations/supabase/api-reference"],
  ],
  [
    "CS_CLIENT_KEY",
    [
      "/reference/auth/clients",
      "/reference/glossary",
      "/reference/workspace/configuration",
      "/reference/stack/usage",
      "/reference/stack/configuration",
    ],
  ],
  ["unique index", ["/reference/eql/indexes"]],
];
async function main() {
  const revisions = new Set<string>();
  const anchors = new Map<string, string>();
  let failures = 0;
  for (const [query, expected] of cases) {
    const response = await fetch(
      `${base}/api/search?query=${encodeURIComponent(query)}`,
    );
    assert.equal(response.status, 200, query);
    const revision = response.headers.get("X-Search-Revision");
    assert(revision, "Missing deployment revision");
    revisions.add(revision);
    const results: DocsSearchResult[] = await response.json();
    assert(results.every((r) => !r.url.startsWith("/stack")));
    const top = results.slice(0, 3);
    const pass = top.some((r) => expected.includes(r.url.split("#")[0]));
    if (!pass) failures++;
    console.log(
      `${pass ? "✓" : "✗"} ${query}: ${top.map((r) => r.url).join(", ")}`,
    );
    for (const result of top) {
      const [path, anchor] = result.url.split("#");
      if (!anchor) continue;
      let html = anchors.get(path);
      if (!html) {
        const page = await fetch(`${base}${path === "/" ? "" : path}`);
        assert.equal(page.status, 200, path);
        html = await page.text();
        anchors.set(path, html);
      }
      assert(html.includes(`id="${anchor}"`), `Missing anchor: ${result.url}`);
    }
  }
  assert.equal(
    revisions.size,
    1,
    "Search revision changed during verification",
  );
  for (const type of ["reference", "guide", "concept", "tutorial"]) {
    const response = await fetch(
      `${base}/api/search?query=encryption&type=${type}`,
    );
    assert.equal(response.status, 200);
    const results: DocsSearchResult[] = await response.json();
    assert(results.length, `No results for ${type} filter`);
    assert(
      results.every((r) => r.pageType === type),
      `Leaked page type: ${type}`,
    );
  }
  const zero = await fetch(`${base}/api/search?query=zzzzunfindablesymbol`);
  assert.deepEqual(await zero.json(), []);
  assert.equal(
    (await fetch(`${base}/api/search?query=test&type=invalid`)).status,
    400,
  );
  assert.equal(
    (await fetch(`${base}/api/search?query=${"a".repeat(161)}`)).status,
    400,
  );
  assert.equal(failures, 0, `${failures} relevance checks failed`);
  console.log(
    `✓ Ranking, anchors, filters, retired URLs, empty results and query validation; revision ${[...revisions][0]}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
