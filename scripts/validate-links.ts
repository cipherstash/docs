/**
 * Internal-link validation across every MDX page the site serves.
 *
 * Both content collections are covered: `content/docs` (the v2 IA, served from
 * the site root) and `content/stack` (the legacy tree, served under /stack).
 * This script used to know only about content/stack and only about markdown
 * link syntax, which left the entire v2 tree — and every `<Card href=…>` in
 * both trees — unchecked. A page could be renamed or merged away and every
 * link to it would 404 against a green build.
 *
 * For markdown links (`[text](/url)`) and JSX href attributes (`href="/url"`)
 * alike, it checks that:
 *
 *   - the target page exists, in either collection;
 *   - a `#fragment` matches a heading on that page;
 *   - the link carries no `/docs` prefix (Next's basePath prepends it), no
 *     `/index` suffix, and no `.mdx` extension — each of which 404s.
 *
 * Non-page targets are resolved rather than waved through: static files under
 * `public/`, and static route handlers under `src/app` (`/llms.txt` and
 * friends). Anything genuinely unresolvable is an error, so the exceptions
 * stay honest.
 *
 * Anchors are slugged with the same `github-slugger` Fumadocs uses, one
 * slugger per page so repeated headings get the `-1`/`-2` suffixes the
 * renderer produces. Hand-rolled slugification gets this wrong in ways that
 * matter: "Range & order" is `range--order`, not `range-order`.
 *
 * Every line carries its true origin (see `SourceLine`), so a broken link
 * inside an `<include>`d partial is reported against the partial's own path
 * and line rather than an offset position in whichever page pulled it in.
 */
import fs from "node:fs";
import path from "node:path";
import GithubSlugger from "github-slugger";

const ROOT = process.cwd();

/**
 * Content collections and the URL prefix each is served under. Mirrors the
 * `loader({ baseUrl })` calls in src/lib/source.ts — keep them in step.
 */
const COLLECTIONS = [
  { dir: "content/docs", baseUrl: "" },
  { dir: "content/stack", baseUrl: "/stack" },
];

/** Shared MDX fragments, pulled into pages by `<include cwd>`. Not routable. */
const PARTIALS_DIR = "content/partials";

/**
 * A line of MDX plus where it actually came from. Inlining a partial would
 * otherwise renumber every line below the `<include>` directive, silently
 * shifting reported positions by the length of the partial.
 */
interface SourceLine {
  text: string;
  /** Repo-relative path of the file this line is really in. */
  file: string;
  /** 1-indexed line number within that file. */
  line: number;
}

interface Page {
  /** Repo-relative path of the .mdx file, for error messages. */
  file: string;
  /** Heading ids usable as #fragments on this page. */
  anchors: Set<string>;
}

interface BrokenLink {
  file: string;
  line: number;
  url: string;
  reason: string;
}

function collectMdxFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...collectMdxFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith(".mdx"))
      results.push(fullPath);
  }
  return results;
}

/**
 * Read a file into `SourceLine`s with fenced code blocks blanked out. Blanking
 * rather than dropping keeps every line's index aligned with the file on disk.
 * Headings and links inside a code sample are illustrative, not real.
 */
function readLines(file: string): SourceLine[] {
  const rel = path.relative(ROOT, file);
  let fence: string | null = null;
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .map((text, i) => {
      const open = /^\s*(`{3,}|~{3,})/.exec(text);
      let out = text;
      if (fence) {
        if (open && open[1][0] === fence[0] && open[1].length >= fence.length)
          fence = null;
        out = "";
      } else if (open) {
        fence = open[1];
        out = "";
      }
      return { text: out, file: rel, line: i + 1 };
    });
}

/**
 * Fumadocs' `<include cwd>path</include>` inlines a partial at build time, so
 * the partial's headings become anchors on the including page and its links
 * are rendered by it. One level deep — partials don't nest today.
 *
 * The inlined lines keep the partial's own file and line numbers, so positions
 * below the directive stay correct in the including page.
 */
function inlineIncludes(lines: SourceLine[]): SourceLine[] {
  const out: SourceLine[] = [];
  for (const line of lines) {
    out.push(line);
    const match = /<include\s+cwd\s*>([^<]+)<\/include>/.exec(line.text);
    if (!match) continue;
    const partial = path.join(ROOT, match[1].trim());
    if (fs.existsSync(partial)) out.push(...readLines(partial));
  }
  return out;
}

/** Reduce inline markdown to the plain text the slugger would see. */
function headingText(raw: string): string {
  return raw
    .replace(/\[#[^\]]+\]\s*$/, "") // explicit anchor suffix
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/\*([^*]*)\*/g, "$1")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function collectAnchors(lines: SourceLine[]): Set<string> {
  const slugger = new GithubSlugger();
  const anchors = new Set<string>();
  for (const { text } of lines) {
    const match = /^#{1,6}\s+(.+?)\s*$/.exec(text);
    if (!match) continue;
    const explicit = /\[#([^\]]+)\]\s*$/.exec(match[1]);
    if (explicit) {
      anchors.add(explicit[1]);
      continue;
    }
    anchors.add(slugger.slug(headingText(match[1])));
  }
  return anchors;
}

/** content/docs/a/b.mdx → /a/b ; content/stack/a/index.mdx → /stack/a */
function fileToUrl(file: string, dir: string, baseUrl: string): string {
  const rel = path
    .relative(path.join(ROOT, dir), file)
    .replace(/\.mdx$/, "")
    .replace(/(^|\/)index$/, "");
  return `${baseUrl}/${rel}`.replace(/\/+$/, "") || "/";
}

/** True when `child` is `parent` itself or sits underneath it. */
function isInside(child: string, parent: string): boolean {
  return child === parent || child.startsWith(parent + path.sep);
}

type Resolution =
  | { url: string }
  | { error: string }
  // Not a link we can or should resolve (external, anchor-only, expression).
  | null;

/**
 * Resolve a relative link against the collection directory of the file it
 * appears in. Relative links that escape the collection, or that live in a
 * shared partial where there is no single base to resolve against, are
 * reported rather than skipped — a silent skip is how a typo gets through.
 */
function resolveRelative(file: string, link: string): Resolution {
  const abs = path.join(ROOT, file);
  if (isInside(abs, path.join(ROOT, PARTIALS_DIR))) {
    return {
      error:
        "Relative link inside a shared partial — it would resolve differently " +
        "per including page. Use an absolute path.",
    };
  }
  for (const { dir, baseUrl } of COLLECTIONS) {
    const base = path.join(ROOT, dir);
    if (!isInside(abs, base)) continue;
    const resolved = path.resolve(path.dirname(abs), link);
    if (!isInside(resolved, base))
      return { error: `Relative link resolves outside ${dir}.` };
    return {
      url: `${baseUrl}/${path.relative(base, resolved)}`.replace(/\/+$/, ""),
    };
  }
  return { error: "Relative link in a file outside every content collection." };
}

// --- Build the set of things a link may legitimately point at ---------------

const pages = new Map<string, Page>();
/** Per-page line arrays, so each file is read and de-fenced exactly once. */
const fileLines = new Map<string, SourceLine[]>();

for (const { dir, baseUrl } of COLLECTIONS) {
  for (const file of collectMdxFiles(path.join(ROOT, dir))) {
    const lines = inlineIncludes(readLines(file));
    fileLines.set(file, lines);
    pages.set(fileToUrl(file, dir, baseUrl), {
      file: path.relative(ROOT, file),
      anchors: collectAnchors(lines),
    });
  }
}

/** Static files under public/ are served at the site root. */
const assets = new Set<string>();
const walkAssets = (dir: string, prefix = "") => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory())
      walkAssets(path.join(dir, entry.name), `${prefix}/${entry.name}`);
    else assets.add(`${prefix}/${entry.name}`);
  }
};
walkAssets(path.join(ROOT, "public"));

/**
 * Static route handlers (src/app/llms.txt/route.ts → /llms.txt). Dynamic and
 * group segments are skipped: their paths can't be enumerated statically, and
 * no documentation link targets one.
 */
const routes = new Set<string>();
const walkRoutes = (dir: string, prefix = "") => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name.startsWith("[") || entry.name.startsWith("(")) continue;
      walkRoutes(path.join(dir, entry.name), `${prefix}/${entry.name}`);
    } else if (/^route\.tsx?$/.test(entry.name) && prefix) {
      routes.add(prefix);
    }
  }
};
walkRoutes(path.join(ROOT, "src/app"));

// --- Scan ------------------------------------------------------------------

const LINK_PATTERNS = [
  /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, // [text](/url "title")
  /href="([^"]+)"/g, // <Card href="/url">
];

function scanLines(lines: SourceLine[]): BrokenLink[] {
  const broken: BrokenLink[] = [];

  for (const { text, file, line } of lines) {
    const report = (url: string, reason: string) =>
      broken.push({ file, line, url, reason });

    for (const pattern of LINK_PATTERNS) {
      for (const match of text.matchAll(pattern)) {
        const url = match[1];
        // External, protocol-relative, anchor-only, or a JSX expression.
        if (/^(https?:|mailto:|tel:|\/\/|#|\{)/.test(url)) continue;

        const [targetRaw, fragment] = url.split("#");
        if (!targetRaw) continue;

        let target: string;
        if (targetRaw.startsWith("/")) {
          target = targetRaw;
        } else {
          const resolved = resolveRelative(file, targetRaw);
          if (resolved === null) continue;
          if ("error" in resolved) {
            report(url, resolved.error);
            continue;
          }
          target = resolved.url;
        }

        // Normalise a trailing slash before the shape checks, so `/a/index/`
        // and `/a.mdx/` get their precise diagnosis rather than falling
        // through to a generic "no such page".
        const normalized = target.replace(/\/+$/, "") || "/";

        if (normalized === "/docs" || normalized.startsWith("/docs/")) {
          report(
            url,
            "Uses a /docs prefix — Next's basePath prepends it automatically, so this resolves to /docs/docs/… and 404s.",
          );
          continue;
        }
        if (/\/index$/.test(normalized)) {
          report(
            url,
            "Ends with /index, which 404s — Fumadocs serves index.mdx at the directory URL.",
          );
          continue;
        }
        if (/\.mdx$/.test(normalized)) {
          report(url, "Has a .mdx extension, which 404s as a page link.");
          continue;
        }

        const page = pages.get(normalized);
        if (!page) {
          if (assets.has(normalized) || routes.has(normalized)) continue;
          report(url, "No such page, static asset, or route.");
          continue;
        }
        if (fragment && !page.anchors.has(fragment)) {
          report(
            url,
            `No heading on ${normalized} (${page.file}) produces the anchor #${fragment}.`,
          );
        }
      }
    }
  }
  return broken;
}

/**
 * A partial included by several pages is scanned once per including page, so
 * de-duplicate before reporting — otherwise one typo in a shared fragment
 * shows up three times.
 */
const seen = new Set<string>();
const allBroken: BrokenLink[] = [];
for (const lines of fileLines.values()) {
  for (const b of scanLines(lines)) {
    const key = `${b.file}:${b.line}:${b.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    allBroken.push(b);
  }
}
allBroken.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

/**
 * TypeDoc output is gitignored and produced by `generate-docs`, which
 * `prebuild` runs before this script. Run standalone on a fresh checkout,
 * every link into those pages looks broken — say so rather than let a hundred
 * spurious errors imply the docs are falling apart.
 */
const GENERATED = [
  "content/docs/reference/stack/api-reference/index.mdx",
  "content/docs/integrations/supabase/api-reference/index.mdx",
  "content/docs/integrations/drizzle/api-reference/index.mdx",
  "content/docs/integrations/prisma/api-reference/index.mdx",
];
const missing = GENERATED.filter((d) => !fs.existsSync(path.join(ROOT, d)));

console.log(
  `Checked ${fileLines.size} MDX file(s) across ${COLLECTIONS.map((c) => c.dir).join(" + ")} ` +
    `→ ${pages.size} page(s), ${assets.size} static asset(s), ${routes.size} route(s).`,
);

if (missing.length > 0) {
  console.log(
    `\n! Generated API pages are absent (${missing.join(", ")}), so links into\n` +
      "  them will be reported as missing. Run the matching `generate-docs:*`\n" +
      "  task first; `prebuild` and the links workflow do this automatically.",
  );
}

if (allBroken.length === 0) {
  console.log("✓ every internal link and anchor resolves.");
  process.exit(0);
}

console.log(`\n✗ ${allBroken.length} broken link(s):\n`);
for (const { file, line, url, reason } of allBroken) {
  console.log(`  ${file}:${line}`);
  console.log(`    Link: ${url}`);
  console.log(`    ${reason}\n`);
}
process.exit(1);
