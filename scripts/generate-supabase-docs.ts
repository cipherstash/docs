#!/usr/bin/env tsx
/** Generate the Supabase integration's API reference from Stack main. */
import path from "node:path";
import { type DocsConfig, generateDocs } from "./lib/docs-generator.js";

const supabaseConfig: DocsConfig = {
  packageName: "@cipherstash/stack-supabase",
  projectName: "@cipherstash/stack-supabase",
  repoUrl: "https://github.com/cipherstash/stack.git",
  sourceRef: "main",
  tempDirName: ".tmp-stack-supabase",
  baseOutputDir: path.join(
    process.cwd(),
    "content/docs/integrations/supabase/api-reference",
  ),
  publicPath: "/integrations/supabase/api-reference",
  metaTitle: "API reference",
  versionedOutput: false,
  entryPointBasePath: "packages/stack-supabase/src",
  entryModule: "index",
  router: "module",
  flattenOutputFiles: true,
  entryPoints: ["./packages/stack-supabase/src/index.ts"],
  tsconfigInclude: ["packages/stack-supabase/src/**/*"],
  tagFilter: () => false,
  referencePathSegment: "supabase",
  frontmatterGlobals: {
    type: "reference",
    components: ["encryption", "eql", "platform"],
    audience: ["developer"],
  },
};

generateDocs(supabaseConfig).catch((error) => {
  console.error("Failed to generate the Supabase API reference:", error);
  process.exit(1);
});
