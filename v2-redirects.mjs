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
    destination: "/solutions/provable-access",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/encryption/drizzle",
    destination: "/integrations/drizzle",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/encryption/prisma-next",
    destination: "/integrations/prisma",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/encryption/dynamodb",
    destination: "/integrations/aws/dynamodb",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/encryption/supabase",
    destination: "/integrations/supabase",
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
  {
    source: "/stack/cipherstash/encryption/configuration",
    destination: "/reference/workspace/configuration",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/encryption/encrypt-decrypt",
    destination: "/reference/stack/usage",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/encryption/storing-data",
    destination: "/reference/stack/usage",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/encryption/schema",
    destination: "/reference/stack/api-reference/schema",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/encryption/models",
    destination: "/reference/stack/api-reference/encryption",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/encryption/bulk-operations",
    destination: "/reference/stack/api-reference/encryption",
    permanent: false,
  },
  // Any retired Encryption SDK leaf falls back to the current usage guide.
  {
    source: "/stack/cipherstash/encryption/:path*",
    destination: "/reference/stack/usage",
    permanent: false,
  },

  // === KMS section → Security + Reference/auth + Concepts ===
  {
    source: "/stack/cipherstash/kms",
    destination: "/concepts/key-management",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/kms/cts",
    destination: "/concepts/auth",
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
    destination: "/concepts/key-management",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/kms/keysets",
    destination: "/concepts/key-management",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/kms/regions",
    destination: "/solutions/data-residency",
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
    destination: "/concepts/access-analytics",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/proxy/getting-started",
    destination: "/reference/proxy",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/proxy/encrypt-tool",
    destination: "/guides/migration",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/proxy/searchable-json",
    destination: "/reference/eql/json",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/proxy/troubleshooting",
    destination: "/reference/proxy/errors",
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
    destination: "/reference/cli/doctor",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/cli/api",
    destination: "/reference/cli",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/cli/install",
    destination: "/reference/cli/eql",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/cli/push",
    destination: "/reference/cli",
    permanent: false,
  },
  {
    source: "/stack/cipherstash/cli/validate",
    destination: "/reference/cli/db",
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
    destination: "/guides/deployment",
    permanent: false,
  },
  {
    source: "/stack/deploy/aws-ecs",
    destination: "/guides/deployment",
    permanent: false,
  },
  {
    source: "/stack/deploy/bundling",
    destination: "/guides/deployment",
    permanent: false,
  },
  {
    source: "/stack/deploy/sst",
    destination: "/guides/deployment",
    permanent: false,
  },
  {
    source: "/stack/deploy/testing",
    destination: "/guides/deployment",
    permanent: false,
  },
  {
    source: "/stack/deploy/team-onboarding",
    destination: "/guides/deployment",
    permanent: false,
  },
  {
    source: "/stack/deploy/troubleshooting",
    destination: "/guides/deployment",
    permanent: false,
  },

  // === Reference section ===
  {
    source: "/stack/reference",
    destination: "/reference/eql",
    permanent: false,
  },
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
    destination: "/solutions/ai-and-rag",
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
    destination: "/reference/stack/api-reference/errors",
    permanent: false,
  },
  // NOTE: legacy "migration" page is the @cipherstash/protect→stack package
  // rename guide, NOT data migration (see IA.md).
  {
    source: "/stack/reference/migration",
    destination: "/reference/stack/usage",
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
  // The legacy generator placed the Supabase wrapper beneath Stack. Its v2
  // reference is owned by the Supabase integration instead.
  {
    source: "/stack/reference/stack/latest/packages/stack-supabase/:path*",
    destination: "/integrations/supabase/api-reference",
    permanent: false,
  },
  {
    source: "/stack/reference/stack/:path*",
    destination: "/reference/stack/api-reference",
    permanent: false,
  },
];
