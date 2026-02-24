#!/usr/bin/env tsx
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

async function main() {
  try {
    await generateDocs(stackConfig);
  } catch (error) {
    console.error(
      "\nError generating @cipherstash/stack documentation:",
      error,
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
