#!/usr/bin/env tsx
/**
 * EQL API reference generator + drift guard (docs V2).
 *
 * Consumes the structured `eql-manifest.json` that the EQL repo emits from its
 * Doxygen'd SQL (cipherstash/encrypt-query-language#364) and:
 *
 *   1. Generates a version-stamped function catalog at
 *      content/docs/reference/eql/functions.mdx — the exhaustive, drift-proof
 *      low-level reference the hand-written pedagogical pages link to.
 *   2. Drift-lints the hand-written pages: every `eql_v3.<fn>(...)` referenced
 *      in them should exist in the manifest for the shipped EQL version. This
 *      is what would have caught the fabricated function names / stale payload
 *      that slipped into the v2 docs.
 *
 * ── Manifest source ────────────────────────────────────────────────────────
 * TODAY: reads a committed illustrative sample (shape only), so the generated
 * format and the lint are reviewable before the EQL side ships.
 * TARGET: once #364 releases, `generate-eql-docs.ts` already downloads the
 * `eql-docs-<tag>` asset — extend it to also extract `json/eql-manifest.json`
 * and point MANIFEST_PATH at it. The renderer and lint stay identical.
 *
 * The drift-lint is REPORT-ONLY against the sample (which is tiny, so most real
 * symbols read as "unknown"); it becomes a failing gate once wired to the real
 * manifest. See STRICT below.
 */
import fs from "node:fs";
import path from "node:path";

const MANIFEST_PATH = path.join(
  process.cwd(),
  "scripts/fixtures/eql-manifest.sample.json",
);
const EQL_DIR = path.join(process.cwd(), "content/docs/reference/eql");
const OUT_FILE = path.join(EQL_DIR, "functions.mdx");
// Flip to true once MANIFEST_PATH points at the real release manifest.
const STRICT = false;

interface Param {
  name: string;
  type?: string;
  description?: string;
}
interface Fn {
  name: string;
  signature: string;
  visibility: "public" | "private";
  brief: string;
  description?: string;
  params: Param[];
  returns?: { type?: string; description?: string };
  source?: { file?: string; line?: number };
}
interface Domain {
  name: string;
  type: string;
  variant: string;
  base?: string;
  capabilities: string[];
  supportedOperators?: string[];
}
interface Manifest {
  version: string;
  functions: Fn[];
  domains?: Domain[];
}

function loadManifest(): Manifest {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
}

// ── Render the generated catalog ─────────────────────────────────────────────
function paramsTable(params: Param[]): string {
  if (!params.length) return "";
  const rows = params
    .map(
      (p) =>
        `| \`${p.name}\` | ${p.type ? `\`${p.type}\`` : ""} | ${(p.description ?? "").replace(/\|/g, "\\|")} |`,
    )
    .join("\n");
  return `\n| Parameter | Type | Description |\n| --- | --- | --- |\n${rows}\n`;
}

function renderFn(fn: Fn): string {
  const parts = [`### \`${fn.signature}\``, "", fn.brief];
  if (fn.description && fn.description !== fn.brief) parts.push("", fn.description);
  if (fn.params.length) parts.push(paramsTable(fn.params));
  if (fn.returns?.type || fn.returns?.description) {
    const t = fn.returns.type ? `\`${fn.returns.type}\`` : "";
    parts.push("", `**Returns:** ${t}${fn.returns.description ? ` — ${fn.returns.description}` : ""}`);
  }
  return parts.join("\n");
}

function renderDomains(domains: Domain[]): string {
  if (!domains.length) return "";
  const rows = domains
    .map((d) => {
      const variant = d.variant ? `\`_${d.variant}\`` : "_(storage only)_";
      const ops = d.supportedOperators?.length
        ? d.supportedOperators.map((o) => `\`${o}\``).join(" ")
        : "—";
      return `| \`${d.name}\` | ${d.type} | ${variant} | ${d.capabilities.join(", ")} | ${ops} |`;
    })
    .join("\n");
  return [
    "## Encrypted domains",
    "",
    "A column's capability is declared by its **domain variant**. This matrix comes straight from the Rust catalog (`eql-codegen dump-catalog`) — the source of truth the SQL is generated from. See [Core concepts](/reference/eql/core-concepts) for the model.",
    "",
    "| Domain | Type | Variant | Capabilities | Operators |",
    "| --- | --- | --- | --- | --- |",
    rows,
    "",
  ].join("\n");
}

function render(manifest: Manifest): string {
  const version = manifest.version;
  const publicFns = manifest.functions.filter((f) => f.visibility === "public");
  const privateFns = manifest.functions.filter((f) => f.visibility === "private");

  const frontmatter = [
    "---",
    "title: Functions",
    `description: "Generated catalog of EQL SQL functions and operators (EQL ${version})."`,
    "type: reference",
    "components: [eql]",
    "verifiedAgainst:",
    `  eql: "${version}"`,
    "---",
  ].join("\n");

  const body = [
    frontmatter,
    "",
    `{/* GENERATED — do not edit. Produced by scripts/generate-eql-api-docs.ts from the EQL manifest (v${version}). */}`,
    "",
    `<Callout type="info">`,
    `Generated from the **EQL ${version}** manifest (the Doxygen'd SQL is the source of truth). For the model behind these — variants, terms, typed operands — see [Core concepts](/reference/eql/core-concepts).`,
    `</Callout>`,
    "",
    "The `eql_v3` schema surface — encrypted domains and the functions behind them. The type and query pages explain *when* to use these; this page is the exhaustive reference they link to.",
    "",
    renderDomains(manifest.domains ?? []),
    "## Functions",
    "",
    ...publicFns.map(renderFn),
  ];

  if (privateFns.length) {
    body.push("", "## Internal functions", "", ...privateFns.map(renderFn));
  }

  return `${body.join("\n").trimEnd()}\n`;
}

// ── Drift guard ──────────────────────────────────────────────────────────────
function driftCheck(manifest: Manifest): string[] {
  // Known = every function AND every domain (short) name.
  const known = new Set<string>([
    ...manifest.functions.map((f) => f.name),
    ...(manifest.domains ?? []).map((d) => d.name.replace(/^eql_v3\./, "")),
  ]);
  const referenced = new Map<string, Set<string>>(); // symbol -> pages

  for (const file of fs.readdirSync(EQL_DIR)) {
    if (!file.endsWith(".mdx") || file === "functions.mdx") continue;
    const text = fs.readFileSync(path.join(EQL_DIR, file), "utf8");
    // Any eql_v3.<symbol> — function call, domain cast, or type reference.
    for (const m of text.matchAll(/eql_v3\.([a-z0-9_]+)/g)) {
      const sym = m[1];
      if (!referenced.has(sym)) referenced.set(sym, new Set());
      referenced.get(sym)!.add(file);
    }
  }

  const unknown: string[] = [];
  for (const [sym, pages] of referenced) {
    if (!known.has(sym)) unknown.push(`${sym}  (in ${[...pages].join(", ")})`);
  }
  return unknown.sort();
}

// ── Main ─────────────────────────────────────────────────────────────────────
function main() {
  const manifest = loadManifest();

  fs.mkdirSync(EQL_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, render(manifest));
  console.log(
    `✓ Generated ${path.relative(process.cwd(), OUT_FILE)} from EQL ${manifest.version} (${manifest.functions.length} functions)`,
  );

  const unknown = driftCheck(manifest);
  if (unknown.length) {
    const header = `⚠ ${unknown.length} eql_v3.* symbol(s) referenced in hand-written pages are not in the manifest (functions or domains):`;
    console.warn(`\n${header}`);
    for (const u of unknown) console.warn(`  - ${u}`);
    if (STRICT) {
      console.error(
        "\nDrift check failed (STRICT). Fix the reference or update the pinned EQL version.",
      );
      process.exit(1);
    } else {
      console.warn(
        "\n(Report-only: using the illustrative sample manifest. Becomes a failing gate once wired to the real release manifest — set STRICT = true.)",
      );
    }
  } else {
    console.log("✓ Drift check: all referenced eql_v3.* functions are in the manifest.");
  }
}

main();
