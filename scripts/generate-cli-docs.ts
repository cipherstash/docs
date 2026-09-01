#!/usr/bin/env tsx
/**
 * CLI reference generator.
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
 * The manifest is read from the committed `scripts/fixtures/stash-manifest.json`,
 * NOT from the network. Every page carries `verifiedAgainst.cli` and a visible
 * banner, so readers and agents always know which version the docs describe.
 *
 * The version is PINNED here, the same way `EQL_RELEASE_TAG` pins EQL in
 * generate-eql-docs.ts, rather than being whatever npm serves that morning.
 * Rendering asserts the fixture matches the pin, so bumping one without
 * regenerating the other fails the build — which is exactly the drift this
 * file exists to prevent, caught without touching the network.
 *
 * `--refresh` installs the pinned CLI into a temp directory and runs it from
 * there. A deliberate, separate step, run by .github/workflows/cli-manifest.yml
 * on a schedule and by hand via `bun run generate-docs:cli:refresh`.
 *
 * It installs into a temp directory rather than depending on `stash` here, and
 * that was tried first: `stash` needs zod 3, fumadocs needs zod 4, and adding
 * it hoists zod 3 to the root, at which point the frontmatter schema in
 * source.config.ts stops inferring and `page.data.navTitle` types as `{}`. A
 * docs build should not be able to be broken by the CLI's dependency tree.
 *
 * This used to resolve and invoke the CLI on every build, falling back to the
 * fixture when that failed. It has never once succeeded on Vercel. Every
 * production build log carries the fallback, going back as far as the logs are
 * retained:
 *
 *   2026-08-16  ⚠ Could not run stash@1.0.0; using cached fixture.
 *   2026-08-18  ⚠ Could not run stash@1.1.0; using cached fixture.
 *   2026-08-31  ⚠ Could not run stash@1.1.1; using cached fixture.
 *
 * The docs looked right for as long as the committed fixture happened to be
 * the latest published version. When 1.1.x shipped, a failure that was already
 * there simply became visible — as eleven days of a version-old reference.
 *
 * WHY the `npx` invocation failed there was never captured: it ran with
 * `stdio: [..., "ignore"]`, so stderr was discarded on every one of those
 * runs. It failed in a consistent ~8 seconds while `npm view` in the same
 * script succeeded, so the registry was reachable. Nothing here runs `npx` any
 * more — the CLI is installed, so the question stops mattering — but the
 * refresh step inherits stderr, so if the equivalent ever fails it says why.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CLI_NAME = "stash";
// The CLI release the reference describes. To upgrade: bump this, run
// `bun run generate-docs:cli:refresh`, and read the command diff — a release
// removes commands as well as adding them. .github/workflows/cli-manifest.yml
// does all three and opens a PR.
const CLI_VERSION_PIN = process.env.STASH_VERSION ?? "1.1.1";
// Refresh the fixture from npm instead of reading it. CI and humans only.
const REFRESH = process.argv.includes("--refresh");
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
  long?: string;
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
function readFixture(): CliManifest {
  if (!fs.existsSync(FIXTURE)) {
    throw new Error(
      `No cached manifest at ${path.relative(process.cwd(), FIXTURE)}. Run \`bun run generate-docs:cli:refresh\` to create it.`,
    );
  }
  const manifest = JSON.parse(fs.readFileSync(FIXTURE, "utf8")) as CliManifest;

  // The gate. Bumping the pin without regenerating would ship a reference
  // describing a version nobody is running. Costs no network.
  if (manifest.version !== CLI_VERSION_PIN) {
    throw new Error(
      `Cached manifest is ${CLI_NAME} v${manifest.version} but the pin is v${CLI_VERSION_PIN}. Run \`bun run generate-docs:cli:refresh\` and commit the result.`,
    );
  }
  return manifest;
}

// Install the pinned CLI into a throwaway directory and read its
// `manifest --json` from there, rewriting the fixture.
//
// Installed rather than run through `npx --yes stash@<version>`, which is what
// this used to do and what never once worked on Vercel. dotenvx (the CLI's
// launcher) may print tips before the JSON, so slice from the first `{` to the
// last `}` defensively. stderr is inherited rather than discarded: when this
// fails, the reason is the only useful output.
function refreshFixture(): CliManifest {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stash-manifest-"));
  try {
    fs.writeFileSync(
      path.join(dir, "package.json"),
      `${JSON.stringify({ name: "stash-manifest-probe", private: true })}\n`,
    );
    execSync(`bun add ${CLI_NAME}@${CLI_VERSION_PIN}`, {
      cwd: dir,
      stdio: ["ignore", "ignore", "inherit"],
    });
    const out = execSync(
      `${path.join(dir, "node_modules", ".bin", CLI_NAME)} manifest --json`,
      { encoding: "utf8", cwd: dir, stdio: ["ignore", "pipe", "inherit"] },
    );
    const start = out.indexOf("{");
    const end = out.lastIndexOf("}");
    if (start === -1 || end < start) {
      throw new Error(
        `\`${CLI_NAME} manifest --json\` did not emit a JSON object (got: ${out.trim().slice(0, 120)}…)`,
      );
    }
    const manifest = JSON.parse(out.slice(start, end + 1)) as CliManifest;
    if (manifest.version !== CLI_VERSION_PIN) {
      throw new Error(
        `Installed ${CLI_NAME}@${CLI_VERSION_PIN} reported v${manifest.version} in its manifest.`,
      );
    }
    fs.mkdirSync(path.dirname(FIXTURE), { recursive: true });
    fs.writeFileSync(FIXTURE, `${JSON.stringify(manifest, null, 2)}\n`);
    return manifest;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
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
        long: c.long,
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

// Escape characters MDX parses as JSX inside prose: `{`/`}` (expression braces —
// e.g. the `auth regions` flag description "[{ slug, label }]" would otherwise
// evaluate `slug` and crash the prerender) and stray `<` (tags). Flag names and
// values render inside code spans, which are literal, so this only applies to
// manifest-derived prose (descriptions, summaries, and long help).
const escapeMdxText = (s: string): string =>
  s
    .split(/(`[^`\n]*`)/g)
    .map((part) =>
      part.startsWith("`") ? part : part.replace(/([{}<])/g, "\\$1"),
    )
    .join("");

function flagsTable(flags: Flag[]): string {
  if (!flags.length) return "";
  const rows = flags
    .map((f) => {
      // Escape pipes in option values so they don't read as table-column
      // separators, even inside the code span.
      const opt = `\`${f.name}${f.value ? ` ${f.value}` : ""}\``.replace(
        /\|/g,
        "\\|",
      );
      const description = escapeMdxText(f.description).replace(/\|/g, "\\|");
      return `| ${opt} | ${description} |`;
    })
    .join("\n");
  return `\n### Flags\n\n| Flag | Description |\n| --- | --- |\n${rows}\n`;
}

function commandSection(cmd: Command, level: "##" | "###"): string {
  const synopsis = `${RUNNER} ${CLI_NAME} ${cmd.path}${cmd.flags.length ? " [flags]" : ""}`;
  const parts = [
    `${level} \`${cmd.path}\``,
    "",
    escapeMdxText(cmd.long ?? cmd.summary),
    "",
    "```bash",
    synopsis,
    "```",
  ];
  // Named after the command, for the same reason the single-command page names
  // its examples section: a chunk lifted out of the page has to carry its own
  // subject. On a group page it also stops the headings colliding — eql.mdx
  // carried five identical "Examples" and eight identical "Flags", which is
  // five and eight duplicate anchors as well as eight indistinguishable chunks.
  if (cmd.flags.length)
    parts.push(
      flagsTable(cmd.flags).replace(
        "### Flags",
        `${level}# ${CLI_NAME} ${cmd.path} flags`,
      ),
    );
  if (cmd.examples.length) {
    parts.push(
      `\n${level}# ${CLI_NAME} ${cmd.path} examples\n`,
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
      escapeMdxText(c.long ?? c.summary),
      "",
      "```bash",
      `${RUNNER} ${CLI_NAME} ${c.path}${c.flags.length ? " [flags]" : ""}`,
      "```",
    );
    if (c.flags.length) parts.push(flagsTable(c.flags));
    if (c.examples.length)
      // Named rather than a bare "## Examples": retrieval matches a query
      // against this section alone, where the page H1 that supplied the
      // command name is absent. "stash init examples" carries it.
      parts.push(
        `\n## ${CLI_NAME} ${c.path} examples\n`,
        "```bash",
        c.examples.join("\n"),
        "```",
      );
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
    "navTitle: Overview",
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
      const rows = (groups.get(g) ?? [])
        .flatMap((base) =>
          manifest.commands
            .filter((c) => c.base === base)
            .map((c) => {
              const anchor = c.sub ? `#${c.path.replace(/\s+/g, "-")}` : "";
              const summary = escapeMdxText(c.summary).replace(/\|/g, "\\|");
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
  const pages: string[] = ["index"];
  for (const g of manifest.groupOrder) {
    const groupPages = groups.get(g);
    if (!groupPages) continue;
    pages.push(`---${g}---`);
    pages.push(...groupPages);
  }
  return `${JSON.stringify({ title: "CLI", pages }, null, 2)}\n`;
}

// ── Main ─────────────────────────────────────────────────────────────────────
function loadManifest(): Manifest {
  // The manifest is authoritative for what to stamp, so the version is read
  // back off it rather than assumed.
  return toManifest(REFRESH ? refreshFixture() : readFixture());
}

function main() {
  const manifest = loadManifest();
  CLI_VERSION = manifest.version;

  // Group top-level commands by base, preserving discovery order.
  const bases: string[] = [];
  for (const c of manifest.commands)
    if (!bases.includes(c.base)) bases.push(c.base);

  // Nav groups, in the order the CLI declares them; a base inherits the group
  // of its commands.
  const groups = new Map<string, string[]>();
  for (const g of manifest.groupOrder) groups.set(g, []);
  for (const base of bases) {
    const command = manifest.commands.find((c) => c.base === base);
    if (!command) throw new Error(`No command found for base "${base}".`);

    const group = groups.get(command.group);
    if (!group) {
      throw new Error(
        `Command "${command.path}" uses undeclared group "${command.group}".`,
      );
    }
    group.push(base);
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
