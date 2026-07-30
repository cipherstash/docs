#!/usr/bin/env tsx
/**
 * Main orchestrator for generating TypeDoc API reference documentation.
 *
 * Generates docs for the core @cipherstash/stack package.
 *
 * Set PROTECT_WORKSPACE_PATH to point to a local protectjs checkout
 * for development (e.g., /Users/cj/Documents/CipherStash/Github/protectjs).
 * Otherwise, the script clones from GitHub.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { type DocsConfig, generateDocs } from "./lib/docs-generator.js";

const stackConfig: DocsConfig = {
  packageName: "@cipherstash/stack",
  projectName: "@cipherstash/stack",
  repoUrl: "https://github.com/cipherstash/stack.git",
  sourceRef: "main",
  tempDirName: ".tmp-stack",
  baseOutputDir: path.join(
    process.cwd(),
    "content/docs/reference/stack/api-reference",
  ),
  publicPath: "/reference/stack/api-reference",
  metaTitle: "API reference",
  versionedOutput: false,
  entryPointBasePath: "packages/stack/src",
  router: "module",
  flattenOutputFiles: true,
  generatedSources: {
    "packages/stack/src/package-exports.ts":
      '/** Exports available from the `@cipherstash/stack` package root.\n * @module Package exports\n */\nexport * from "./index.js"\n',
  },
  entryPoints: [
    "./packages/stack/src/package-exports.ts",
    "./packages/stack/src/encryption/index.ts",
    "./packages/stack/src/schema/index.ts",
    "./packages/stack/src/eql/v3/index.ts",
    "./packages/stack/src/encryption/v3.ts",
    "./packages/stack/src/dynamodb/index.ts",
    "./packages/stack/src/identity/index.ts",
    "./packages/stack/src/types-public.ts",
    "./packages/stack/src/errors/index.ts",
    "./packages/stack/src/adapter-kit.ts",
    "./packages/stack/src/wasm-inline.ts",
  ],
  tsconfigInclude: ["packages/stack/src/**/*"],
  tagFilter: () => false,
  referencePathSegment: "stack",
  frontmatterGlobals: {
    type: "reference",
    components: ["encryption", "eql"],
    audience: ["developer"],
  },
};

async function main() {
  console.log("=".repeat(60));
  console.log("CipherStash API Reference Documentation Generator");
  console.log("=".repeat(60));

  // Clean up any stale .tmp-* directories from previous runs
  const rootDir = process.cwd();
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith(".tmp-")) {
      console.log(`Removing stale temp directory: ${entry.name}`);
      await fs.rm(path.join(rootDir, entry.name), {
        recursive: true,
        force: true,
      });
    }
  }

  const localPath = process.env.PROTECT_WORKSPACE_PATH;
  if (localPath) {
    console.log(`\nUsing local workspace: ${localPath}`);
  } else {
    console.log("\nNo PROTECT_WORKSPACE_PATH set — will clone from GitHub");
  }

  await generateDocs(stackConfig);

  console.log(`\n${"=".repeat(60)}`);
  console.log("Documentation generated successfully!");
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
