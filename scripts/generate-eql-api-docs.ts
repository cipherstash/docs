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
 *   2. Drift-lints the hand-written pages: every schema-qualified reference
 *      (`public.<domain>`, `eql_v3.<fn>`, `eql_v3_internal.<fn>`) must match the
 *      manifest by schema AND name. This catches fabricated names, stale
 *      payloads, and right-name/wrong-schema refs (e.g. `eql_v3.text_eq` for a
 *      domain that lives in `public`) — the classes of drift that slipped into
 *      the v2 docs.
 *
 * ── Manifest source ────────────────────────────────────────────────────────
 * Reads the committed illustrative sample by default. Set EQL_MANIFEST_PATH to
 * a real manifest (the `eql-docs-<tag>` release asset extracted by
 * `generate-eql-docs.ts`, or a locally-generated one) — the renderer and lint
 * are identical either way.
 *
 * The drift-lint is REPORT-ONLY against the sample (tiny, so most real symbols
 * read as "unknown"); it becomes a failing gate against a real manifest
 * (auto-strict when EQL_MANIFEST_PATH is set). See STRICT below.
 */
import fs from "node:fs";
import path from "node:path";

// Manifest source, in priority order:
//   1. EQL_MANIFEST_PATH — explicit override (local testing / CI).
//   2. .eql-manifest.release.json — extracted from the eql-docs release asset
//      by generate-eql-docs.ts (present once a release ships the manifest).
//   3. the committed illustrative sample — offline fallback.
const SAMPLE_MANIFEST = path.join(
  process.cwd(),
  "scripts/fixtures/eql-manifest.sample.json",
);
const RELEASE_MANIFEST = path.join(process.cwd(), ".eql-manifest.release.json");
const MANIFEST_PATH =
  process.env.EQL_MANIFEST_PATH ??
  (fs.existsSync(RELEASE_MANIFEST) ? RELEASE_MANIFEST : SAMPLE_MANIFEST);
const EQL_DIR = path.join(process.cwd(), "content/docs/reference/eql");
const OUT_FILE = path.join(EQL_DIR, "functions.mdx");
// Per-type function fragments embedded into the hand-written type pages via
// Fumadocs' `<include>` directive. They live OUTSIDE the two content
// collections (content/docs, content/stack) so they never become routes, and
// are included cwd-relative (`<include cwd>content/partials/…`). Generated, so
// the per-type "which functions apply" tables can't drift from the manifest.
const FRAGMENT_DIR = path.join(process.cwd(), "content/partials/eql");
// Single source for the EQL version the whole reference is built against: the
// release manifest's own `version`. Written here so the <EqlVersion> banner on
// every EQL page reads the same release-derived value (no hardcoded constant).
const VERSION_FILE = path.join(process.cwd(), "src/lib/eql-version.ts");
// Report-only against the illustrative sample; a failing gate against any real
// manifest (the release asset or an explicit override).
const STRICT = MANIFEST_PATH !== SAMPLE_MANIFEST;

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
  termFunctions?: string[];
  shape?: string;
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

// Public functions are heavily overloaded — one name per operation with a
// per-encrypted-type variant, all sharing the same doc. Group by name so the
// page is one entry per function (its distinct signatures listed) instead of
// ~hundreds of near-identical overload blocks.
function renderPublicFunctions(fns: Fn[]): string {
  const byName = new Map<string, Fn[]>();
  for (const f of fns) {
    const g = byName.get(f.name) ?? [];
    g.push(f);
    byName.set(f.name, g);
  }
  const sections: string[] = [];
  const entries = [...byName.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  for (const [name, overloads] of entries) {
    const rep =
      overloads.find((o) => o.params.length || o.brief) ?? overloads[0];
    const sigs = [...new Set(overloads.map((o) => o.signature))].sort();
    const parts = [`### \`${name}\``, "", rep.brief];
    if (rep.description && rep.description !== rep.brief)
      parts.push("", rep.description);
    parts.push(
      "",
      sigs.length > 1
        ? `**${sigs.length} overloads** (one per encrypted type):`
        : "**Signature:**",
      "",
      "```sql",
      ...sigs,
      "```",
    );
    if (rep.params.length) parts.push(paramsTable(rep.params));
    if (rep.returns?.type || rep.returns?.description) {
      const t = rep.returns.type ? `\`${rep.returns.type}\`` : "";
      parts.push(
        "",
        `**Returns:** ${t}${rep.returns.description ? ` — ${rep.returns.description}` : ""}`,
      );
    }
    sections.push(parts.join("\n"));
  }
  return sections.join("\n\n");
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
  // Operators (`->`, `>`) reach the manifest as pseudo-functions via Doxygen's
  // operator-name remapping; they render poorly and are already covered by the
  // domain matrix's Operators column, so keep only real named functions here.
  const isNamed = (f: Fn) => /^[a-z_][a-z0-9_]*$/.test(f.name);
  const publicFns = manifest.functions.filter(
    (f) => f.visibility === "public" && isNamed(f),
  );
  const privateFns = manifest.functions.filter(
    (f) => f.visibility === "private",
  );

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
    "<EqlVersion />",
    "",
    `<Callout type="info">`,
    `Generated from the **EQL ${version}** manifest (the Doxygen'd SQL is the source of truth). For the model behind these — variants, terms, typed operands — see [Core concepts](/reference/eql/core-concepts).`,
    `</Callout>`,
    "",
    "The EQL SQL surface — encrypted domains (in the `public` schema) and the `eql_v3` functions behind them. The type and query pages explain *when* to use these; this page is the exhaustive reference they link to.",
    "",
    renderDomains(manifest.domains ?? []),
    "## Functions",
    "",
    `The public \`eql_v3\` API — ${new Set(publicFns.map((f) => f.name)).size} functions (${publicFns.length} overloads). Internal \`eql_v3_internal\` functions (${privateFns.length}) are implementation detail and omitted.`,
    "",
    renderPublicFunctions(publicFns),
  ];

  return `${body.join("\n").trimEnd()}\n`;
}

// ── Per-type function fragments ──────────────────────────────────────────────
// Each hand-written type page (numbers, text, dates-and-times) carries a
// per-function reference: one card per EQL function, listing its operator
// equivalents, the domains it applies to, and a worked example. These are
// generated from the manifest and `<include>`d into the page (via the `<EqlFn>`
// component) rather than hand-maintained, where the domain lists silently
// drifted. The example is the one authored part — templated by capability, not
// pulled from the manifest — and the domain list, the drift-prone part, is not.
//
// json and booleans are intentionally NOT here: json's surface is containment /
// path functions (a bespoke story, not the eq/ord/min-max set), and booleans
// are storage-only with no query functions.
interface FragmentSpec {
  page: string;
  // Which manifest domain `type`s belong on this page.
  match: (type: string) => boolean;
  // Illustrative context for the generated examples.
  table: string;
  col: string;
  // Representative concrete type the example casts to, e.g. `bigint` →
  // `public.eql_v3_bigint_ord`. One of the page's family, for a realistic cast.
  castType: string;
  // On text, ranges are unusual and sorting is the point, so the comparison
  // example demonstrates ORDER BY. Elsewhere a range filter reads best.
  orderByExample: boolean;
}

const FRAGMENT_SPECS: FragmentSpec[] = [
  {
    page: "numbers",
    match: (t) =>
      /(^|\b)(small|big)?int|integer|numeric|decimal|real|double|float/.test(t),
    table: "payments",
    col: "amount",
    castType: "bigint",
    orderByExample: false,
  },
  {
    page: "text",
    match: (t) => t === "text",
    table: "users",
    col: "email",
    castType: "text",
    orderByExample: true,
  },
  {
    page: "dates-and-times",
    match: (t) => /date|time/.test(t),
    table: "events",
    col: "occurred_at",
    castType: "timestamp",
    orderByExample: false,
  },
];

// The EQL function set, in reading order. `cap` is the domain capability that
// exposes the function, so a function only renders when the page has a domain
// with that capability. `lt`/`lte`/`gt`/`gte` are one card: same capability,
// same domains. `id` is the deep-link anchor.
interface FuncDef {
  id: string;
  name: string;
  ops: string[];
  cap: string;
  agg?: boolean;
}
const FUNCS: FuncDef[] = [
  { id: "fn-eq", name: "eql_v3.eq(a, b)", ops: ["="], cap: "equality" },
  { id: "fn-neq", name: "eql_v3.neq(a, b)", ops: ["<>"], cap: "equality" },
  {
    id: "fn-comparison",
    name: "eql_v3.lt / lte / gt / gte",
    ops: ["<", "<=", ">", ">="],
    cap: "order",
  },
  {
    id: "fn-contains",
    name: "eql_v3.contains(a, b)",
    ops: ["@>"],
    cap: "match",
  },
  {
    id: "fn-contained_by",
    name: "eql_v3.contained_by(a, b)",
    ops: ["<@"],
    cap: "match",
  },
  {
    id: "fn-min",
    name: "eql_v3.min(col)",
    ops: ["MIN"],
    cap: "order",
    agg: true,
  },
  {
    id: "fn-max",
    name: "eql_v3.max(col)",
    ops: ["MAX"],
    cap: "order",
    agg: true,
  },
];

// `public.eql_v3_text_eq` → `text_eq`.
const shortDomain = (name: string) => name.replace(/^public\.(eql_v3_)?/, "");

// The example for one function, keyed by its anchor id and templated from the
// page's illustrative context. The `::public.eql_v3_<type>_<variant>` casts use
// real domain names, so they stay correct; the table and column are illustrative.
function exampleFor(id: string, spec: FragmentSpec): string {
  const { table, col, castType } = spec;
  const dom = (variant: string) => `public.eql_v3_${castType}_${variant}`;
  switch (id) {
    case "fn-eq":
      return `SELECT * FROM ${table}\nWHERE eql_v3.eq(${col}, $1::${dom("eq")});`;
    case "fn-neq":
      return `SELECT * FROM ${table}\nWHERE eql_v3.neq(${col}, $1::${dom("eq")});`;
    case "fn-comparison":
      return spec.orderByExample
        ? `-- any of the four; ordering is the usual reason to index text\nSELECT id, ${col} FROM ${table}\nWHERE eql_v3.gt(${col}, $1::${dom("ord")})\nORDER BY eql_v3.ord_term(${col});`
        : `-- a range uses two of the four\nSELECT * FROM ${table}\nWHERE eql_v3.gte(${col}, $1::${dom("ord")})\n  AND eql_v3.lt(${col}, $2::${dom("ord")});`;
    case "fn-contains":
      return `-- token containment on the bloom-filter term\nSELECT * FROM ${table}\nWHERE eql_v3.contains(${col}, $1::${dom("match")});`;
    case "fn-contained_by":
      return `SELECT * FROM ${table}\nWHERE eql_v3.contained_by(${col}, $1::${dom("match")});`;
    case "fn-min":
      return `-- compares ordering terms; result decrypts client-side\nSELECT eql_v3.min(${col}) FROM ${table};`;
    case "fn-max":
      return `SELECT eql_v3.max(${col}) FROM ${table};`;
    default:
      return "";
  }
}

function renderFragment(domains: Domain[], spec: FragmentSpec): string {
  const scoped = domains.filter((d) => spec.match(d.type));
  const header = `{/* GENERATED — do not edit. Produced by scripts/generate-eql-api-docs.ts from the EQL manifest. Edit the generator, not this file. */}`;
  const intro =
    "Every operator has a function form, for managed platforms that disallow custom operators — same typed arguments, identical resolution. Each lists the encrypted domains it applies to; the `MIN` / `MAX` aggregates only exist as functions.";
  if (!scoped.length) {
    return `${header}\n\n${intro}\n\n_No matching encrypted domains in this EQL manifest._\n`;
  }

  const blocks: string[] = [];
  for (const fn of FUNCS) {
    const applies = scoped
      .filter((d) => d.capabilities.includes(fn.cap) && d.variant)
      .map((d) => shortDomain(d.name));
    if (!applies.length) continue;
    const attrs = [
      `ops="${fn.ops.join(",")}"`,
      fn.agg ? "agg" : "",
      `domains="${applies.join(",")}"`,
    ]
      .filter(Boolean)
      .join(" ");
    const example = exampleFor(fn.id, spec);
    // The name is a real `###` heading with an explicit id, so each function
    // gets a table-of-contents entry (nested under "Functions") and a stable
    // deep-link anchor. The `<EqlFn>` card renders everything below it.
    blocks.push(
      `### ${fn.name} [#${fn.id}]\n\n<EqlFn ${attrs}>\n\n\`\`\`sql\n${example}\n\`\`\`\n\n</EqlFn>`,
    );
  }

  return `${header}\n\n${intro}\n\n${blocks.join("\n\n")}\n`;
}

function writeFragments(manifest: Manifest): void {
  fs.mkdirSync(FRAGMENT_DIR, { recursive: true });
  for (const spec of FRAGMENT_SPECS) {
    const out = path.join(FRAGMENT_DIR, `functions-${spec.page}.mdx`);
    fs.writeFileSync(out, renderFragment(manifest.domains ?? [], spec));
    console.log(`✓ Generated ${path.relative(process.cwd(), out)}`);
  }
}

// ── Drift guard ──────────────────────────────────────────────────────────────
// The known surface is fully schema-qualified: domains live in `public.`,
// functions in `eql_v3.` (public) or `eql_v3_internal.` (private), and the
// per-domain extractor term-functions come pre-qualified from the catalog.
// Matching schema-AND-name means a right-name/wrong-schema reference — e.g.
// `eql_v3.text_eq`, whose domain is actually `public.text_eq` — is flagged too,
// not just fabricated names.
function knownSymbols(manifest: Manifest): Set<string> {
  const known = new Set<string>();
  for (const d of manifest.domains ?? []) {
    known.add(d.name); // public.<domain>
    for (const fn of d.termFunctions ?? []) known.add(fn); // eql_v3.<extractor>
  }
  for (const f of manifest.functions) {
    const schema = f.visibility === "private" ? "eql_v3_internal" : "eql_v3";
    known.add(`${schema}.${f.name}`);
  }
  return known;
}

function driftCheck(manifest: Manifest): string[] {
  const known = knownSymbols(manifest);
  const referenced = new Map<string, Set<string>>(); // fqn -> pages

  for (const file of fs.readdirSync(EQL_DIR)) {
    if (!file.endsWith(".mdx") || file === "functions.mdx") continue;
    const text = fs.readFileSync(path.join(EQL_DIR, file), "utf8");
    // Any schema-qualified reference — function call, domain cast, or type.
    // A trailing `*` marks a prose family (e.g. `eql_v3.jsonb_path_*`), which
    // names a set rather than one symbol, so it's skipped. So is a trailing
    // `<T>` placeholder (e.g. `public.eql_v3_<T>_ord`).
    for (const m of text.matchAll(
      /\b(public|eql_v3_internal|eql_v3)\.([a-z0-9_]+)(\*?)/g,
    )) {
      if (m[3] === "*") continue;
      if (text[(m.index ?? 0) + m[0].length] === "<") continue;
      const fqn = `${m[1]}.${m[2]}`;
      const pages = referenced.get(fqn) ?? new Set<string>();
      pages.add(file);
      referenced.set(fqn, pages);
    }
  }

  const unknown: string[] = [];
  for (const [fqn, pages] of referenced) {
    if (known.has(fqn) || MANIFEST_BLIND_SPOTS.has(fqn)) continue;
    unknown.push(`${fqn}  (in ${[...pages].join(", ")})`);
  }
  return unknown.sort();
}

// Symbols that EQL really ships but the manifest's catalog does not list, so
// the drift check would reject a correct reference.
//
// The scalar query-operand domains (`eql_v3.query_text_eq`, and 39 siblings)
// are created inside a `DO ... EXECUTE` block in the install SQL, which the
// catalog generator does not walk — `eql_v3.query_jsonb`, created at the top
// level, IS in the manifest. Verified present in the 3.0.0 install SQL:
//   grep -c "CREATE DOMAIN eql_v3.query_" cipherstash-encrypt.sql  # => 40
//
// Keep this list minimal, and delete entries as the manifest grows to cover
// them.
const MANIFEST_BLIND_SPOTS = new Set(["eql_v3.query_text_eq"]);

// ── Main ─────────────────────────────────────────────────────────────────────
function main() {
  const manifest = loadManifest();

  fs.mkdirSync(EQL_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, render(manifest));

  // Per-type function fragments included into the hand-written type pages.
  writeFragments(manifest);

  // Emit the release version for the <EqlVersion> banner (shared by every EQL
  // reference page, hand-written and generated alike).
  fs.mkdirSync(path.dirname(VERSION_FILE), { recursive: true });
  fs.writeFileSync(
    VERSION_FILE,
    `// GENERATED by scripts/generate-eql-api-docs.ts from the EQL release manifest.\n// Do not edit; the prebuild step overwrites it with the version of the EQL\n// release the docs are built against.\nexport const EQL_VERSION = ${JSON.stringify(manifest.version)};\n`,
  );
  console.log(
    `✓ Generated ${path.relative(process.cwd(), OUT_FILE)} from EQL ${manifest.version} (${manifest.functions.length} functions)`,
  );

  const unknown = driftCheck(manifest);
  if (unknown.length) {
    const header = `⚠ ${unknown.length} schema-qualified symbol(s) referenced in hand-written pages are not in the manifest (domains or functions):`;
    console.warn(`\n${header}`);
    for (const u of unknown) console.warn(`  - ${u}`);
    if (STRICT) {
      console.error(
        "\nDrift check failed (STRICT). Fix the reference or update the pinned EQL version.",
      );
      process.exit(1);
    } else {
      console.warn(
        "\n(Report-only: using the illustrative sample manifest, which covers only a few symbols. A real manifest — the release asset or EQL_MANIFEST_PATH — makes this a failing gate.)",
      );
    }
  } else {
    console.log(
      "✓ Drift check: all schema-qualified symbols resolve against the manifest.",
    );
  }
}

main();
