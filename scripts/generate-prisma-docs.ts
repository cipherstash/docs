#!/usr/bin/env tsx
/** Generate the Prisma ORM integration's API reference from Stack main. */
import path from "node:path";
import { type DocsConfig, generateDocs } from "./lib/docs-generator.js";

const prismaConfig: DocsConfig = {
  packageName: "@cipherstash/stack-prisma",
  projectName: "@cipherstash/stack-prisma",
  repoUrl: "https://github.com/cipherstash/stack.git",
  sourceRef: "main",
  tempDirName: ".tmp-stack-prisma",
  baseOutputDir: path.join(
    process.cwd(),
    "content/docs/integrations/prisma/api-reference",
  ),
  publicPath: "/integrations/prisma/api-reference",
  metaTitle: "API reference",
  versionedOutput: false,
  entryPointBasePath: "packages/stack-prisma/src/exports",
  router: "module",
  flattenOutputFiles: true,
  entryPoints: [
    "./packages/stack-prisma/src/exports/codec-types.ts",
    "./packages/stack-prisma/src/exports/column-types.ts",
    "./packages/stack-prisma/src/exports/control.ts",
    "./packages/stack-prisma/src/exports/operation-types.ts",
    "./packages/stack-prisma/src/exports/pack.ts",
    "./packages/stack-prisma/src/exports/runtime.ts",
    "./packages/stack-prisma/src/exports/stack.ts",
    "./packages/stack-prisma/src/exports/v3.ts",
  ],
  tsconfigInclude: ["packages/stack-prisma/src/**/*"],
  tagFilter: () => false,
  referencePathSegment: "prisma",
  frontmatterGlobals: {
    type: "reference",
    components: ["encryption", "eql"],
    audience: ["developer"],
  },
};

generateDocs(prismaConfig).catch((error) => {
  console.error("Failed to generate the Prisma API reference:", error);
  process.exit(1);
});
