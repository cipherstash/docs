#!/usr/bin/env tsx
/** Generate the Drizzle ORM integration's API reference from Stack main. */
import path from "node:path";
import { type DocsConfig, generateDocs } from "./lib/docs-generator.js";

const drizzleConfig: DocsConfig = {
  packageName: "@cipherstash/stack-drizzle",
  projectName: "@cipherstash/stack-drizzle",
  repoUrl: "https://github.com/cipherstash/stack.git",
  sourceRef: "main",
  tempDirName: ".tmp-stack-drizzle",
  baseOutputDir: path.join(
    process.cwd(),
    "content/docs/integrations/drizzle/api-reference",
  ),
  publicPath: "/integrations/drizzle/api-reference",
  metaTitle: "API reference",
  versionedOutput: false,
  entryPointBasePath: "packages/stack-drizzle/src",
  entryModule: "index",
  router: "module",
  flattenOutputFiles: true,
  entryPoints: ["./packages/stack-drizzle/src/index.ts"],
  tsconfigInclude: ["packages/stack-drizzle/src/**/*"],
  tagFilter: () => false,
  referencePathSegment: "drizzle",
  frontmatterGlobals: {
    type: "reference",
    components: ["encryption", "eql"],
    audience: ["developer"],
  },
};

generateDocs(drizzleConfig).catch((error) => {
  console.error("Failed to generate the Drizzle API reference:", error);
  process.exit(1);
});
