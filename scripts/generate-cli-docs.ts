#!/usr/bin/env tsx
/**
 * CLI reference generator (CIP-33xx).
 *
 * Generates the `/reference/cli` pages from the `stash` CLI itself, so the
 * reference can never drift from the shipped command surface. Every page is
 * stamped with the CLI version it was generated from.
 *
 * ── Data source ───────────────────────────────────────────────────────────
 * We consume `stash manifest --json` (shipped in stash CLI 0.17) — the
 * structured, versioned command surface the CLI builds from its own command
 * registry. Groups, summaries, per-command flags (with defaults + env vars),
 * and curated examples all come straight from the CLI, so the docs are a
 * projection of the real command set rather than a scrape of `--help`.
 *
 * ── Versioning ────────────────────────────────────────────────────────────
 * Always generated from the LATEST published `stash` on npm (resolved via
 * `npm view stash version`), so a new release plus a run of this script — it
 * runs in `prebuild` — refreshes the docs automatically. Every page carries
 * `verifiedAgainst.cli` and a visible banner, so readers and agents always
 * know which version the docs describe. Offline, it falls back to the cached
 * `scripts/fixtures/stash-manifest.json`.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CLI_NAME = "stash";
let CLI_VERSION = ""; // resolved to the latest published npm version at run time
const RUNNER = "npx"; // normalized invocation shown in docs
const FIXTURE = path.join(
  process.cwd(),
  "scripts/fixtures",
  "stash-manifest.json",
);
const OUT_DIR = path.join(process.cwd(), "content/docs/reference/cli");
// Hand-authored per-command prose merged into the generated page (hybrid model):
// the generated skeleton (synopsis + flags + examples) stays drift-free; a
// supplement adds rich narrative the manifest doesn't carry. Lives outside
// content/ so it's never treated as a page or wiped by the clean step. Where
// the CLI grows per-command long-help, that prose can migrate into the CLI and
// this hook retires.
const SUPPLEMENTS_DIR = path.join(process.cwd(), "scripts/cli-supplements");

// ── The `stash manifest --json` contract ────────────────────────────────────
// Mirrors packages/cli/src/cli/manifest.ts in the stack repo. Command `name`
// is the full path ("eql install"); flags are already resolved per-command.
interface CliFlag {
  name: string; // "--supabase"
  value?: string; // "<slug>"
  description: string;
  default?: string; // surfaced default, when worth showing
  env?: string; // env var that also sets this, e.g. DATABASE_URL
}
interface CliCommand {
  name: string;
  summary: string;
  long?: string;
  examples?: string[];
  flags?: CliFlag[];
}
interface CliGroup {
  title: string;
  commands: CliCommand[];
}
interface CliManifest {
  name: string;
  version: string;
  groups: CliGroup[];
}

// ── Internal model (what the renderer consumes) ─────────────────────────────
interface Flag {
  name: string;
  value?: string;
  description: string;
}
interface Command {
  path: string; // "eql install"
  base: string; // "eql"
  sub?: string; // "install"
  group: string; // nav group title, from the manifest
  summary: string;
  flags: Flag[];
  examples: string[];
}
interface Manifest {
  name: string;
  version: string;
  commands: Command[];
  groupOrder: string[]; // nav group order, as the CLI declares it
}

// EQL/Postgres command groups get the `eql` component facet too (content-model
// rule: tag `eql` for queryable-in-Postgres ciphertext).
const componentsFor = (base: string): string[] =>
  ["eql", "db", "schema", "encrypt"].includes(base) ? ["cli", "eql"] : ["cli"];

// ── Source ──────────────────────────────────────────────────────────────────
// Resolve the latest published version so the docs track releases automatically.
function latestVersion(): string {
  try {
    return execSync(`npm view ${CLI_NAME} version`, {
      encoding: "utf8",
    }).trim();
  } catch {
    const cached = fs.existsSync(FIXTURE)
      ? (JSON.parse(fs.readFileSync(FIXTURE, "utf8")) as CliManifest).version
      : undefined;
    if (cached) {
      console.warn(`⚠ npm unreachable; using cached stash v${cached}.`);
      return cached;
    }
    throw new Error(
      "Cannot resolve latest stash version (offline, no fixture).",
    );
  }
}

// Run the resolved CLI and read its `manifest --json`, caching to a fixture for
// offline builds. dotenvx (the CLI's launcher) may print tips before the JSON,
// so slice from the first `{` to the last `}` defensively.
function loadRawManifest(version: string): CliManifest {
  try {
    const out = execSync(`npx --yes ${CLI_NAME}@${version} manifest --json`, {
      encoding: "utf8",
      cwd: os.tmpdir(),
      stdio: ["ignore", "pipe", "ignore"],
    });
    const json = out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1);
    const manifest = JSON.parse(json) as CliManifest;
    fs.mkdirSync(path.dirname(FIXTURE), { recursive: true });
    fs.writeFileSync(FIXTURE, `${JSON.stringify(manifest, null, 2)}\n`);
    return manifest;
  } catch {
    if (fs.existsSync(FIXTURE)) {
      console.warn(`⚠ Could not run stash@${version}; using cached fixture.`);
      return JSON.parse(fs.readFileSync(FIXTURE, "utf8")) as CliManifest;
    }
    throw new Error(
      `Could not run stash@${version} manifest --json and no cached fixture exists.`,
    );
  }
}

// Fold the manifest's richer flag metadata (default + env) into the description
// column so the page format (Flag | Description) stays a single table.
function mapFlag(f: CliFlag): Flag {
  const notes: string[] = [];
  if (f.default !== undefined) notes.push(`default: \`${f.default}\``);
  if (f.env) notes.push(`env: \`${f.env}\``);
  const description = notes.length
    ? `${f.description} (${notes.join("; ")})`
    : f.description;
  return { name: f.name, value: f.value, description };
}

// Project the CLI manifest onto the internal model the renderer consumes.
function toManifest(m: CliManifest): Manifest {
  const commands: Command[] = [];
  const groupOrder: string[] = [];
  for (const group of m.groups) {
    if (!group.commands.length) continue;
    if (!groupOrder.includes(group.title)) groupOrder.push(group.title);
    for (const c of group.commands) {
      const [base, ...rest] = c.name.split(/\s+/);
      commands.push({
        path: c.name,
        base,
        sub: rest.length ? rest.join(" ") : undefined,
        group: group.title,
        summary: c.summary,
        flags: (c.flags ?? []).map(mapFlag),
        examples: (c.examples ?? []).map((e) => `${RUNNER} ${CLI_NAME} ${e}`),
      });
    }
  }
  return { name: m.name, version: m.version, commands, groupOrder };
}

// ── Render ───────────────────────────────────────────────────────────────────
const generatedMarker = (): string =>
  `{/* GENERATED — do not edit. Produced by scripts/generate-cli-docs.ts from \`${CLI_NAME} manifest --json\` (v${CLI_VERSION}). Re-run \`bun run generate-docs:cli\` to refresh from the latest published CLI. */}`;

function banner(): string {
  return `<Callout type="info">
Generated from **\`${CLI_NAME}\` v${CLI_VERSION}** via \`${RUNNER} ${CLI_NAME}@${CLI_VERSION} manifest --json\`. Run \`${RUNNER} ${CLI_NAME}@${CLI_VERSION} --help\` to see the live command surface.
</Callout>`;
}

function flagsTable(flags: Flag[]): string {
  if (!flags.length) return "";
  const rows = flags
    .map((f) => {
      // Escape pipes (e.g. the `<2|3>` in `--eql-version`) so they don't read
      // as table-column separators, even inside the code span.
      const opt = `\`${f.name}${f.value ? ` ${f.value}` : ""}\``.replace(
        /\|/g,
        "\\|",
      );
      return `| ${opt} | ${f.description.replace(/\|/g, "\\|")} |`;
    })
    .join("\n");
  return `\n### Flags\n\n| Flag | Description |\n| --- | --- |\n${rows}\n`;
}

function commandSection(cmd: Command, level: "##" | "###"): string {
  const synopsis = `${RUNNER} ${CLI_NAME} ${cmd.path}${cmd.flags.length ? " [flags]" : ""}`;
  const parts = [
    `${level} \`${cmd.path}\``,
    "",
    cmd.summary,
    "",
    "```bash",
    synopsis,
    "```",
  ];
  if (cmd.flags.length)
    parts.push(flagsTable(cmd.flags).replace("### Flags", `${level}# Flags`));
  if (cmd.examples.length) {
    parts.push(
      `\n${level}# Examples\n`,
      "```bash",
      cmd.examples.join("\n"),
      "```",
    );
  }
  return parts.join("\n");
}

function renderPage(
  base: string,
  cmds: Command[],
): { slug: string; body: string } {
  const isGroup = cmds.some((c) => c.sub) || cmds.length > 1;
  const title = base;
  const components = componentsFor(base);
  const description = isGroup
    ? `Reference for the \`${CLI_NAME} ${base}\` commands.`
    : cmds[0].summary;

  const frontmatter = [
    "---",
    `title: ${CLI_NAME} ${title}`,
    `description: ${JSON.stringify(description)}`,
    "type: reference",
    `components: [${components.join(", ")}]`,
    "verifiedAgainst:",
    `  cli: "${CLI_VERSION}"`,
    "---",
  ].join("\n");

  const parts = [frontmatter, "", generatedMarker(), "", banner(), ""];

  if (isGroup) {
    parts.push(
      `The \`${CLI_NAME} ${base}\` command group.`,
      "",
      cmds.map((c) => commandSection(c, "###")).join("\n\n"),
    );
  } else {
    const c = cmds[0];
    parts.push(
      c.summary,
      "",
      "```bash",
      `${RUNNER} ${CLI_NAME} ${c.path}${c.flags.length ? " [flags]" : ""}`,
      "```",
    );
    if (c.flags.length) parts.push(flagsTable(c.flags));
    if (c.examples.length)
      parts.push("\n## Examples\n", "```bash", c.examples.join("\n"), "```");
  }

  const supplement = readSupplement(base);
  const body = `${parts.join("\n").trimEnd()}${supplement ? `\n\n${supplement}` : ""}\n`;
  return { slug: base, body };
}

// Optional hand-authored prose for a command, merged after its generated
// reference. Returns "" when no supplement exists.
function readSupplement(slug: string): string {
  const file = path.join(SUPPLEMENTS_DIR, `${slug}.md`);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8").trim() : "";
}

function renderIndex(
  manifest: Manifest,
  groups: Map<string, string[]>,
): string {
  const frontmatter = [
    "---",
    "title: CLI",
    `description: "Command reference for the ${CLI_NAME} CLI, generated from v${CLI_VERSION}."`,
    "type: reference",
    "components: [cli]",
    "verifiedAgainst:",
    `  cli: "${CLI_VERSION}"`,
    "---",
  ].join("\n");

  const sections = manifest.groupOrder
    .filter((g) => groups.has(g))
    .map((g) => {
      const rows = groups
        .get(g)!
        .flatMap((base) =>
          manifest.commands
            .filter((c) => c.base === base)
            .map((c) => {
              const anchor = c.sub ? `#${c.path.replace(/\s+/g, "-")}` : "";
              const summary = c.summary.replace(/\|/g, "\\|");
              return `| [\`${c.path}\`](/reference/cli/${base}${anchor}) | ${summary} |`;
            }),
        )
        .join("\n");
      return `### ${g}\n\n| Command | Description |\n| --- | --- |\n${rows}`;
    })
    .join("\n\n");

  return `${frontmatter}

${generatedMarker()}

${banner()}

The \`${CLI_NAME}\` CLI. Install with \`${RUNNER} ${CLI_NAME}@${CLI_VERSION}\`. Every command accepts \`--help\` and \`--version\`.

${sections}
`;
}

function renderMeta(manifest: Manifest, groups: Map<string, string[]>): string {
  const pages: string[] = [];
  for (const g of manifest.groupOrder) {
    if (!groups.has(g)) continue;
    pages.push(`---${g}---`);
    pages.push(...groups.get(g)!);
  }
  return `${JSON.stringify({ title: "CLI", pages }, null, 2)}\n`;
}

// ── Main ─────────────────────────────────────────────────────────────────────
function loadManifest(): Manifest {
  return toManifest(loadRawManifest(CLI_VERSION));
}

function main() {
  CLI_VERSION = latestVersion();
  const manifest = loadManifest();

  // Group top-level commands by base, preserving discovery order.
  const bases: string[] = [];
  for (const c of manifest.commands)
    if (!bases.includes(c.base)) bases.push(c.base);

  // Nav groups, in the order the CLI declares them; a base inherits the group
  // of its commands.
  const groups = new Map<string, string[]>();
  for (const g of manifest.groupOrder) groups.set(g, []);
  for (const base of bases) {
    const g = manifest.commands.find((c) => c.base === base)!.group;
    groups.get(g)!.push(base);
  }
  for (const [g, list] of groups) if (!list.length) groups.delete(g);

  // Clean previously generated pages, then write fresh.
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (f.endsWith(".mdx") || f === "meta.json")
      fs.rmSync(path.join(OUT_DIR, f));
  }

  let count = 0;
  for (const base of bases) {
    const cmds = manifest.commands.filter((c) => c.base === base);
    const { slug, body } = renderPage(base, cmds);
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.mdx`), body);
    count++;
  }
  fs.writeFileSync(
    path.join(OUT_DIR, "index.mdx"),
    renderIndex(manifest, groups),
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "meta.json"),
    renderMeta(manifest, groups),
  );

  console.log(
    `✓ Generated ${count} CLI reference page(s) for ${CLI_NAME} v${manifest.version} → ${path.relative(process.cwd(), OUT_DIR)}`,
  );
}

main();
