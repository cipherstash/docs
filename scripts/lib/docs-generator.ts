import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Configuration for generating documentation for a specific package
 */
export interface DocsConfig {
  /** Name of the package (used in logs and output paths) */
  packageName: string;
  /** Git repository URL */
  repoUrl: string;
  /** Temporary directory name */
  tempDirName: string;
  /** Base output directory relative to project root */
  baseOutputDir: string;
  /** TypeDoc entry points array */
  entryPoints: string[];
  /** TypeDoc tsconfig include patterns */
  tsconfigInclude: string[];
  /** Function to filter tags for this package */
  tagFilter: (tag: string) => boolean;
  /** Reference URL path segment (e.g., 'stack' or 'drizzle') */
  referencePathSegment: string;
}

/**
 * Version information parsed from a tag
 */
export interface VersionInfo {
  major: number;
  minor: number;
  patch: number;
}

/**
 * Strips .mdx extensions from markdown links in all .mdx files
 */
export async function stripMdxExtensions(dir: string): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await stripMdxExtensions(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
      let content = await fs.readFile(fullPath, "utf8");
      content = content.replace(/\]\(([^)]+)\.mdx\)/g, "]($1)");
      await fs.writeFile(fullPath, content, "utf8");
    }
  }
}

/**
 * Generates a meta.json file for a directory based on its contents.
 * Lists subdirectories and .mdx files (without extension) in alphabetical order.
 */
export async function generateMetaJson(dir: string): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const pages: string[] = [];

  // Add index first if it exists
  const hasIndex = entries.some((e) => e.isFile() && e.name === "index.mdx");
  if (hasIndex) {
    pages.push("index");
  }

  // Add other entries
  for (const entry of entries) {
    if (entry.name === "meta.json" || entry.name === "index.mdx") continue;

    if (entry.isDirectory()) {
      pages.push(entry.name);
      // Recursively generate meta.json for subdirectories
      await generateMetaJson(path.join(dir, entry.name));
    } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
      pages.push(entry.name.replace(".mdx", ""));
    }
  }

  const metaPath = path.join(dir, "meta.json");
  await fs.writeFile(metaPath, JSON.stringify({ pages }, null, 2), "utf8");
}

/**
 * Parses a semver tag and returns major, minor, patch.
 * Handles both @scope/package@1.2.3 and v1.2.3 formats.
 */
export function parseVersion(tag: string): VersionInfo | null {
  const match = tag.match(/@[^@]+@(\d+)\.(\d+)\.(\d+)|^v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;

  const major = match[1] || match[4];
  const minor = match[2] || match[5];
  const patch = match[3] || match[6];

  return {
    major: Number.parseInt(major, 10),
    minor: Number.parseInt(minor, 10),
    patch: Number.parseInt(patch, 10),
  };
}

/**
 * Gets the latest tag for each of the last 3 major versions
 */
export function getVersionsToGenerate(
  tags: string[],
  tagFilter: (tag: string) => boolean,
): Array<{ tag: string; isLatest: boolean }> {
  const filteredTags = tags.filter(tagFilter);
  const versionMap = new Map<number, string>();

  for (const tag of filteredTags) {
    const version = parseVersion(tag);
    if (!version) continue;
    if (!versionMap.has(version.major)) {
      versionMap.set(version.major, tag);
    }
  }

  const majorVersions = Array.from(versionMap.keys())
    .sort((a, b) => b - a)
    .slice(0, 3);

  return majorVersions.map((major, index) => {
    const tag = versionMap.get(major);
    if (!tag) {
      throw new Error(`No tag found for major version ${major}`);
    }
    return { tag, isLatest: index === 0 };
  });
}

/**
 * Generate documentation for a specific tag
 */
export async function generateDocsForTag(
  tag: string,
  isLatest: boolean,
  workingDir: string,
  config: DocsConfig,
  localPath: string | undefined,
): Promise<{ dirName: string; versionString: string; isLatest: boolean }> {
  const version = parseVersion(tag);
  const versionString = version
    ? `v${version.major}.${version.minor}.${version.patch}`
    : tag;
  const dirName = isLatest ? "latest" : versionString;
  const outputDir = path.join(config.baseOutputDir, dirName);

  console.log(`\n${"=".repeat(60)}`);
  console.log(
    `Generating docs for ${dirName}${isLatest ? ` (${versionString})` : ""}`,
  );
  console.log("=".repeat(60));

  // Checkout the tag (skip if using local path)
  if (!localPath) {
    console.log(`Checking out ${tag}...`);
    execSync(`git checkout ${tag}`, { cwd: workingDir, stdio: "inherit" });

    console.log("Cleaning node_modules...");
    execSync("rm -rf node_modules", { cwd: workingDir, stdio: "inherit" });

    console.log("Installing dependencies...");
    execSync("pnpm install --frozen-lockfile", {
      cwd: workingDir,
      stdio: "inherit",
    });
  } else {
    console.log("Using local copy - skipping checkout");
  }

  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });

  // Create a custom tsconfig for TypeDoc
  const typedocTsConfig = {
    extends: "./tsconfig.json",
    include: config.tsconfigInclude,
    exclude: ["node_modules", "examples", "dist", "__tests__"],
    compilerOptions: {
      paths: {
        "@/*": ["./packages/stack/src/*"],
        "@cipherstash/schema": ["./packages/schema/src/index.ts"],
        "@cipherstash/schema/*": ["./packages/schema/src/*"],
      },
    },
  };

  const tsConfigPath = path.join(workingDir, "typedoc.tsconfig.json");
  await fs.writeFile(tsConfigPath, JSON.stringify(typedocTsConfig, null, 2));

  // Copy plugin to temp directory
  const pluginSource = path.join(
    process.cwd(),
    "scripts/plugins/fumadocs-frontmatter.mjs",
  );
  const pluginDest = path.join(workingDir, "fumadocs-frontmatter.mjs");
  await fs.copyFile(pluginSource, pluginDest);

  // Create TypeDoc configuration
  const typedocConfig = {
    entryPoints: config.entryPoints,
    tsconfig: "./typedoc.tsconfig.json",
    plugin: [
      "typedoc-plugin-markdown",
      "typedoc-plugin-frontmatter",
      "./fumadocs-frontmatter.mjs",
    ],
    out: outputDir,
    readme: "none",
    frontmatterGlobals: {
      packageVersion: versionString,
    },
    frontmatterCommentTags: ["author", "description"],
    githubPages: false,
    hideGenerator: true,
    excludePrivate: true,
    excludeProtected: true,
    excludeInternal: true,
    useCodeBlocks: true,
    expandObjects: true,
    hideBreadcrumbs: true,
    hidePageHeader: false,
    hidePageTitle: false,
    parametersFormat: "list",
    expandParameters: false,
    useHTMLEncodedBrackets: true,
    sanitizeComments: true,
    fileExtension: ".mdx",
    entryFileName: "index",
    skipErrorChecking: false,
    sort: ["source-order"],
    kindSortOrder: [
      "Interface",
      "Function",
      "Class",
      "TypeAlias",
      "Variable",
      "Enum",
    ],
    publicPath: `/stack/reference/${config.referencePathSegment}/${dirName}/`,
  };

  const configPath = path.join(workingDir, "typedoc.json");
  await fs.writeFile(configPath, JSON.stringify(typedocConfig, null, 2));

  // Generate TypeDoc documentation
  console.log("Generating TypeDoc markdown...");
  execSync("npx typedoc --options typedoc.json", {
    cwd: workingDir,
    stdio: "inherit",
  });

  // Strip .mdx extensions from internal links
  console.log("Removing .mdx extensions from links...");
  await stripMdxExtensions(outputDir);

  // Generate meta.json files for Fumadocs navigation
  console.log("Generating meta.json files...");
  await generateMetaJson(outputDir);

  console.log(`Docs for ${dirName} generated successfully!`);
  console.log(`Output directory: ${outputDir}`);

  return { dirName, versionString, isLatest };
}

/**
 * Main documentation generation workflow
 */
export async function generateDocs(config: DocsConfig): Promise<void> {
  console.log(`Generating ${config.packageName} reference documentation...\n`);

  try {
    const localPath = process.env.PROTECT_WORKSPACE_PATH;
    const tempDir = path.join(process.cwd(), config.tempDirName);
    let workingDir: string;
    let allTags: string[];

    // Clean up temp directory if it exists
    await fs.rm(tempDir, { recursive: true, force: true, maxRetries: 3 });

    if (localPath) {
      console.log(
        `Using local ${config.packageName} repository: ${localPath}\n`,
      );

      // Copy local repo to temp directory
      console.log("Copying local repository to temp directory...");
      await fs.cp(localPath, tempDir, {
        recursive: true,
        filter: (src) => !src.includes("node_modules"),
      });
      workingDir = tempDir;

      console.log("Installing dependencies...");
      execSync("pnpm install --frozen-lockfile", {
        cwd: workingDir,
        stdio: "inherit",
      });

      allTags = ["local-dev"];
      console.log("\nLocal mode: Generating docs for current state\n");
    } else {
      console.log(`Cloning ${config.packageName} repository...`);
      execSync(`git clone ${config.repoUrl} ${tempDir}`, {
        stdio: "inherit",
      });
      workingDir = tempDir;

      console.log("Fetching all tags...");
      execSync("git fetch --tags", { cwd: workingDir, stdio: "inherit" });

      allTags = execSync("git tag --sort=-v:refname", {
        cwd: workingDir,
        encoding: "utf8",
      })
        .trim()
        .split("\n");

      if (allTags.length === 0 || allTags[0] === "") {
        throw new Error(`No tags found in ${config.packageName} repository`);
      }

      console.log(`Found ${allTags.length} tags`);
    }

    // Determine which versions to generate
    const versionsToGenerate = localPath
      ? [{ tag: "local-dev", isLatest: true }]
      : getVersionsToGenerate(allTags, config.tagFilter);

    if (!localPath && versionsToGenerate.length === 0) {
      throw new Error(
        `No ${config.packageName} package tags found in repository`,
      );
    }

    console.log("\nGenerating docs for:");
    for (const { tag, isLatest } of versionsToGenerate) {
      console.log(`  - ${tag}${isLatest ? " (latest)" : ""}`);
    }

    // Clean existing generated output (preserve hand-authored files)
    for (const { tag, isLatest } of versionsToGenerate) {
      const version = parseVersion(tag);
      const dirName = isLatest
        ? "latest"
        : version
          ? `v${version.major}.${version.minor}.${version.patch}`
          : tag;
      const versionDir = path.join(config.baseOutputDir, dirName);
      await fs.rm(versionDir, { recursive: true, force: true });
    }

    // Generate docs for each version
    const generatedVersions = [];
    for (const { tag, isLatest } of versionsToGenerate) {
      const versionInfo = await generateDocsForTag(
        tag,
        isLatest,
        workingDir,
        config,
        localPath,
      );
      generatedVersions.push(versionInfo);
    }

    // Generate a meta.json for the package directory listing versions
    const packageMetaPath = path.join(config.baseOutputDir, "meta.json");
    const packageMeta = {
      pages: generatedVersions.map(({ dirName }) => dirName),
    };
    await fs.writeFile(
      packageMetaPath,
      JSON.stringify(packageMeta, null, 2),
      "utf8",
    );

    // Clean up temp directory (only if not using local path)
    if (!localPath) {
      console.log("\nCleaning up...");
      await fs.rm(tempDir, { recursive: true, force: true, maxRetries: 3 });
    }

    console.log(
      `\nAll ${config.packageName} documentation generated successfully!`,
    );
    console.log(`Base output directory: ${config.baseOutputDir}`);
  } catch (error) {
    console.error(
      `\nError generating ${config.packageName} documentation:`,
      error,
    );
    const localPath = process.env.PROTECT_WORKSPACE_PATH;
    if (!localPath) {
      const tempDir = path.join(process.cwd(), config.tempDirName);
      await fs.rm(tempDir, { recursive: true, force: true, maxRetries: 3 });
    }
    throw error;
  }
}
