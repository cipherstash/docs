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
 *   - the link carries no `/docs/` prefix (Next's basePath prepends it), no
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
 * Blank out fenced code blocks, preserving line count so reported line numbers
 * still point at the right source line. Headings and links inside a code
 * sample are illustrative, not real.
 */
function blankCodeFences(content: string): string[] {
  let fence: string | null = null;
  return content.split("\n").map((line) => {
    const open = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fence) {
      if (open && open[1][0] === fence[0] && open[1].length >= fence.length)
        fence = null;
      return "";
    }
    if (open) {
      fence = open[1];
      return "";
    }
    return line;
  });
}

/**
 * Fumadocs' `<include cwd>path</include>` inlines a partial at build time, so
 * the partial's headings become anchors on the including page and its links
 * are rendered by it. One level deep — partials don't nest today.
 */
function inlineIncludes(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    const match = /<include\s+cwd\s*>([^<]+)<\/include>/.exec(line);
    if (!match) {
      out.push(line);
      continue;
    }
    const partial = path.join(ROOT, match[1].trim());
    if (!fs.existsSync(partial)) {
      out.push(line);
      continue;
    }
    // Keep the directive's own line so numbering above it is unchanged;
    // appended partial lines report against the end of the file, which is
    // close enough to find them.
    out.push(line, ...blankCodeFences(fs.readFileSync(partial, "utf8")));
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

function collectAnchors(lines: string[]): Set<string> {
  const slugger = new GithubSlugger();
  const anchors = new Set<string>();
  for (const line of lines) {
    const match = /^#{1,6}\s+(.+?)\s*$/.exec(line);
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

/** Resolve a relative link against the linking file's collection directory. */
function resolveRelative(file: string, link: string): string | null {
  for (const { dir, baseUrl } of COLLECTIONS) {
    const base = path.join(ROOT, dir);
    if (!file.startsWith(base + path.sep)) continue;
    const resolved = path.resolve(path.dirname(file), link);
    if (!resolved.startsWith(base)) return null;
    return `${baseUrl}/${path.relative(base, resolved)}`.replace(/\/+$/, "");
  }
  return null;
}

// --- Build the set of things a link may legitimately point at ---------------

const pages = new Map<string, Page>();
/** Per-file line arrays, so each file is read and de-fenced exactly once. */
const fileLines = new Map<string, string[]>();

for (const { dir, baseUrl } of COLLECTIONS) {
  for (const file of collectMdxFiles(path.join(ROOT, dir))) {
    const lines = inlineIncludes(
      blankCodeFences(fs.readFileSync(file, "utf8")),
    );
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

function scanFile(file: string, lines: string[]): BrokenLink[] {
  const broken: BrokenLink[] = [];
  const rel = path.relative(ROOT, file);
  const report = (line: number, url: string, reason: string) =>
    broken.push({ file: rel, line, url, reason });

  for (let i = 0; i < lines.length; i++) {
    for (const pattern of LINK_PATTERNS) {
      for (const match of lines[i].matchAll(pattern)) {
        const url = match[1];
        // External, protocol-relative, anchor-only, or a JSX expression.
        if (/^(https?:|mailto:|tel:|\/\/|#|\{)/.test(url)) continue;

        const [targetRaw, fragment] = url.split("#");
        if (!targetRaw) continue;

        const target = targetRaw.startsWith("/")
          ? targetRaw
          : resolveRelative(file, targetRaw);
        if (target === null) continue;

        if (target.startsWith("/docs/")) {
          report(
            i + 1,
            url,
            "Uses a /docs/ prefix — Next's basePath prepends it automatically, so this resolves to /docs/docs/… and 404s.",
          );
          continue;
        }
        if (/\/index$/.test(target)) {
          report(
            i + 1,
            url,
            "Ends with /index, which 404s — Fumadocs serves index.mdx at the directory URL.",
          );
          continue;
        }
        if (/\.mdx$/.test(target)) {
          report(
            i + 1,
            url,
            "Has a .mdx extension, which 404s as a page link.",
          );
          continue;
        }

        const normalized = target.replace(/\/+$/, "") || "/";
        const page = pages.get(normalized);

        if (!page) {
          if (assets.has(normalized) || routes.has(normalized)) continue;
          report(i + 1, url, "No such page, static asset, or route.");
          continue;
        }
        if (fragment && !page.anchors.has(fragment)) {
          report(
            i + 1,
            url,
            `No heading on ${normalized} (${page.file}) produces the anchor #${fragment}.`,
          );
        }
      }
    }
  }
  return broken;
}

const allBroken: BrokenLink[] = [];
for (const [file, lines] of fileLines) allBroken.push(...scanFile(file, lines));

/**
 * TypeDoc output is gitignored and produced by `generate-docs`, which
 * `prebuild` runs before this script. Run standalone on a fresh checkout,
 * every link into those pages looks broken — say so rather than let a hundred
 * spurious errors imply the docs are falling apart.
 */
const GENERATED = ["content/stack/reference/stack/latest"];
const missing = GENERATED.filter((d) => !fs.existsSync(path.join(ROOT, d)));

console.log(
  `Checked ${fileLines.size} MDX file(s) across ${COLLECTIONS.map((c) => c.dir).join(" + ")} ` +
    `→ ${pages.size} page(s), ${assets.size} static asset(s), ${routes.size} route(s).`,
);

if (missing.length > 0) {
  console.log(
    `\n! Generated API pages are absent (${missing.join(", ")}), so links into\n` +
      "  them will be reported as missing. Run `bun run generate-docs` first —\n" +
      "  `prebuild` does, which is why CI does not hit this.",
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
