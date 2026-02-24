#!/usr/bin/env tsx
/**
 * Main orchestrator for generating TypeDoc API reference documentation.
 *
 * Generates docs for:
 * - @cipherstash/stack
 * - @cipherstash/drizzle
 *
 * Set PROTECT_WORKSPACE_PATH to point to a local protectjs checkout
 * for development (e.g., /Users/cj/Documents/CipherStash/Github/protectjs).
 * Otherwise, the script clones from GitHub.
 */
import path from "node:path";
import { type DocsConfig, generateDocs } from "./lib/docs-generator.js";

const stackConfig: DocsConfig = {
  packageName: "@cipherstash/stack",
  repoUrl: "https://github.com/cipherstash/protectjs.git",
  tempDirName: ".tmp-stack",
  baseOutputDir: path.join(process.cwd(), "content/docs/reference/stack"),
  entryPoints: ["./packages/stack/src/index.ts"],
  tsconfigInclude: ["packages/stack/src/**/*"],
  tagFilter: (tag: string) =>
    tag.includes("@cipherstash/stack@") && !tag.includes("stack-"),
  referencePathSegment: "stack",
};

const drizzleConfig: DocsConfig = {
  packageName: "@cipherstash/drizzle",
  repoUrl: "https://github.com/cipherstash/protectjs.git",
  tempDirName: ".tmp-drizzle",
  baseOutputDir: path.join(process.cwd(), "content/docs/reference/drizzle"),
  entryPoints: ["packages/drizzle/src/pg/index.ts"],
  tsconfigInclude: ["packages/drizzle/src/pg/**/*"],
  tagFilter: (tag: string) => tag.includes("@cipherstash/drizzle@"),
  referencePathSegment: "drizzle",
};

async function main() {
  console.log("=".repeat(60));
  console.log("CipherStash API Reference Documentation Generator");
  console.log("=".repeat(60));

  const localPath = process.env.PROTECT_WORKSPACE_PATH;
  if (localPath) {
    console.log(`\nUsing local workspace: ${localPath}`);
  } else {
    console.log("\nNo PROTECT_WORKSPACE_PATH set — will clone from GitHub");
  }

  const configs: DocsConfig[] = [stackConfig, drizzleConfig];

  for (const config of configs) {
    await generateDocs(config);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("All documentation generated successfully!");
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
