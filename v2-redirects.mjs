// V2 IA redirect map (CIP-3325): every legacy /stack/* URL → its new home.
// Derived from the migration map in IA.md; completeness is enforced by
// `scripts/validate-v2-redirects.ts` (every content/stack page must match an
// entry here, exact or wildcard).
//
// Gated behind ENABLE_V2_REDIRECTS=1 in next.config.mjs: during the migration
// the preview site serves BOTH trees (legacy at /stack, v2 at the root), so
// unmigrated content stays reachable. The flag flips on at merge; once
// content/stack is deleted these entries become unconditional (CIP-3335).
//
// Conventions (matching next.config.mjs): sources/destinations omit the
// "/docs" basePath. Order matters — specific entries before wildcards.
//
// All entries are `permanent: false` (307) while the IA settles — browsers
// and crawlers cache 308s aggressively, and a mis-cached destination is hard
// to walk back. Flip to permanent once the map has soaked post-merge
// (CIP-3335).
export const v2Redirects = [
  // === Roots ===
  { source: "/stack", destination: "/", permanent: false },
  {
    source: "/stack/quickstart",
    destination: "/get-started/quickstart",
    permanent: false,
  },
  { source: "/stack/cipherstash", destination: "/", permanent: false },
  {
    source: "/stack/cipherstash/postgres",
    destination: "/reference/eql",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/supabase",
    destination: "/integrations/supabase",
    permanent: false,
  },

  // === Encryption SDK section → Reference/stack + new homes ===
  {
    source: "/stack/cipherstash/encryption",
    destination: "/reference/stack",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/encryption/searchable-encryption",
    destination: "/concepts/searchable-encryption",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/encryption/identity",
    destination: "/concepts/identity-aware-encryption",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/encryption/drizzle",
    destination: "/integrations/drizzle",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/encryption/prisma-next",
    destination: "/integrations/prisma-next",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/encryption/dynamodb",
    destination: "/integrations/aws/dynamodb",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/encryption/supabase",
    destination: "/reference/stack/supabase",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/encryption/indexes",
    destination: "/reference/eql/indexes",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/encryption/queries",
    destination: "/reference/eql/filtering",
    permanent: false,
  },
  // configuration, encrypt-decrypt, bulk-operations, models, schema, storing-data
  {
    source: "/stack/cipherstash/encryption/:path*",
    destination: "/reference/stack/:path*",
    permanent: false,
  },

  // === KMS section → Security + Reference/auth + Concepts ===
  {
    source: "/stack/cipherstash/kms",
    destination: "/security/zerokms",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/kms/cts",
    destination: "/security/cts",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/kms/oidc",
    destination: "/reference/auth/oidc-configuration",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/kms/access-keys",
    destination: "/reference/auth/access-keys",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/kms/clients",
    destination: "/reference/auth/clients",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/kms/disaster-recovery",
    destination: "/security/availability-and-continuity",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/kms/keysets",
    destination: "/concepts/key-management",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/kms/regions",
    destination: "/security/zerokms",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/kms/configuration",
    destination: "/reference/workspace/configuration",
    permanent: false,
  },

  // === Proxy section → Reference/proxy + new homes ===
  {
    source: "/stack/cipherstash/proxy",
    destination: "/reference/proxy",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/proxy/audit",
    destination: "/security/audit-logging",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/proxy/getting-started",
    destination: "/integrations/aws/rds-aurora",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/proxy/encrypt-tool",
    destination: "/guides/migration/encrypt-existing-data",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/proxy/searchable-json",
    destination: "/reference/eql/json",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/proxy/troubleshooting",
    destination: "/guides/troubleshooting/proxy",
    permanent: false,
  },
  // configuration, message-flow, multitenant
  {
    source: "/stack/cipherstash/proxy/:path*",
    destination: "/reference/proxy/:path*",
    permanent: false,
  },

  // === CLI section → Reference/cli ===
  {
    source: "/stack/cipherstash/cli",
    destination: "/reference/cli",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/cli/troubleshooting",
    destination: "/guides/troubleshooting/cli",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/cli/:path*",
    destination: "/reference/cli/:path*",
    permanent: false,
  },

  // === Deploy section → Guides ===
  {
    source: "/stack/deploy",
    destination: "/guides/deployment",
    permanent: false,
  },
  {
    source: "/stack/deploy/going-to-production",
    destination: "/guides/deployment/going-to-production",
    permanent: false,
  },
  {
    source: "/stack/deploy/aws-ecs",
    destination: "/guides/deployment/proxy-deployment",
    permanent: false,
  },
  {
    source: "/stack/deploy/bundling",
    destination: "/guides/deployment/serverless-and-bundling",
    permanent: false,
  },
  {
    source: "/stack/deploy/sst",
    destination: "/guides/deployment/serverless-and-bundling",
    permanent: false,
  },
  {
    source: "/stack/deploy/testing",
    destination: "/guides/development/testing-and-ci",
    permanent: false,
  },
  {
    source: "/stack/deploy/team-onboarding",
    destination: "/guides/development/team-onboarding",
    permanent: false,
  },
  {
    source: "/stack/deploy/troubleshooting",
    destination: "/guides/troubleshooting",
    permanent: false,
  },

  // === Reference section ===
  { source: "/stack/reference", destination: "/reference", permanent: false },
  {
    source: "/stack/reference/what-is-cipherstash",
    destination: "/get-started/what-is-cipherstash",
    permanent: false,
  },
  {
    source: "/stack/reference/security-architecture",
    destination: "/security/cryptography",
    permanent: false,
  },
  {
    source: "/stack/reference/compliance",
    destination: "/security/compliance",
    permanent: false,
  },
  {
    source: "/stack/reference/comparisons",
    destination: "/concepts/compare",
    permanent: false,
  },
  {
    source: "/stack/reference/comparisons/:path*",
    destination: "/concepts/compare/:path*",
    permanent: false,
  },
  {
    source: "/stack/reference/use-cases",
    destination: "/solutions",
    permanent: false,
  },
  {
    // The AI/RAG page is not part of the v2 tree yet (it needs a rewrite before
    // it can be republished), so send its legacy URL to the Solutions index
    // rather than a page that does not exist.
    source: "/stack/reference/use-cases/ai-rag",
    destination: "/solutions",
    permanent: false,
  },
  {
    source: "/stack/reference/use-cases/compliance",
    destination: "/security/compliance",
    permanent: false,
  },
  {
    source: "/stack/reference/use-cases/:path*",
    destination: "/solutions/:path*",
    permanent: false,
  },
  {
    source: "/stack/reference/billing",
    destination: "/reference/workspace/billing",
    permanent: false,
  },
  {
    source: "/stack/reference/members",
    destination: "/reference/workspace/members",
    permanent: false,
  },
  {
    source: "/stack/reference/cipher-cell",
    destination: "/reference/eql/core-concepts",
    permanent: false,
  },
  {
    source: "/stack/reference/eql-guide",
    destination: "/reference/eql",
    permanent: false,
  },
  {
    source: "/stack/reference/eql",
    destination: "/reference/eql",
    permanent: false,
  },
  {
    source: "/stack/reference/eql/:path*",
    destination: "/reference/eql/:path*",
    permanent: false,
  },
  {
    source: "/stack/reference/encryption-sdk",
    destination: "/reference/stack",
    permanent: false,
  },
  {
    source: "/stack/reference/error-handling",
    destination: "/reference/stack/errors",
    permanent: false,
  },
  // NOTE: legacy "migration" page is the @cipherstash/protect→stack package
  // rename guide, NOT data migration (see IA.md).
  {
    source: "/stack/reference/migration",
    destination: "/reference/stack/upgrading-from-protect",
    permanent: false,
  },
  {
    source: "/stack/reference/proxy-errors",
    destination: "/reference/proxy/errors",
    permanent: false,
  },
  {
    source: "/stack/reference/proxy-reference",
    destination: "/reference/proxy/configuration",
    permanent: false,
  },
  {
    source: "/stack/reference/drizzle",
    destination: "/integrations/drizzle",
    permanent: false,
  },
  {
    source: "/stack/reference/dashboard-supabase-integration",
    destination: "/integrations/supabase",
    permanent: false,
  },
  {
    source: "/stack/reference/discovery-session",
    destination: "/get-started/choose-your-stack",
    permanent: false,
  },
  {
    source: "/stack/reference/planning-guide",
    destination: "/get-started/choose-your-stack",
    permanent: false,
  },
  {
    source: "/stack/reference/supported-solutions",
    destination: "/integrations",
    permanent: false,
  },
  {
    source: "/stack/reference/agent-skills",
    destination: "/reference/agent-skills",
    permanent: false,
  },
  {
    source: "/stack/reference/glossary",
    destination: "/reference/glossary",
    permanent: false,
  },
  // Generated TypeDoc API reference (scripts/generate-docs.ts output)
  {
    source: "/stack/reference/stack/:path*",
    destination: "/reference/stack/:path*",
    permanent: false,
  },
];
