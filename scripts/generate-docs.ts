#!/usr/bin/env tsx
/**
 * Main orchestrator for generating TypeDoc API reference documentation.
 *
 * Generates docs for @cipherstash/stack (which includes all integrations).
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
  repoUrl: "https://github.com/cipherstash/stack.git",
  tempDirName: ".tmp-stack",
  baseOutputDir: path.join(process.cwd(), "content/stack/reference/stack"),
  entryPoints: [
    "./packages/stack/src/encryption/index.ts",
    "./packages/stack/src/secrets/index.ts",
    "./packages/stack/src/schema/index.ts",
    "./packages/stack/src/drizzle/index.ts",
    "./packages/stack/src/dynamodb/index.ts",
    "./packages/stack/src/supabase/index.ts",
    "./packages/stack/src/identity/index.ts",
    "./packages/stack/src/types-public.ts",
    "./packages/stack/src/client.ts",
  ],
  tsconfigInclude: ["packages/stack/src/**/*"],
  tagFilter: (tag: string) =>
    tag.includes("@cipherstash/stack@") && !tag.includes("stack-"),
  referencePathSegment: "stack",
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
