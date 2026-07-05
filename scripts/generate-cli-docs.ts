#!/usr/bin/env tsx
/**
 * CLI reference generator — PROTOTYPE (CIP-33xx).
 *
 * Generates the `/reference/cli` pages from the `stash` CLI itself, so the
 * reference can never drift from the shipped command surface. Every page is
 * stamped with the CLI version it was generated from.
 *
 * ── Data source ───────────────────────────────────────────────────────────
 * TODAY (bootstrap): we parse `stash --help`, captured to a fixture. `stash`
 * is a hand-rolled TS CLI with no machine-readable output yet, and no
 * per-command `--help` (every command prints the top-level help), so the
 * single top-level help is the whole surface. It is thin — no args, no
 * per-command examples, `auth`/`encrypt` subcommands undetailed.
 *
 * TARGET: add `stash manifest --json` to the CLI (it already has the command
 * registry it prints `--help` from). Then replace `loadManifest()` with:
 *
 *     JSON.parse(execSync(`npx stash@${CLI_VERSION} manifest --json`))
 *
 * and delete the parser below. The renderer and page format stay identical —
 * that is the point of this prototype.
 *
 * ── Versioning ────────────────────────────────────────────────────────────
 * Always generated from the LATEST published `stash` on npm (resolved via
 * `npm view stash version`), so a new release plus a run of this script — it
 * runs in `prebuild` — refreshes the docs automatically. Every page carries
 * `verifiedAgainst.cli` and a visible banner, so readers and agents always
 * know which version the docs describe. Offline, it falls back to the cached
 * `scripts/fixtures/stash-help.txt`.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CLI_NAME = "stash";
let CLI_VERSION = ""; // resolved to the latest published npm version at run time
const RUNNER = "npx"; // normalized invocation shown in docs
const FIXTURE = path.join(process.cwd(), "scripts/fixtures", "stash-help.txt");
const OUT_DIR = path.join(process.cwd(), "content/docs/reference/cli");

// ── Types (this shape is the spec for `stash manifest --json`) ──────────────
interface Flag {
  name: string; // "--supabase"
  value?: string; // "<path>"
  description: string;
  appliesTo?: string[]; // db-flag applicability: ["install", "upgrade"] or ["all"]
}
interface Command {
  path: string; // "db install"
  base: string; // "db"
  sub?: string; // "install"
  summary: string;
  flags: Flag[];
  examples: string[];
}
interface Manifest {
  name: string;
  version: string;
  usage: string;
  globalFlags: Flag[];
  commands: Command[];
}

// Which nav group each top-level command belongs to, and the group order.
const GROUPS: Record<string, string> = {
  init: "Setup & workflow",
  plan: "Setup & workflow",
  impl: "Setup & workflow",
  status: "Setup & workflow",
  wizard: "Setup & workflow",
  auth: "Auth",
  db: "Database",
  schema: "Schema",
  encrypt: "Encrypt",
  env: "Deployment",
};
const GROUP_ORDER = [
  "Setup & workflow",
  "Auth",
  "Database",
  "Schema",
  "Encrypt",
  "Deployment",
];
// Known db/schema subcommand names, used to resolve db-flag applicability.
const DB_SUBCOMMANDS = new Set([
  "install",
  "upgrade",
  "push",
  "activate",
  "validate",
  "migrate",
  "status",
  "test-connection",
]);

// EQL/Postgres commands get the `eql` component facet too (content-model rule:
// tag `eql` only for queryable-in-Postgres ciphertext).
const componentsFor = (base: string): string[] =>
  ["db", "schema", "encrypt"].includes(base) ? ["cli", "eql"] : ["cli"];

// ── Source ──────────────────────────────────────────────────────────────────
// Resolve the latest published version so the docs track releases automatically.
function latestVersion(): string {
  try {
    return execSync(`npm view ${CLI_NAME} version`, { encoding: "utf8" }).trim();
  } catch {
    const cached = fs.existsSync(FIXTURE)
      ? fs.readFileSync(FIXTURE, "utf8").match(/CipherStash CLI v([0-9.]+)/)?.[1]
      : undefined;
    if (cached) {
      console.warn(`⚠ npm unreachable; using cached stash v${cached}.`);
      return cached;
    }
    throw new Error("Cannot resolve latest stash version (offline, no fixture).");
  }
}

// Run the resolved CLI version and cache its help. (Target: `stash manifest --json`.)
function loadHelp(version: string): string {
  try {
    const out = execSync(`npx --yes ${CLI_NAME}@${version} --help`, {
      encoding: "utf8",
      cwd: os.tmpdir(),
      stdio: ["ignore", "pipe", "ignore"],
    });
    fs.mkdirSync(path.dirname(FIXTURE), { recursive: true });
    fs.writeFileSync(FIXTURE, out);
    return out;
  } catch {
    if (fs.existsSync(FIXTURE)) {
      console.warn(`⚠ Could not run stash@${version}; using cached fixture.`);
      return fs.readFileSync(FIXTURE, "utf8");
    }
    throw new Error(`Could not run stash@${version} and no cached fixture exists.`);
  }
}

// Drop dotenvx's env-injection tips and blank leading noise.
const stripNoise = (text: string): string[] =>
  text
    .split("\n")
    .filter((l) => !/^\s*◇|injected env|dotenvx|www\.(dotenvx|vestauth)/.test(l));

// ── Parser (delete once `stash manifest --json` exists) ─────────────────────
function parseHelp(text: string): Manifest {
  const lines = stripNoise(text);
  const joined = lines.join("\n");

  const version = joined.match(/CipherStash CLI v([0-9]+\.[0-9]+\.[0-9]+)/)?.[1] ?? CLI_VERSION;

  // Section boundaries: a line like "Commands:", "Options:", "DB Flags:", "Examples:".
  const sections: Record<string, string[]> = {};
  let current = "";
  for (const line of lines) {
    const header = line.match(/^([A-Za-z][A-Za-z ]*):\s*$/);
    if (header && !line.startsWith(" ")) {
      current = header[1].trim();
      sections[current] = [];
    } else if (current) {
      sections[current].push(line);
    }
  }

  // Commands: "  db install           Scaffold ..." (name is non-greedy up to 2+ spaces)
  const commands: Command[] = [];
  for (const line of sections.Commands ?? []) {
    const m = line.match(/^ {2}(\S.*?) {2,}(.+)$/);
    if (!m) continue;
    const rawName = m[1].replace(/\s*<subcommand>\s*/, "").trim();
    const [base, ...rest] = rawName.split(/\s+/);
    commands.push({
      path: rawName,
      base,
      sub: rest.length ? rest.join(" ") : undefined,
      summary: m[2].trim(),
      flags: [],
      examples: [],
    });
  }

  // Global options.
  const globalFlags = parseFlagBlock(sections.Options ?? []);

  // Per-command flag sections: "Init Flags", "Plan Flags", "DB Flags", …
  for (const [name, body] of Object.entries(sections)) {
    const fm = name.match(/^(.*) Flags$/);
    if (!fm) continue;
    const label = fm[1].toLowerCase(); // "init", "plan", "db"
    const flags = parseFlagBlock(body);
    if (label === "db") {
      // DB flags carry applicability annotations; resolve onto each subcommand.
      for (const cmd of commands.filter((c) => c.base === "db")) {
        cmd.flags = flags.filter(
          (f) =>
            !f.appliesTo ||
            f.appliesTo.includes("all") ||
            (cmd.sub ? f.appliesTo.includes(cmd.sub) : false),
        );
      }
    } else {
      const cmd = commands.find((c) => c.path === label);
      if (cmd) cmd.flags = flags;
    }
  }

  // Examples: "  npx stash db install" → attach to the longest matching command.
  const byLength = [...commands].sort((a, b) => b.path.length - a.path.length);
  for (const line of sections.Examples ?? []) {
    const inv = line.trim();
    const m = inv.match(/^(?:npx|bunx|pnpm dlx|stash)\s+(?:stash\s+)?(.+)$/);
    const argPart = m ? m[1] : inv;
    const cmd = byLength.find(
      (c) => argPart === c.path || argPart.startsWith(`${c.path} `),
    );
    if (cmd) cmd.examples.push(`${RUNNER} ${CLI_NAME} ${argPart}`);
  }

  return {
    name: CLI_NAME,
    version,
    usage: `${RUNNER} ${CLI_NAME} <command> [options]`,
    globalFlags,
    commands,
  };
}

// Parse an indented flag block, folding continuation lines into descriptions.
function parseFlagBlock(body: string[]): Flag[] {
  const flags: Flag[] = [];
  for (const line of body) {
    if (!line.trim()) continue;
    const m = line.match(/^ {2}(--[\w-]+)(?:,\s*-\w)?(?: +(<[^>]+>))? {2,}(.+)$/);
    if (m) {
      let description = m[3].trim();
      let appliesTo: string[] | undefined;
      // Leading "(install, push, …)" on DB flags = applicability (+ conditions).
      const paren = description.match(/^\(([^)]+)\)\s*(.*)$/);
      if (paren) {
        const inner = paren[1].trim();
        if (/^all\b/.test(inner)) {
          // "(all db / schema commands)" — applies everywhere; drop the note.
          appliesTo = ["all"];
          description = paren[2];
        } else {
          const tokens = inner.split(/[,/]/).map((t) => t.trim()).filter(Boolean);
          const applic = tokens.filter((t) => DB_SUBCOMMANDS.has(t));
          const conditions = tokens.filter((t) => !DB_SUBCOMMANDS.has(t));
          if (applic.length) appliesTo = applic;
          description =
            (conditions.length ? `(${conditions.join(", ")}) ` : "") + paren[2];
        }
      }
      flags.push({ name: m[1], value: m[2], description: description.trim(), appliesTo });
    } else {
      const cont = line.trim();
      if (flags.length && cont) flags[flags.length - 1].description += ` ${cont}`;
    }
  }
  return flags;
}

// ── Render ───────────────────────────────────────────────────────────────────
const generatedMarker = (): string =>
  `{/* GENERATED — do not edit. Produced by scripts/generate-cli-docs.ts from \`${CLI_NAME} --help\` (v${CLI_VERSION}). Re-run \`bun run generate-docs:cli\` to refresh from the latest published CLI. */}`;

function banner(): string {
  return `<Callout type="info">
Generated from **\`${CLI_NAME}\` v${CLI_VERSION}**. Run \`${RUNNER} ${CLI_NAME}@${CLI_VERSION} --help\` to see the live command surface.
</Callout>`;
}

function flagsTable(flags: Flag[]): string {
  if (!flags.length) return "";
  const rows = flags
    .map((f) => {
      const opt = `\`${f.name}${f.value ? ` ${f.value}` : ""}\``;
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
    parts.push(`\n${level}# Examples\n`, "```bash", cmd.examples.join("\n"), "```");
  }
  return parts.join("\n");
}

function renderPage(base: string, cmds: Command[]): { slug: string; body: string } {
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
    parts.push(c.summary, "", "```bash", `${RUNNER} ${CLI_NAME} ${c.path}${c.flags.length ? " [flags]" : ""}`, "```");
    if (c.flags.length) parts.push(flagsTable(c.flags));
    if (c.examples.length) parts.push("\n## Examples\n", "```bash", c.examples.join("\n"), "```");
  }

  return { slug: base, body: `${parts.join("\n").trimEnd()}\n` };
}

function renderIndex(manifest: Manifest, groups: Map<string, string[]>): string {
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

  const sections = GROUP_ORDER.filter((g) => groups.has(g))
    .map((g) => {
      const rows = groups
        .get(g)!
        .flatMap((base) =>
          manifest.commands
            .filter((c) => c.base === base)
            .map((c) => {
              const anchor = c.sub ? `#${c.path.replace(/\s+/g, "-")}` : "";
              return `| [\`${c.path}\`](/reference/cli/${base}${anchor}) | ${c.summary} |`;
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

function renderMeta(groups: Map<string, string[]>): string {
  const pages: string[] = [];
  for (const g of GROUP_ORDER) {
    if (!groups.has(g)) continue;
    pages.push(`---${g}---`);
    pages.push(...groups.get(g)!);
  }
  return `${JSON.stringify({ title: "CLI", pages }, null, 2)}\n`;
}

// ── Main ─────────────────────────────────────────────────────────────────────
function loadManifest(): Manifest {
  // Swap point: return JSON.parse(execSync(`npx ${CLI_NAME}@${CLI_VERSION} manifest --json`)).
  return parseHelp(loadHelp(CLI_VERSION));
}

function main() {
  CLI_VERSION = latestVersion();
  const manifest = loadManifest();

  // Group top-level commands by base, preserving discovery order.
  const bases: string[] = [];
  for (const c of manifest.commands) if (!bases.includes(c.base)) bases.push(c.base);

  const groups = new Map<string, string[]>();
  for (const base of bases) {
    const g = GROUPS[base] ?? "Other";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(base);
  }

  // Clean previously generated pages, then write fresh.
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (f.endsWith(".mdx") || f === "meta.json") fs.rmSync(path.join(OUT_DIR, f));
  }

  let count = 0;
  for (const base of bases) {
    const cmds = manifest.commands.filter((c) => c.base === base);
    const { slug, body } = renderPage(base, cmds);
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.mdx`), body);
    count++;
  }
  fs.writeFileSync(path.join(OUT_DIR, "index.mdx"), renderIndex(manifest, groups));
  fs.writeFileSync(path.join(OUT_DIR, "meta.json"), renderMeta(groups));

  console.log(
    `✓ Generated ${count} CLI reference page(s) for ${CLI_NAME} v${manifest.version} → ${path.relative(process.cwd(), OUT_DIR)}`,
  );
}

main();
