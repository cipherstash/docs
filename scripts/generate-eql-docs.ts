#!/usr/bin/env tsx
/**
 * Generates EQL (Encrypt Query Language) API reference documentation.
 *
 * Fetches the latest release from the encrypt-query-language repository,
 * downloads the docs tarball, and converts API.md to an MDX page under
 * content/stack/reference/eql/.
 */
import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import GithubSlugger from "github-slugger";

const GITHUB_API_URL =
  "https://api.github.com/repos/cipherstash/encrypt-query-language/releases";
const TEMP_DIR = ".tmp-eql";
const OUTPUT_DIR = path.join(process.cwd(), "content/stack/reference/eql");

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
 * Get the latest release that has a docs tarball available
 */
async function getLatestRelease(): Promise<{
  tag: string;
  tarballUrl: string;
}> {
  console.log("Fetching releases from GitHub...");
  const response = execSync(`curl -sL ${GITHUB_API_URL}`, {
    encoding: "utf8",
  });

  const releases = JSON.parse(response);

  if (!Array.isArray(releases) || releases.length === 0) {
    throw new Error("No releases found in GitHub API response");
  }

  for (const release of releases) {
    const tag = release.tag_name;
    if (!tag || !tag.startsWith("eql-")) continue;

    const tarballUrl = `https://github.com/cipherstash/encrypt-query-language/releases/download/${tag}/eql-docs-${tag}.tar.gz`;

    console.log(`Checking ${tag}...`);
    if (checkTarballExists(tarballUrl)) {
      console.log(`Found docs tarball for ${tag}`);
      return { tag, tarballUrl };
    }
  }

  throw new Error("No release with documentation tarball found");
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
 * Escape curly braces in markdown content so MDX doesn't interpret them as JSX.
 * Preserves braces inside fenced code blocks and inline code spans.
 */
function escapeBraces(content: string): string {
  const lines = content.split("\n");
  const result: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    // Track fenced code blocks
    if (/^```/.test(line)) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      continue;
    }

    if (inCodeBlock) {
      result.push(line);
      continue;
    }

    // Outside code blocks: escape braces that aren't inside inline code
    // Split by inline code spans, escape only non-code parts
    const parts = line.split(/(`[^`]*`)/);
    const escaped = parts
      .map((part, i) => {
        // Odd indices are inline code spans — leave them alone
        if (i % 2 === 1) return part;
        return part.replace(/\{/g, "\\{").replace(/\}/g, "\\}");
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
  return `${frontmatter}${versionBadge}${escapeBraces(withFixedAnchors)}\n`;
}

async function main() {
  console.log("=".repeat(60));
  console.log("EQL API Reference Documentation Generator");
  console.log("=".repeat(60));

  const { tag, tarballUrl } = await getLatestRelease();
  console.log(`Latest release: ${tag}`);

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
