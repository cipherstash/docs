import fs from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "content/stack");

/**
 * Recursively collect all .mdx files in a directory.
 */
function collectMdxFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMdxFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Convert a file path to its corresponding URL.
 * content/stack/encryption/getting-started.mdx → /stack/encryption/getting-started
 * content/stack/reference/stack/latest/schema/index.mdx → /stack/reference/stack/latest/schema
 */
function filePathToUrl(filePath: string): string {
  let rel = path.relative(CONTENT_DIR, filePath);
  // Remove .mdx extension
  rel = rel.replace(/\.mdx$/, "");
  // Remove trailing /index
  rel = rel.replace(/\/index$/, "");
  return `/stack/${rel}`;
}

/**
 * Check if a URL has a /index suffix that would 404 at runtime.
 * Fumadocs serves index.mdx at the directory URL, so /path/index is not a valid route.
 */
function hasIndexSuffix(url: string): boolean {
  return /\/index$/.test(url);
}

/**
 * Check if a URL has a .mdx extension that should have been stripped.
 */
function hasMdxExtension(url: string): boolean {
  return /\.mdx$/.test(url);
}

/**
 * Build set of all valid internal URLs from MDX files.
 */
function buildValidUrls(mdxFiles: string[]): Set<string> {
  const urls = new Set<string>();
  for (const file of mdxFiles) {
    urls.add(filePathToUrl(file));
  }
  return urls;
}

interface BrokenLink {
  file: string;
  line: number;
  url: string;
  reason: string;
}

/**
 * Resolve a relative link to an absolute URL path using the file's actual location.
 * Does NOT strip /index or .mdx — the caller should detect and report those as errors.
 */
function resolveRelativeLink(link: string, currentFilePath: string): string {
  const currentDir = path.dirname(currentFilePath);
  const resolvedPath = path.join(currentDir, link);
  const rel = path.relative(CONTENT_DIR, resolvedPath);
  return `/stack/${rel}`;
}

/**
 * Scan an MDX file for broken internal links.
 */
function scanFile(filePath: string, validUrls: Set<string>): BrokenLink[] {
  const broken: BrokenLink[] = [];
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  // Match markdown links: [text](url)
  const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const match of line.matchAll(linkRegex)) {
      const url = match[2];

      // Skip external links
      if (url.startsWith("http://") || url.startsWith("https://")) continue;

      // Skip anchor-only links
      if (url.startsWith("#")) continue;

      // Skip mailto links
      if (url.startsWith("mailto:")) continue;

      // Strip anchor from URL for validation
      const urlWithoutAnchor = url.split("#")[0];

      // Check for wrong /docs/ prefix
      if (urlWithoutAnchor.startsWith("/docs/")) {
        broken.push({
          file: path.relative(process.cwd(), filePath),
          line: i + 1,
          url,
          reason:
            "Uses /docs/ prefix — Next.js basePath prepends this automatically. Use /stack/ instead.",
        });
        continue;
      }

      // Internal absolute links (start with /stack/)
      if (urlWithoutAnchor.startsWith("/stack/")) {
        if (hasIndexSuffix(urlWithoutAnchor)) {
          broken.push({
            file: path.relative(process.cwd(), filePath),
            line: i + 1,
            url,
            reason:
              "Link ends with /index which will 404. Remove /index — Fumadocs serves index.mdx at the directory URL.",
          });
        } else if (hasMdxExtension(urlWithoutAnchor)) {
          broken.push({
            file: path.relative(process.cwd(), filePath),
            line: i + 1,
            url,
            reason:
              "Link has .mdx extension which will 404. Remove the .mdx extension.",
          });
        } else if (!validUrls.has(urlWithoutAnchor)) {
          broken.push({
            file: path.relative(process.cwd(), filePath),
            line: i + 1,
            url,
            reason: "Page not found",
          });
        }
        continue;
      }

      // Skip other absolute links (e.g., /api/, external paths)
      if (urlWithoutAnchor.startsWith("/")) continue;

      // Relative links — resolve against current file's directory
      const resolved = resolveRelativeLink(urlWithoutAnchor, filePath);
      if (resolved.startsWith("/stack/")) {
        if (hasIndexSuffix(resolved)) {
          broken.push({
            file: path.relative(process.cwd(), filePath),
            line: i + 1,
            url,
            reason: `Link resolves to ${resolved} which ends with /index and will 404. Remove /index from the link target.`,
          });
        } else if (hasMdxExtension(resolved)) {
          broken.push({
            file: path.relative(process.cwd(), filePath),
            line: i + 1,
            url,
            reason: `Link resolves to ${resolved} which has .mdx extension and will 404. Remove the .mdx extension.`,
          });
        } else if (!validUrls.has(resolved)) {
          broken.push({
            file: path.relative(process.cwd(), filePath),
            line: i + 1,
            url,
            reason: `Page not found (resolved to ${resolved})`,
          });
        }
      }
    }
  }

  return broken;
}

// Main
const mdxFiles = collectMdxFiles(CONTENT_DIR);
console.log(`Found ${mdxFiles.length} MDX files in content/stack/`);

const validUrls = buildValidUrls(mdxFiles);
console.log(`Built ${validUrls.size} valid URLs\n`);

const allBroken: BrokenLink[] = [];

for (const file of mdxFiles) {
  const broken = scanFile(file, validUrls);
  allBroken.push(...broken);
}

if (allBroken.length === 0) {
  console.log("No broken links found!");
  process.exit(0);
} else {
  console.log(`Found ${allBroken.length} broken link(s):\n`);
  for (const { file, line, url, reason } of allBroken) {
    console.log(`  ${file}:${line}`);
    console.log(`    Link: ${url}`);
    console.log(`    ${reason}\n`);
  }
  process.exit(1);
}
