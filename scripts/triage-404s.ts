#!/usr/bin/env tsx
/**
 * 404 triage for a Vercel log export.
 *
 * The raw export is unreadable: in the 2026-08-26 → 08-31 window, 4,771 of
 * 5,000 rows were Next.js client segment-cache prefetches, so the ~230
 * failures worth acting on sat under 95% noise. This classifies the rows,
 * drops the noise, and prints what is left with requester attribution.
 *
 * Usage: bun run triage-404s <export.csv>
 * Export from the Vercel dashboard: Logs → filter status 404 → Export CSV.
 *
 * Not wired into prebuild — it reads a file that only exists when someone
 * has pulled an export.
 */
import fs from "node:fs";

interface Row {
  requestId: string;
  path: string;
  status: string;
  userAgent: string;
  time: string;
}

/**
 * Requests the Next.js client segment cache makes on hover/viewport. They
 * 404 because segment data is only generated when `cacheComponents` is on;
 * the router falls back to a normal prefetch, so nothing is broken for the
 * reader. Benign, high volume, and the reason raw 404 reports are useless.
 */
const SEGMENT_PREFETCH = /\.segments\/|\.rsc$/;
const ASSET = /\.(?:js|css|png|jpe?g|gif|webp|svg|ico|woff2?|map)$/;
/** `file.ts:44` in docs prose, resolved as a link by an agent. */
const SOURCE_REF = /\.[cm]?[jt]sx?(?::\d+)?$/;
const MACHINE_ENDPOINT =
  /\/(?:mcp|robots\.txt|openapi\.json|api\.json|\.well-known\/[^/]+)$/;

type Bucket =
  | "segment-prefetch"
  | "source-ref"
  | "markdown-suffix"
  | "machine-endpoint"
  | "asset"
  | "page";

function classify(path: string): Bucket {
  if (SEGMENT_PREFETCH.test(path)) return "segment-prefetch";
  if (/\.mdx?$/.test(path)) return "markdown-suffix";
  if (SOURCE_REF.test(path)) return "source-ref";
  if (MACHINE_ENDPOINT.test(path)) return "machine-endpoint";
  if (ASSET.test(path)) return "asset";
  return "page";
}

// Self-identified AI agents and scripted clients. A browser user-agent is
// not proof of a human: agents that do not identify themselves land in
// "browser", and bursts of sequential machine-shaped requests show up there.
const AI_AGENTS =
  /GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-User|Claude-SearchBot|anthropic-ai|PerplexityBot|Perplexity-User|DuckAssist|Amazonbot|Applebot|Bytespider|Google-Extended|meta-external|cohere|curl\/|python-requests|node-fetch|Go-http-client|axios|undici/i;
const SEARCH_CRAWLERS = /Googlebot|bingbot|DuckDuckBot|YandexBot/i;

type Requester = "ai" | "search" | "bot" | "browser";

function requester(userAgent: string): Requester {
  if (AI_AGENTS.test(userAgent)) return "ai";
  if (SEARCH_CRAWLERS.test(userAgent)) return "search";
  if (/bot|spider|crawl/i.test(userAgent)) return "bot";
  return "browser";
}

/** Minimal RFC 4180 reader: the export quotes user-agent strings, which contain commas. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }
  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const file = process.argv[2];
if (!file) {
  console.error("usage: bun run triage-404s <export.csv>");
  process.exit(1);
}

const table = parseCsv(fs.readFileSync(file, "utf8"));
const header = table[0];
const index = (name: string) => header.indexOf(name);
const columns = {
  requestId: index("requestId"),
  path: index("requestPath"),
  status: index("responseStatusCode"),
  userAgent: index("requestUserAgent"),
  time: index("TimeUTC"),
};
for (const [name, position] of Object.entries(columns)) {
  if (position === -1) {
    console.error(`✗ export is missing the ${name} column`);
    process.exit(1);
  }
}

// The export repeats rows; requestId is the only stable key.
const seen = new Set<string>();
const rows: Row[] = [];
for (const cells of table.slice(1)) {
  if (cells.length < header.length) continue;
  const requestId = cells[columns.requestId];
  if (seen.has(requestId)) continue;
  seen.add(requestId);
  // requestPath carries the host: "public-docs.vercel.app/docs/x?y=z".
  const raw = cells[columns.path];
  const slash = raw.indexOf("/");
  rows.push({
    requestId,
    path: (slash > 0 ? raw.slice(slash) : raw).split("?")[0],
    status: cells[columns.status],
    userAgent: cells[columns.userAgent],
    time: cells[columns.time],
  });
}

const duplicates = table.length - 1 - rows.length;
const buckets = new Map<Bucket, Row[]>();
for (const row of rows) {
  const bucket = classify(row.path);
  const list = buckets.get(bucket);
  if (list) list.push(row);
  else buckets.set(bucket, [row]);
}

const times = rows.map((r) => r.time).sort();
console.log(
  `\n${rows.length} unique requests (${duplicates} duplicate rows dropped)`,
);
console.log(`window: ${times[0]} → ${times[times.length - 1]}\n`);

console.log("bucket             requests");
for (const [bucket, list] of [...buckets].sort(
  (a, b) => b[1].length - a[1].length,
)) {
  const note =
    bucket === "segment-prefetch" ? "  (benign Next.js prefetch — ignore)" : "";
  console.log(
    `  ${bucket.padEnd(17)} ${String(list.length).padStart(5)}${note}`,
  );
}

const actionable = rows.filter((r) => classify(r.path) !== "segment-prefetch");
const byPath = new Map<string, Row[]>();
for (const row of actionable) {
  const list = byPath.get(row.path);
  if (list) list.push(row);
  else byPath.set(row.path, [row]);
}

console.log(
  `\n${byPath.size} distinct paths worth triaging, ${actionable.length} requests:\n`,
);
console.log("hits  ai search bot browser  path");
for (const [path, list] of [...byPath].sort(
  (a, b) => b[1].length - a[1].length,
)) {
  const counts: Record<Requester, number> = {
    ai: 0,
    search: 0,
    bot: 0,
    browser: 0,
  };
  for (const row of list) counts[requester(row.userAgent)]++;
  console.log(
    `${String(list.length).padStart(4)}  ${String(counts.ai).padStart(2)} ${String(counts.search).padStart(6)} ${String(counts.bot).padStart(3)} ${String(counts.browser).padStart(7)}  ${path}`,
  );
}

const fromAgents = actionable.filter(
  (r) => requester(r.userAgent) === "ai",
).length;
console.log(
  `\n${fromAgents} of ${actionable.length} came from self-identified AI agents.`,
);
