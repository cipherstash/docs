#!/usr/bin/env tsx
/**
 * Generates EQL (Encrypt Query Language) API reference documentation.
 *
 * Downloads the docs tarball for the pinned EQL release and converts API.md to
 * an MDX page under content/stack/reference/eql/.
 *
 * The release is PINNED. `generate-eql-api-docs.ts` then runs a STRICT drift
 * check of the hand-written reference against this release's manifest, so an
 * unpinned "latest release" meant any upstream EQL publish could turn the docs
 * build red with no commit in this repo — which is exactly what
 * eql-3.0.0-alpha.4 did when it replaced `eql_v3.ore_cllw`.
 *
 * To upgrade: bump EQL_RELEASE_TAG, run `bun run build`, and fix whatever the
 * drift check reports. That makes an EQL upgrade a deliberate, reviewable
 * commit rather than an ambush on whoever has a PR open.
 *
 * `EQL_RELEASE_TAG=eql-3.0.0 bun run generate-docs:eql` overrides it for a
 * one-off check against a different release.
 */
import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import GithubSlugger from "github-slugger";

/**
 * The EQL release the docs are written against. EQL 3.0.0 is still in
 * prerelease and churning (alpha.3 and alpha.4 shipped a day apart), so this
 * tracks an alpha deliberately rather than by accident.
 */
const EQL_RELEASE_TAG = process.env.EQL_RELEASE_TAG ?? "eql-3.0.0";

const GITHUB_RELEASE_DOWNLOAD =
  "https://github.com/cipherstash/encrypt-query-language/releases/download";
const TEMP_DIR = ".tmp-eql";
const OUTPUT_DIR = path.join(process.cwd(), "content/stack/reference/eql");
// Where the machine-readable manifest is surfaced for the v2 API-reference
// generator (scripts/generate-eql-api-docs.ts). Gitignored; best-effort.
const RELEASE_MANIFEST = path.join(process.cwd(), ".eql-manifest.release.json");

/**
 * Check if a tarball URL exists (returns HTTP 200)
 */
function checkTarballExists(url: string): boolean {
  try {
    const result = execSync(
      `curl -sIL "${url}" | grep -E "^HTTP" | tail -n 1`,
      { encoding: "utf8" },
    );
    return result.includes("200");
  } catch {
    return false;
  }
}

/**
 * Resolve the docs tarball for the pinned release.
 */
async function getPinnedRelease(): Promise<{
  tag: string;
  tarballUrl: string;
}> {
  const tag = EQL_RELEASE_TAG;
  const tarballUrl = `${GITHUB_RELEASE_DOWNLOAD}/${tag}/eql-docs-${tag}.tar.gz`;

  console.log(`Using pinned EQL release: ${tag}`);
  if (!checkTarballExists(tarballUrl)) {
    throw new Error(
      `No docs tarball for pinned EQL release "${tag}".\n` +
        `  Expected: ${tarballUrl}\n` +
        "  Update EQL_RELEASE_TAG in scripts/generate-eql-docs.ts, or set the\n" +
        "  EQL_RELEASE_TAG environment variable to a release that ships one.",
    );
  }

  return { tag, tarballUrl };
}

/**
 * Download and extract the documentation tarball
 */
async function downloadAndExtractDocs(
  tarballUrl: string,
  tag: string,
): Promise<string> {
  const tempPath = path.join(process.cwd(), TEMP_DIR);
  await fs.mkdir(tempPath, { recursive: true });

  const tarballPath = path.join(tempPath, `eql-docs-${tag}.tar.gz`);

  console.log(`Downloading docs from ${tarballUrl}...`);
  execSync(`curl -sL -o "${tarballPath}" "${tarballUrl}"`, {
    stdio: "inherit",
  });

  console.log("Extracting tarball...");
  execSync(`tar -xzf "${tarballPath}" -C "${tempPath}"`, {
    stdio: "inherit",
  });

  return tempPath;
}

/**
 * Escape characters that MDX would otherwise interpret as JSX syntax.
 * Handles `{`, `}`, and stray `<` (e.g. SQL comparison operators).
 * Preserves content inside fenced code blocks and inline code spans.
 */
function escapeMdxSpecials(content: string): string {
  const lines = content.split("\n");
  const result: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (/^```/.test(line)) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      continue;
    }

    if (inCodeBlock) {
      result.push(line);
      continue;
    }

    const parts = line.split(/(`[^`]*`)/);
    const escaped = parts
      .map((part, i) => {
        if (i % 2 === 1) return part;
        return (
          part
            .replace(/\{/g, "\\{")
            .replace(/\}/g, "\\}")
            // Strip Doxygen's `<tt>` teletype tags. They're a lowercase-led
            // "tag" so the `<` rule below leaves them intact, but MDX requires
            // every tag to be balanced — and mangled SQL-comment source can
            // emit a stray, unclosed `<tt>` (e.g. eql-3.0.0-alpha.3's API.md),
            // which fails the whole build. MDX doesn't need the tag, so drop it.
            .replace(/<\/?tt\b[^>]*>/gi, "")
            // Escape `<` unless it begins a real JSX/HTML tag, a closing
            // tag, or an autolink (followed by a lowercase letter, `_`, `$`,
            // or `/`). Uppercase-led tokens like `<T>` are type placeholders
            // in the API reference, not JSX, so they must be escaped too.
            .replace(/<(?![a-z_$/])/g, "\\<")
        );
      })
      .join("");
    result.push(escaped);
  }

  return result.join("\n");
}

/**
 * Fix anchor links to match the heading IDs that Fumadocs generates via github-slugger.
 *
 * The upstream API.md uses a different slugification algorithm (likely replacing
 * underscores with hyphens), but Fumadocs uses github-slugger which preserves
 * underscores and has different rules for special characters. This function:
 *
 * 1. Scans all markdown headings in document order
 * 2. Computes the correct github-slugger ID for each (including deduplication suffixes)
 * 3. Replaces every in-page anchor link `](#old-slug)` with the correct slug
 */
function fixAnchorLinks(content: string): string {
  const slugger = new GithubSlugger();

  // Extract all headings and compute their github-slugger IDs in document order.
  // Headings may use inline code: ### `function_name(params)`
  const headingRegex = /^(#{1,6})\s+`?([^`\n]+?)`?\s*$/gm;
  const headingSlugMap = new Map<string, string>();

  // Track how many times we've seen each heading text to handle the
  // deduplication suffix that github-slugger adds (-1, -2, etc.)
  for (
    let match = headingRegex.exec(content);
    match !== null;
    match = headingRegex.exec(content)
  ) {
    const headingText = match[2];
    const slug = slugger.slug(headingText);
    // Map the heading text to its computed slug.
    // For duplicate headings, later occurrences get -1, -2, etc.
    // We store all of them, keyed by occurrence.
    headingSlugMap.set(`${headingText}::${headingSlugMap.size}`, slug);
  }

  // Build a lookup from heading text to an array of slugs (to handle duplicates)
  const textToSlugs = new Map<string, string[]>();
  for (const [key, slug] of headingSlugMap) {
    const text = key.replace(/::[\d]+$/, "");
    const existing = textToSlugs.get(text) ?? [];
    existing.push(slug);
    textToSlugs.set(text, existing);
  }

  // Track consumption index for each heading text (for duplicate handling)
  const consumedIndex = new Map<string, number>();

  // Replace anchor links in list items.
  // Pattern: [`link text`](#old-slug)
  // The link text matches the heading text, so we use it to look up the correct slug.
  return content.replace(
    /\[`([^`]+)`\]\(#([^)]+)\)/g,
    (_fullMatch, linkText: string, _oldSlug: string) => {
      const slugs = textToSlugs.get(linkText);
      if (!slugs) {
        // No matching heading found -- leave the link unchanged
        return _fullMatch;
      }
      const idx = consumedIndex.get(linkText) ?? 0;
      const correctSlug = slugs[idx] ?? slugs[slugs.length - 1];
      consumedIndex.set(linkText, idx + 1);
      return `[\`${linkText}\`](#${correctSlug})`;
    },
  );
}

/**
 * Convert the API.md content to an MDX page with Fumadocs frontmatter
 */
function convertToMdx(content: string, tag: string): string {
  // Strip any existing frontmatter
  const stripped = content.replace(/^---\n[\s\S]*?\n---\n/, "");

  const version = tag.replace(/^eql-/, "");

  const frontmatter = [
    "---",
    "title: EQL API Reference",
    "description: Complete API reference for the Encrypt Query Language (EQL) PostgreSQL extension.",
    "---",
    "",
  ].join("\n");

  const versionBadge = `> **Latest Version:** ${version}\n\n`;

  const withFixedAnchors = fixAnchorLinks(stripped.trim());
  return `${frontmatter}${versionBadge}${escapeMdxSpecials(withFixedAnchors)}\n`;
}

async function main() {
  console.log("=".repeat(60));
  console.log("EQL API Reference Documentation Generator");
  console.log("=".repeat(60));

  const { tag, tarballUrl } = await getPinnedRelease();

  const extractPath = await downloadAndExtractDocs(tarballUrl, tag);

  // Read the API.md file
  const apiMdPath = path.join(extractPath, "markdown", "API.md");
  console.log("Reading API.md...");
  const apiContent = await fs.readFile(apiMdPath, "utf8");

  // Convert to MDX with frontmatter
  const mdxContent = convertToMdx(apiContent, tag);

  // Write output
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const outputFile = path.join(OUTPUT_DIR, "index.mdx");
  console.log(`Writing to ${outputFile}...`);
  await fs.writeFile(outputFile, mdxContent, "utf8");

  // Generate meta.json for Fumadocs navigation
  const metaPath = path.join(OUTPUT_DIR, "meta.json");
  await fs.writeFile(
    metaPath,
    JSON.stringify({ pages: ["index"] }, null, 2),
    "utf8",
  );

  // Surface the machine-readable manifest for the v2 API-reference generator.
  // Only releases packaged with the manifest carry it; older ones don't, so
  // this is best-effort and the generator falls back to the committed sample.
  const manifestSrc = path.join(extractPath, "json", "eql-manifest.json");
  try {
    // Prerelease manifests report `"version": "DEV"`, which would surface as
    // "generated and validated against EQL DEV" in the banner on every
    // reference page. We know which release we pinned, so say so.
    const manifest = JSON.parse(await fs.readFile(manifestSrc, "utf8"));
    if (!manifest.version || manifest.version === "DEV") {
      manifest.version = tag.replace(/^eql-/, "");
    }
    await fs.writeFile(RELEASE_MANIFEST, JSON.stringify(manifest, null, 2));
    console.log(
      `✓ Extracted eql-manifest.json → ${path.basename(RELEASE_MANIFEST)} (version: ${manifest.version})`,
    );
  } catch {
    await fs.rm(RELEASE_MANIFEST, { force: true }); // clear any stale cache
    console.log(
      "• No eql-manifest.json in this release; API reference uses the sample.",
    );
  }

  // Clean up
  console.log("Cleaning up...");
  await fs.rm(extractPath, { recursive: true, force: true });

  console.log(`\n${"=".repeat(60)}`);
  console.log("EQL documentation generated successfully!");
  console.log(`  Version: ${tag}`);
  console.log(`  Output: ${outputFile}`);
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
