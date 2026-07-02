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
export const v2Redirects = [
  // === Roots ===
  { source: "/stack", destination: "/", permanent: true },
  {
    source: "/stack/quickstart",
    destination: "/get-started/quickstart",
    permanent: true,
  },
  { source: "/stack/cipherstash", destination: "/", permanent: true },
  {
    source: "/stack/cipherstash/postgres",
    destination: "/reference/eql",
    permanent: true,
  },
  {
    source: "/stack/cipherstash/supabase",
    destination: "/integrations/supabase",
    permanent: true,
  },

  // === Encryption SDK section → Reference/stack + new homes ===
  {
    source: "/stack/cipherstash/encryption",
    destination: "/reference/stack",
    permanent: true,
  },
  {
    source: "/stack/cipherstash/encryption/searchable-encryption",
    destination: "/concepts/searchable-encryption",
    permanent: true,
  },
  {
    source: "/stack/cipherstash/encryption/identity",
    destination: "/concepts/identity-aware-encryption",
    permanent: true,
  },
  {
    source: "/stack/cipherstash/encryption/drizzle",
    destination: "/integrations/drizzle",
    permanent: true,
  },
  {
    source: "/stack/cipherstash/encryption/prisma-next",
    destination: "/integrations/prisma-next",
    permanent: true,
  },
  {
    source: "/stack/cipherstash/encryption/dynamodb",
    destination: "/integrations/aws/dynamodb",
    permanent: true,
  },
  {
    source: "/stack/cipherstash/encryption/supabase",
    destination: "/reference/stack/supabase",
    permanent: true,
  },
  {
    source: "/stack/cipherstash/encryption/indexes",
    destination: "/reference/eql/indexes",
    permanent: true,
  },
  {
    source: "/stack/cipherstash/encryption/queries",
    destination: "/reference/eql/operators",
    permanent: true,
  },
  // configuration, encrypt-decrypt, bulk-operations, models, schema, storing-data
  {
    source: "/stack/cipherstash/encryption/:path*",
    destination: "/reference/stack/:path*",
    permanent: true,
  },

  // === KMS section → Security + Reference/auth + Concepts ===
  {
    source: "/stack/cipherstash/kms",
    destination: "/security/zerokms",
    permanent: true,
  },
  {
    source: "/stack/cipherstash/kms/cts",
    destination: "/security/cts",
    permanent: true,
  },
  {
    source: "/stack/cipherstash/kms/oidc",
    destination: "/reference/auth/oidc-configuration",
    permanent: true,
  },
  {
    source: "/stack/cipherstash/kms/access-keys",
    destination: "/reference/auth/access-keys",
    permanent: true,
  },
  {
    source: "/stack/cipherstash/kms/clients",
    destination: "/reference/auth/clients",
    permanent: true,
  },
  {
    source: "/stack/cipherstash/kms/disaster-recovery",
    destination: "/security/availability-and-continuity",
    permanent: true,
  },
  {
    source: "/stack/cipherstash/kms/keysets",
    destination: "/concepts/key-management",
    permanent: true,
  },
  {
    source: "/stack/cipherstash/kms/regions",
    destination: "/security/zerokms",
    permanent: true,
  },
  {
    source: "/stack/cipherstash/kms/configuration",
    destination: "/reference/workspace/configuration",
    permanent: true,
  },

  // === Proxy section → Reference/proxy + new homes ===
  {
    source: "/stack/cipherstash/proxy",
    destination: "/reference/proxy",
    permanent: true,
  },
  {
    source: "/stack/cipherstash/proxy/audit",
    destination: "/security/audit-logging",
    permanent: true,
  },
  {
    source: "/stack/cipherstash/proxy/getting-started",
    destination: "/integrations/aws/rds-aurora",
    permanent: true,
  },
  {
    source: "/stack/cipherstash/proxy/encrypt-tool",
    destination: "/guides/migration/encrypt-existing-data",
    permanent: true,
  },
  {
    source: "/stack/cipherstash/proxy/searchable-json",
    destination: "/reference/eql/json",
    permanent: true,
  },
  {
    source: "/stack/cipherstash/proxy/troubleshooting",
    destination: "/guides/troubleshooting/proxy",
    permanent: true,
  },
  // configuration, message-flow, multitenant
  {
    source: "/stack/cipherstash/proxy/:path*",
    destination: "/reference/proxy/:path*",
    permanent: true,
  },

  // === CLI section → Reference/cli ===
  {
    source: "/stack/cipherstash/cli",
    destination: "/reference/cli",
    permanent: true,
  },
  {
    source: "/stack/cipherstash/cli/troubleshooting",
    destination: "/guides/troubleshooting/cli",
    permanent: true,
  },
  {
    source: "/stack/cipherstash/cli/:path*",
    destination: "/reference/cli/:path*",
    permanent: true,
  },

  // === Deploy section → Guides ===
  {
    source: "/stack/deploy",
    destination: "/guides/deployment",
    permanent: true,
  },
  {
    source: "/stack/deploy/going-to-production",
    destination: "/guides/deployment/going-to-production",
    permanent: true,
  },
  {
    source: "/stack/deploy/aws-ecs",
    destination: "/guides/deployment/proxy-deployment",
    permanent: true,
  },
  {
    source: "/stack/deploy/bundling",
    destination: "/guides/deployment/serverless-and-bundling",
    permanent: true,
  },
  {
    source: "/stack/deploy/sst",
    destination: "/guides/deployment/serverless-and-bundling",
    permanent: true,
  },
  {
    source: "/stack/deploy/testing",
    destination: "/guides/development/testing-and-ci",
    permanent: true,
  },
  {
    source: "/stack/deploy/team-onboarding",
    destination: "/guides/development/team-onboarding",
    permanent: true,
  },
  {
    source: "/stack/deploy/troubleshooting",
    destination: "/guides/troubleshooting",
    permanent: true,
  },

  // === Reference section ===
  { source: "/stack/reference", destination: "/reference", permanent: true },
  {
    source: "/stack/reference/what-is-cipherstash",
    destination: "/get-started/what-is-cipherstash",
    permanent: true,
  },
  {
    source: "/stack/reference/security-architecture",
    destination: "/security/architecture",
    permanent: true,
  },
  {
    source: "/stack/reference/compliance",
    destination: "/security/compliance",
    permanent: true,
  },
  {
    source: "/stack/reference/comparisons",
    destination: "/compare",
    permanent: true,
  },
  {
    source: "/stack/reference/comparisons/:path*",
    destination: "/compare/:path*",
    permanent: true,
  },
  {
    source: "/stack/reference/use-cases",
    destination: "/solutions",
    permanent: true,
  },
  {
    source: "/stack/reference/use-cases/ai-rag",
    destination: "/solutions/ai-and-rag",
    permanent: true,
  },
  {
    source: "/stack/reference/use-cases/compliance",
    destination: "/security/compliance",
    permanent: true,
  },
  {
    source: "/stack/reference/use-cases/:path*",
    destination: "/solutions/:path*",
    permanent: true,
  },
  {
    source: "/stack/reference/billing",
    destination: "/reference/workspace/billing",
    permanent: true,
  },
  {
    source: "/stack/reference/members",
    destination: "/reference/workspace/members",
    permanent: true,
  },
  {
    source: "/stack/reference/cipher-cell",
    destination: "/reference/eql/payload-format",
    permanent: true,
  },
  {
    source: "/stack/reference/eql-guide",
    destination: "/reference/eql",
    permanent: true,
  },
  {
    source: "/stack/reference/eql",
    destination: "/reference/eql",
    permanent: true,
  },
  {
    source: "/stack/reference/eql/:path*",
    destination: "/reference/eql/:path*",
    permanent: true,
  },
  {
    source: "/stack/reference/encryption-sdk",
    destination: "/reference/stack",
    permanent: true,
  },
  {
    source: "/stack/reference/error-handling",
    destination: "/reference/stack/errors",
    permanent: true,
  },
  // NOTE: legacy "migration" page is the @cipherstash/protect→stack package
  // rename guide, NOT data migration (see IA.md).
  {
    source: "/stack/reference/migration",
    destination: "/reference/stack/upgrading-from-protect",
    permanent: true,
  },
  {
    source: "/stack/reference/proxy-errors",
    destination: "/reference/proxy/errors",
    permanent: true,
  },
  {
    source: "/stack/reference/proxy-reference",
    destination: "/reference/proxy/configuration",
    permanent: true,
  },
  {
    source: "/stack/reference/drizzle",
    destination: "/integrations/drizzle",
    permanent: true,
  },
  {
    source: "/stack/reference/dashboard-supabase-integration",
    destination: "/integrations/supabase",
    permanent: true,
  },
  {
    source: "/stack/reference/discovery-session",
    destination: "/get-started/choose-your-stack",
    permanent: true,
  },
  {
    source: "/stack/reference/planning-guide",
    destination: "/get-started/choose-your-stack",
    permanent: true,
  },
  {
    source: "/stack/reference/supported-solutions",
    destination: "/integrations",
    permanent: true,
  },
  {
    source: "/stack/reference/agent-skills",
    destination: "/reference/agent-skills",
    permanent: true,
  },
  {
    source: "/stack/reference/glossary",
    destination: "/reference/glossary",
    permanent: true,
  },
  // Generated TypeDoc API reference (scripts/generate-docs.ts output)
  {
    source: "/stack/reference/stack/:path*",
    destination: "/reference/stack/:path*",
    permanent: true,
  },
];
