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
  /** Generate from a branch or commit instead of selecting a release tag. */
  sourceRef?: string;
  /** Public route before the generated version directory. */
  publicPath?: string;
  /** Navigation title written to the package-level meta.json. */
  metaTitle?: string;
  /** TypeDoc project name. */
  projectName?: string;
  /** Additional frontmatter added to every generated page. */
  frontmatterGlobals?: Record<string, unknown>;
  /** Generate directly into baseOutputDir instead of a latest/version folder. */
  versionedOutput?: boolean;
  /** Base path TypeDoc uses to name entry-point modules. */
  entryPointBasePath?: string;
  /** TypeDoc Markdown output router. */
  router?: "member" | "module";
  /** Write generated module pages into one directory. */
  flattenOutputFiles?: boolean;
  /** Promote one TypeDoc entry module into the generated root page. */
  entryModule?: string;
  /** Synthetic source entry points written into the temporary checkout. */
  generatedSources?: Record<string, string>;
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
 * Keep inline code spans on one physical line.
 *
 * TSDoc comments are commonly wrapped at a fixed width, including in the
 * middle of a backtick span. Markdown permits that, but MDX can reinterpret a
 * `{ ... }` on the continuation line as an expression inside its surrounding
 * list or blockquote container. Fenced code blocks are deliberately excluded.
 */
function collapseMultilineInlineCode(content: string): string {
  // TypeDoc's frontmatter plugin can truncate a summary midway through an
  // inline-code span. Never pair that unmatched backtick with one in the MDX
  // body: frontmatter is YAML and does not need Markdown normalization.
  const frontmatter = content.match(/^---\n[\s\S]*?\n---\n?/)?.[0] ?? "";
  const lines = content.slice(frontmatter.length).split("\n");
  const output: string[] = [];
  let prose: string[] = [];
  let fence: { character: string; length: number } | undefined;

  const collapseProse = () => {
    if (prose.length === 0) return;
    const block = prose.join("\n");
    let result = "";
    let cursor = 0;

    while (cursor < block.length) {
      const start = block.indexOf("`", cursor);
      if (start === -1) {
        result += block.slice(cursor);
        break;
      }

      let openingLength = 1;
      while (block[start + openingLength] === "`") openingLength += 1;
      result += block.slice(cursor, start + openingLength);
      cursor = start + openingLength;

      let closing = cursor;
      while (closing < block.length) {
        closing = block.indexOf("`", closing);
        if (closing === -1) break;
        let closingLength = 1;
        while (block[closing + closingLength] === "`") closingLength += 1;
        if (closingLength === openingLength) break;
        closing += closingLength;
      }

      if (closing === -1) {
        result += block.slice(cursor);
        cursor = block.length;
        break;
      }

      const body = block.slice(cursor, closing);
      result += body.includes("\n")
        ? body.replace(/[ \t]*\n[ \t]*/g, " ")
        : body;
      result += "`".repeat(openingLength);
      cursor = closing + openingLength;
    }

    output.push(...result.split("\n"));
    prose = [];
  };

  for (const line of lines) {
    const match = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    const marker = match?.[1];
    if (!fence && marker) {
      collapseProse();
      output.push(line);
      fence = { character: marker[0] ?? "", length: marker.length };
    } else if (fence) {
      output.push(line);
      if (
        marker?.[0] === fence.character &&
        marker.length >= fence.length &&
        match?.[2]?.trim() === ""
      ) {
        fence = undefined;
      }
    } else {
      prose.push(line);
    }
  }
  collapseProse();

  return `${frontmatter}${output.join("\n")}`;
}

/**
 * Cleans up markdown links in generated .mdx files:
 * 1. Strips .mdx extensions from link targets
 * 2. Fixes /docs/reference/ prefix to /stack/reference/
 * 3. Removes /index suffix from link targets (index pages are served at the directory URL)
 * 4. Strips temp directory prefix from source link text
 *
 * TypeDoc source comments may contain links with /docs/reference/ prefix,
 * but Next.js basePath already prepends /docs, so these need to be /stack/reference/.
 *
 * TypeDoc also emits "Defined in:" source links where the link text includes the
 * temp directory name (e.g., `.tmp-stack/packages/...`). We strip that prefix so
 * the displayed path shows the clean repository-relative path.
 */
export async function stripMdxExtensions(dir: string): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await stripMdxExtensions(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
      let content = await fs.readFile(fullPath, "utf8");
      content = collapseMultilineInlineCode(content);
      content = content.replace(/\]\(([^)#]+)\.mdx([#)])/g, "]($1$2");
      content = content.replace(
        /\]\(\/docs\/reference\//g,
        "](/stack/reference/",
      );
      // Strip /index suffix from link targets.
      // TypeDoc generates links to index pages (e.g., ../index or /stack/.../index)
      // but Fumadocs serves index.mdx at the directory URL without /index.
      content = content.replace(/\]\(([^)#]*)\/index([#)])/g, "]($1$2");
      // A flattened module sits beside the root index and links back to it as
      // `(index)`, without a preceding slash for the rule above to match.
      content = content.replace(/\]\(index([#)])/g, "](./$1");
      // Strip temp directory prefix from source link text (e.g., .tmp-stack/)
      // Matches: [.tmp-stack/packages/...](url) → [packages/...](url)
      content = content.replace(/\[\.tmp-[^/]+\//g, "[");
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
  await fs.writeFile(metaPath, serializeMetaJson({ pages }), "utf8");
}

/** Keep generated metadata aligned with Biome's compact single-item arrays. */
function serializeMetaJson(meta: { title?: string; pages: string[] }): string {
  const json = JSON.stringify(meta, null, 2).replace(
    /"pages": \[\n {4}"([^"]+)"\n {2}\]/,
    '"pages": ["$1"]',
  );
  return `${json}\n`;
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

  // Only the latest major. The module layout diverged across majors — Stack 1.0
  // moved the Drizzle/Supabase adapters to their own packages and dropped
  // secrets — so a single `entryPoints` config (which must match the layout it
  // documents) can only correctly generate one line. The launch documents 1.0;
  // older-major reference lives on the previous docs site.
  const majorVersions = Array.from(versionMap.keys())
    .sort((a, b) => b - a)
    .slice(0, 1);

  return majorVersions.map((major, index) => {
    const tag = versionMap.get(major);
    if (!tag) {
      throw new Error(`No tag found for major version ${major}`);
    }
    return { tag, isLatest: index === 0 };
  });
}

/**
 * TypeScript `paths` that resolve a workspace package to its SOURCE.
 *
 * An adapter package (`stack-supabase`) imports its sibling by package name —
 * `@cipherstash/stack`, `@cipherstash/stack/schema`, `.../adapter-kit` — which
 * resolves through that package's `exports` map to `./dist/*`. The clone is
 * never built, so there is no `dist` and every such import is TS2307. TypeDoc
 * then documents the adapter with all its cross-package types missing.
 *
 * Derive the mapping from the sibling's own `exports` map rather than hardcoding
 * it: rewrite each subpath's `./dist/x.js` target to `./packages/<pkg>/src/x.ts`.
 * A hand-written list would silently rot the next time Stack adds a subpath, and
 * the failure mode is exactly the one this is fixing — a missing type quietly
 * becoming `any` in the published reference.
 */
async function workspaceSourcePaths(
  workingDir: string,
  packageName: string,
): Promise<Record<string, string[]>> {
  const dir = packageName.split("/").pop();
  const manifest = path.join(workingDir, "packages", dir ?? "", "package.json");

  let exportsMap: Record<string, unknown>;
  try {
    const pkg = JSON.parse(await fs.readFile(manifest, "utf8"));
    exportsMap = pkg.exports ?? {};
  } catch {
    // The layout moved. Better to emit nothing and let TS2307 name the missing
    // module than to invent paths that point at files which do not exist.
    console.warn(`  ! no exports map at ${manifest}; skipping source paths`);
    return {};
  }

  const paths: Record<string, string[]> = {};
  for (const [subpath, target] of Object.entries(exportsMap)) {
    if (subpath.endsWith("package.json")) continue;
    // Any condition will do — every branch points at the same module, and only
    // the path shape matters here.
    const dist = JSON.stringify(target).match(/\.\/dist\/[^"]+\.js/)?.[0];
    if (!dist) continue;

    const stem = dist.replace(/^\.\/dist\//, "").replace(/\.js$/, "");
    const specifier =
      subpath === "." ? packageName : `${packageName}/${subpath.slice(2)}`;
    paths[specifier] = [`./packages/${dir}/src/${stem}.ts`];
  }
  return paths;
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
  const dirName =
    config.versionedOutput === false ? "" : isLatest ? "latest" : versionString;
  const outputDir = dirName
    ? path.join(config.baseOutputDir, dirName)
    : config.baseOutputDir;
  const displayDirName = dirName || "unversioned API reference";

  console.log(`\n${"=".repeat(60)}`);
  console.log(
    `Generating docs for ${displayDirName}${isLatest ? ` (${versionString})` : ""}`,
  );
  console.log("=".repeat(60));

  // Checkout the tag (skip if using local path)
  if (!localPath) {
    // A prior tag's `bun install` rewrites the tracked package.json, which would
    // block switching tags. Discard any working-tree changes first so the
    // checkout is always clean (harmless on the first/only tag).
    console.log(`Checking out ${tag}...`);
    execSync("git checkout -- .", { cwd: workingDir, stdio: "inherit" });
    execSync(`git checkout ${tag}`, { cwd: workingDir, stdio: "inherit" });

    console.log("Cleaning node_modules...");
    execSync("rm -rf node_modules", { cwd: workingDir, stdio: "inherit" });

    console.log("Installing dependencies...");
    execSync("bun install", {
      cwd: workingDir,
      stdio: "inherit",
    });
  } else {
    console.log("Using local copy - skipping checkout");
  }

  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });

  // A package root named `index.ts` collides with TypeDoc's own `index.mdx`.
  // Callers can add a synthetic, clearly named re-export module so the root
  // package surface is documented without changing the source repository.
  for (const [relativePath, source] of Object.entries(
    config.generatedSources ?? {},
  )) {
    const generatedPath = path.join(workingDir, relativePath);
    await fs.mkdir(path.dirname(generatedPath), { recursive: true });
    await fs.writeFile(generatedPath, source, "utf8");
  }

  // Create a custom tsconfig for TypeDoc
  const typedocTsConfig = {
    extends: "./tsconfig.json",
    include: config.tsconfigInclude,
    exclude: ["node_modules", "examples", "dist", "__tests__"],
    compilerOptions: {
      // The stack repo's ROOT tsconfig (which this extends) sets
      // `moduleResolution: "bundler"` but no `customConditions`;
      // `packages/stack/tsconfig.json` — the config the stack team actually
      // builds with — adds `customConditions: ["node"]`. That matters here:
      // @cipherstash/protect-ffi's `exports` map routes the `node` condition to
      // `lib/index.d.cts` (the real type surface) and everything else to
      // `default: ./dist/wasm/protect_ffi.js`, which ships NO `types`. Without
      // the condition, TypeScript falls through to the sibling
      // `dist/wasm/protect_ffi.d.ts` — raw wasm-bindgen output — and every
      // hand-written type resolves to nothing ("has no exported member
      // 'ProtectError'. Did you mean 'encryptQuery'?").
      customConditions: ["node"],
      paths: {
        "@/*": ["./packages/stack/src/*"],
        "@cipherstash/schema": ["./packages/schema/src/index.ts"],
        "@cipherstash/schema/*": ["./packages/schema/src/*"],
        ...(await workspaceSourcePaths(workingDir, "@cipherstash/stack")),
      },
    },
  };

  const tsConfigPath = path.join(workingDir, "typedoc.tsconfig.json");
  await fs.writeFile(tsConfigPath, JSON.stringify(typedocTsConfig, null, 2));

  // Copy plugins to temp directory
  for (const plugin of [
    "fumadocs-frontmatter.mjs",
    "strip-inherited.mjs",
    "source-link-labels.mjs",
  ]) {
    await fs.copyFile(
      path.join(process.cwd(), "scripts/plugins", plugin),
      path.join(workingDir, plugin),
    );
  }

  // Create TypeDoc configuration
  const typedocConfig = {
    name: config.projectName,
    entryPoints: config.entryPoints,
    tsconfig: "./typedoc.tsconfig.json",
    basePath: config.entryPointBasePath
      ? path.join(workingDir, config.entryPointBasePath)
      : workingDir,
    plugin: [
      "typedoc-plugin-markdown",
      "typedoc-plugin-frontmatter",
      "./fumadocs-frontmatter.mjs",
      "./strip-inherited.mjs",
      "./source-link-labels.mjs",
    ],
    out: outputDir,
    readme: "none",
    frontmatterGlobals: {
      packageVersion: versionString,
      ...config.frontmatterGlobals,
    },
    frontmatterCommentTags: ["author", "description"],
    githubPages: false,
    hideGenerator: true,
    excludePrivate: true,
    excludeProtected: true,
    excludeInternal: true,
    // Map external-package symbols referenced in {@link} tags to their upstream
    // docs so the links resolve instead of warning. `Result` comes from
    // @byteslice/result, which is not part of the generated reference.
    externalSymbolLinkMappings: {
      "@byteslice/result": {
        Result: "https://www.npmjs.com/package/@byteslice/result",
      },
    },
    // NOTE: `intentionallyNotExported` only *silences* the "referenced by ...
    // but not included" warning — it does NOT add the type to the reference.
    // So it is the right tool only for genuinely-internal types. Anything a
    // consumer would want to know about should instead be re-exported from a
    // documented entry point (the way the base operation classes are surfaced
    // via the `export { ... }` block in stack's encryption/index.ts, per
    // cipherstash/stack#502) so it renders as a real reference page — and then
    // removed from this list. The array is split accordingly.
    intentionallyNotExported: [
      // --- Genuinely internal: keep suppressed indefinitely. ---
      // Helper/brand types, zod schema *values* (the runtime validators, not the
      // inferred option types), and decrypt-result union members. QueryTermBase
      // and TableDefinition are marked "excluded"/"used internally" in the stack
      // source itself, so they belong here too.
      "Brand",
      "AtLeastOneCsTable",
      "QueryTermBase",
      "TableDefinition",
      "DecryptionSuccess",
      "DecryptionError",
      "tokenFilterSchema",
      "matchIndexOptsSchema",
      "steVecIndexOptsSchema",
      "uniqueIndexOptsSchema",
      "oreIndexOptsSchema",
      "columnSchema",
      "DrizzleEncryptedSchema",

      // --- Public API surface, suppressed only as a STOPGAP. ---
      // These are useful to document but are not yet reachable from a documented
      // entry point. The fix is stack-side: re-export them (the *WithLockContext
      // operation classes + AuditConfig/AuditData from encryption/index.ts,
      // DynamoDBOperationOptions from dynamodb/index.ts, FilterOp from
      // supabase/index.ts) the same way cipherstash/stack#502 surfaced the base
      // operation classes. Once a stack release exports them, REMOVE them here so
      // they become real reference pages. (#502 covered the base classes only.)
      "AuditConfig",
      "AuditData",
      "DynamoDBOperationOptions",
      "FilterOp",
      "EncryptOperationWithLockContext",
      "EncryptQueryOperationWithLockContext",
      "BatchEncryptQueryOperationWithLockContext",
      "DecryptOperationWithLockContext",
      "EncryptModelOperationWithLockContext",
      "DecryptModelOperationWithLockContext",
      "BulkEncryptOperationWithLockContext",
      "BulkDecryptOperationWithLockContext",
      "BulkEncryptModelsOperationWithLockContext",
      "BulkDecryptModelsOperationWithLockContext",
    ],
    useCodeBlocks: true,
    expandObjects: true,
    hideBreadcrumbs: true,
    hidePageHeader: false,
    // The page template emits `# <symbol>` as the body's first line, and
    // Fumadocs renders `page.data.title` as an <h1> above it — the same string
    // twice, so every generated page shipped two H1s. Suppressing TypeDoc's
    // copy leaves Fumadocs' as the only one; the text is identical, so nothing
    // changes visually.
    //
    // This is `hidePageTitle`, not the `hidePageHeader` above it: the heading
    // in typedoc-plugin-markdown's `reflection.template.js` is gated on the
    // former. `hidePageHeader` controls the breadcrumb/navigation block.
    hidePageTitle: true,
    parametersFormat: "list",
    expandParameters: false,
    useHTMLEncodedBrackets: true,
    sanitizeComments: true,
    fileExtension: ".mdx",
    entryFileName: "index",
    router: config.router,
    flattenOutputFiles: config.flattenOutputFiles,
    entryModule: config.entryModule,
    // Type errors fail the build, deliberately. This was `true` to tolerate
    // "cross-package type references unresolved even though the source is
    // correct" — but that diagnosis was wrong, and tolerating it was not free:
    // an unresolved import does not just warn, it makes TypeDoc emit `any`.
    // The cause was the missing `customConditions` above, and with that fixed
    // the whole surface typechecks cleanly. Leaving this off means the next
    // resolution break surfaces as a failed build instead of a reference page
    // that quietly documents `any`.
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
    publicPath: `${(config.publicPath ?? `/stack/reference/${config.referencePathSegment}`).replace(/\/$/, "")}${dirName ? `/${dirName}` : ""}/`,
  };

  const configPath = path.join(workingDir, "typedoc.json");
  await fs.writeFile(configPath, JSON.stringify(typedocConfig, null, 2));

  // Generate TypeDoc documentation. Pass the package name through so the
  // frontmatter plugin can build package-qualified SEO titles/descriptions.
  console.log("Generating TypeDoc markdown...");
  execSync("npx typedoc --options typedoc.json", {
    cwd: workingDir,
    stdio: "inherit",
    env: { ...process.env, DOCS_PACKAGE_NAME: config.packageName },
  });

  // Strip .mdx extensions from internal links
  console.log("Removing .mdx extensions from links...");
  await stripMdxExtensions(outputDir);

  // Generate meta.json files for Fumadocs navigation
  console.log("Generating meta.json files...");
  await generateMetaJson(outputDir);

  console.log(`Docs for ${displayDirName} generated successfully!`);
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
      execSync("bun install", {
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

      if (config.sourceRef) {
        allTags = [config.sourceRef];
        console.log(`Using source ref ${config.sourceRef}`);
      } else {
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
    }

    // Determine which versions to generate
    const versionsToGenerate = localPath
      ? [{ tag: "local-dev", isLatest: true }]
      : config.sourceRef
        ? [{ tag: config.sourceRef, isLatest: true }]
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
      const dirName =
        config.versionedOutput === false
          ? ""
          : isLatest
            ? "latest"
            : version
              ? `v${version.major}.${version.minor}.${version.patch}`
              : tag;
      const versionDir = dirName
        ? path.join(config.baseOutputDir, dirName)
        : config.baseOutputDir;
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

    // Generate package-level navigation. An unversioned reference already has
    // a complete meta.json from generateMetaJson; preserve its page list.
    const packageMetaPath = path.join(config.baseOutputDir, "meta.json");
    const packageMeta =
      config.versionedOutput === false
        ? {
            ...(config.metaTitle ? { title: config.metaTitle } : {}),
            ...JSON.parse(await fs.readFile(packageMetaPath, "utf8")),
          }
        : {
            ...(config.metaTitle ? { title: config.metaTitle } : {}),
            pages: generatedVersions.map(({ dirName }) => dirName),
          };
    await fs.writeFile(packageMetaPath, serializeMetaJson(packageMeta), "utf8");

    // Clean up temp directory
    console.log("\nCleaning up...");
    await fs.rm(tempDir, { recursive: true, force: true, maxRetries: 3 });

    console.log(
      `\nAll ${config.packageName} documentation generated successfully!`,
    );
    console.log(`Base output directory: ${config.baseOutputDir}`);
  } catch (error) {
    console.error(
      `\nError generating ${config.packageName} documentation:`,
      error,
    );
    const tempDir = path.join(process.cwd(), config.tempDirName);
    await fs.rm(tempDir, { recursive: true, force: true, maxRetries: 3 });
    throw error;
  }
}
