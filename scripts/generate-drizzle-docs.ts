#!/usr/bin/env tsx
import path from "node:path";
import { type DocsConfig, generateDocs } from "./lib/docs-generator.js";

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
  try {
    await generateDocs(drizzleConfig);
  } catch (error) {
    console.error(
      "\nError generating @cipherstash/drizzle documentation:",
      error,
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
